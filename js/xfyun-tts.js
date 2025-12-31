/**
 * 讯飞语音合成 WebSocket API
 * 文档：https://www.xfyun.cn/doc/tts/online_tts/API.html
 */

const XfyunTTS = {
  // API配置
  config: {
    appId: '',
    apiKey: '',
    apiSecret: ''
  },

  // 当前WebSocket连接
  ws: null,
  
  // 音频数据缓存
  audioData: [],
  
  // 回调函数
  onEnd: null,
  onError: null,

  /**
   * 初始化配置
   */
  init() {
    const settings = Storage.getSettings();
    if (settings.xfyunAppId && settings.xfyunApiKey && settings.xfyunApiSecret) {
      this.config.appId = settings.xfyunAppId;
      this.config.apiKey = settings.xfyunApiKey;
      this.config.apiSecret = settings.xfyunApiSecret;
      return true;
    }
    return false;
  },

  /**
   * 检查是否已配置
   */
  isConfigured() {
    return this.config.appId && this.config.apiKey && this.config.apiSecret;
  },

  /**
   * 生成鉴权URL（严格按照官方文档）
   * 参考：https://www.xfyun.cn/doc/tts/online_tts/API.html
   */
  getAuthUrl() {
    const host = 'tts-api.xfyun.cn';
    const path = '/v2/tts';
    
    // 1. 生成RFC1123格式的时间戳
    const date = new Date().toUTCString();
    
    // 2. 构建签名原文（signature_origin）
    // 格式：host: xxx\ndate: xxx\nGET /v2/tts HTTP/1.1
    const signatureOrigin = 'host: ' + host + '\n' + 
                           'date: ' + date + '\n' + 
                           'GET ' + path + ' HTTP/1.1';
    
    console.log('[讯飞TTS] 签名原文:', JSON.stringify(signatureOrigin));
    
    // 3. 使用 HMAC-SHA256 算法，以 api_secret 为密钥对签名原文进行签名
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.config.apiSecret);
    
    // 4. 对签名结果进行 Base64 编码
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    
    console.log('[讯飞TTS] 签名结果:', signature);
    
    // 5. 构建 authorization_origin
    // 格式：api_key="xxx", algorithm="hmac-sha256", headers="host date request-line", signature="xxx"
    const authorizationOrigin = 'api_key="' + this.config.apiKey + 
                               '", algorithm="hmac-sha256"' + 
                               ', headers="host date request-line"' + 
                               ', signature="' + signature + '"';
    
    console.log('[讯飞TTS] Authorization原文:', authorizationOrigin);
    
    // 6. 对 authorization_origin 进行 Base64 编码
    const authorization = btoa(authorizationOrigin);
    
    // 7. 构建完整的 WebSocket URL
    // 注意：date 需要进行 URL 编码
    const url = 'wss://' + host + path + 
               '?authorization=' + authorization + 
               '&date=' + encodeURIComponent(date) + 
               '&host=' + host;
    
    console.log('[讯飞TTS] 完整URL:', url.substring(0, 200) + '...');
    
    return url;
  },

  /**
   * 播放文本
   * @param {string} text - 要合成的文本
   * @param {Object} options - 配置选项
   */
  speak(text, options) {
    options = options || {};
    var self = this;
    
    this.onEnd = options.onEnd || null;
    this.onError = options.onError || null;
    
    if (!this.isConfigured()) {
      console.warn('[讯飞TTS] 未配置API密钥');
      if (this.onError) this.onError(new Error('讯飞TTS未配置'));
      return;
    }

    // 关闭之前的连接
    this.close();
    
    // 清空音频缓存
    this.audioData = [];

    try {
      const url = this.getAuthUrl();
      console.log('[讯飞TTS] 正在连接...');
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = function() {
        console.log('[讯飞TTS] WebSocket连接成功');
        self.sendText(text);
      };
      
      this.ws.onmessage = function(e) {
        self.handleMessage(e.data);
      };
      
      this.ws.onerror = function(e) {
        console.error('[讯飞TTS] WebSocket错误:', e);
        if (self.onError) self.onError(new Error('WebSocket连接失败'));
      };
      
      this.ws.onclose = function(e) {
        console.log('[讯飞TTS] WebSocket关闭, code:', e.code, 'reason:', e.reason);
      };
      
    } catch (e) {
      console.error('[讯飞TTS] 异常:', e);
      if (this.onError) this.onError(e);
    }
  },

  /**
   * 发送文本到讯飞进行合成
   */
  sendText(text) {
    // 文本需要Base64编码
    // 先将文本转为UTF-8字节，再Base64编码
    const textBase64 = this.textToBase64(text);
    
    const params = {
      common: {
        app_id: this.config.appId
      },
      business: {
        aue: 'lame',        // MP3格式
        auf: 'audio/L16;rate=16000',  // 音频采样率
        vcn: 'x4_enus_luna_assist',  // Luna英语女声（正确参数）
        speed: 50,          // 语速
        volume: 100,        // 音量最大
        pitch: 50,          // 音高
        tte: 'UTF8'         // 文本编码
      },
      data: {
        status: 2,          // 2表示一次性发送完整文本
        text: textBase64    // Base64编码后的文本
      }
    };
    
    console.log('[讯飞TTS] 发送文本:', text);
    console.log('[讯飞TTS] 请求参数:', JSON.stringify(params, null, 2));
    
    this.ws.send(JSON.stringify(params));
  },

  /**
   * 文本转Base64（处理UTF-8编码）
   */
  textToBase64(text) {
    // 使用 encodeURIComponent 处理 Unicode 字符
    // 然后用 unescape 转换回字节字符串
    // 最后用 btoa 进行 Base64 编码
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
      console.error('[讯飞TTS] Base64编码失败:', e);
      // 降级方案：直接返回简单的Base64
      return btoa(text);
    }
  },

  /**
   * 处理返回消息
   */
  handleMessage(data) {
    try {
      const res = JSON.parse(data);
      
      console.log('[讯飞TTS] 收到消息:', res.code, res.message || '');
      
      if (res.code !== 0) {
        console.error('[讯飞TTS] 服务端错误:', res.code, res.message);
        if (this.onError) this.onError(new Error('讯飞错误[' + res.code + ']: ' + res.message));
        this.close();
        return;
      }
      
      // 收集音频数据
      if (res.data && res.data.audio) {
        this.audioData.push(res.data.audio);
      }
      
      // status=2 表示合成完成
      if (res.data && res.data.status === 2) {
        console.log('[讯飞TTS] 合成完成，共收到', this.audioData.length, '个音频片段');
        this.playAudio();
        this.close();
      }
      
    } catch (e) {
      console.error('[讯飞TTS] 解析响应失败:', e);
    }
  },

  /**
   * 播放合成的音频
   */
  playAudio() {
    var self = this;
    
    if (this.audioData.length === 0) {
      console.warn('[讯飞TTS] 无音频数据');
      if (this.onError) this.onError(new Error('无音频数据'));
      return;
    }
    
    console.log('[讯飞TTS] 播放音频，片段数:', this.audioData.length);
    
    try {
      // 逐个解码Base64片段，然后合并二进制数据
      var allBytes = [];
      for (var i = 0; i < this.audioData.length; i++) {
        var chunk = this.audioData[i];
        try {
          var binaryString = atob(chunk);
          for (var j = 0; j < binaryString.length; j++) {
            allBytes.push(binaryString.charCodeAt(j));
          }
        } catch (e) {
          console.warn('[讯飞TTS] 片段', i, '解码失败:', e);
        }
      }
      
      console.log('[讯飞TTS] 合并后字节数:', allBytes.length);
      
      if (allBytes.length === 0) {
        throw new Error('无有效音频数据');
      }
      
      // 创建Blob并播放
      var bytes = new Uint8Array(allBytes);
      var blob = new Blob([bytes], { type: 'audio/mp3' });
      var audioUrl = URL.createObjectURL(blob);
      
      console.log('[讯飞TTS] 创建Blob URL成功');
      
      var audio = new window.Audio(audioUrl);
      
      audio.onended = function() {
        console.log('[讯飞TTS] 播放完成');
        URL.revokeObjectURL(audioUrl);
        if (self.onEnd) self.onEnd();
      };
      
      audio.onerror = function(e) {
        console.error('[讯飞TTS] 播放错误:', e);
        URL.revokeObjectURL(audioUrl);
        if (self.onError) self.onError(e);
      };
      
      audio.play().then(function() {
        console.log('[讯飞TTS] 开始播放');
      }).catch(function(e) {
        console.error('[讯飞TTS] 播放失败:', e);
        URL.revokeObjectURL(audioUrl);
        if (self.onError) self.onError(e);
      });
      
    } catch (e) {
      console.error('[讯飞TTS] 音频处理异常:', e);
      if (self.onError) self.onError(e);
    }
  },

  /**
   * 关闭WebSocket连接
   */
  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // 忽略关闭错误
      }
      this.ws = null;
    }
  },

  /**
   * 停止播放
   */
  stop() {
    this.close();
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = XfyunTTS;
}
