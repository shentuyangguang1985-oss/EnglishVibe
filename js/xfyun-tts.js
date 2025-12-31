/**
 * 讯飞语音合成 WebSocket API
 * 文档：https://www.xfyun.cn/doc/tts/online_tts/API.html
 */

const XfyunTTS = {
  // API配置（从Storage读取）
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
   * 生成鉴权URL
   */
  getAuthUrl() {
    var host = 'tts-api.xfyun.cn';
    var path = '/v2/tts';
    var date = new Date().toUTCString();
    
    // 构建签名原文（注意：每行末尾没有空格）
    var signatureOrigin = 'host: ' + host + '\n' + 'date: ' + date + '\n' + 'GET ' + path + ' HTTP/1.1';
    
    console.log('签名原文:', signatureOrigin);
    console.log('API Secret:', this.config.apiSecret);
    
    // HMAC-SHA256签名
    var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.config.apiSecret);
    var signature = CryptoJS.enc.Base64.stringify(signatureSha);
    
    console.log('签名结果:', signature);
    
    // 构建authorization（使用单引号避免问题）
    var authorizationOrigin = 'api_key="' + this.config.apiKey + '", algorithm="hmac-sha256", headers="host date request-line", signature="' + signature + '"';
    
    console.log('Authorization原文:', authorizationOrigin);
    
    // Base64编码
    var authorization = btoa(authorizationOrigin);
    
    // 构建完整URL
    var url = 'wss://' + host + path + '?authorization=' + authorization + '&date=' + encodeURIComponent(date) + '&host=' + host;
    
    console.log('完整URL:', url);
    
    return url;
  },

  /**
   * 播放文本
   * @param {string} text - 要合成的文本
   * @param {Object} options - 配置选项
   */
  speak(text, options) {
    options = options || {};
    this.onEnd = options.onEnd || null;
    this.onError = options.onError || null;
    
    if (!this.isConfigured()) {
      console.warn('讯飞TTS未配置');
      if (this.onError) this.onError(new Error('讯飞TTS未配置'));
      return;
    }

    // 关闭之前的连接
    this.close();
    
    // 清空音频缓存
    this.audioData = [];

    try {
      const url = this.getAuthUrl();
      console.log('讯飞TTS连接中...');
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('讯飞TTS连接成功');
        this.sendText(text);
      };
      
      this.ws.onmessage = (e) => {
        this.handleMessage(e.data);
      };
      
      this.ws.onerror = (e) => {
        console.error('讯飞TTS连接错误:', e);
        if (this.onError) this.onError(e);
      };
      
      this.ws.onclose = () => {
        console.log('讯飞TTS连接关闭');
      };
      
    } catch (e) {
      console.error('讯飞TTS异常:', e);
      if (this.onError) this.onError(e);
    }
  },

  /**
   * 发送文本到讯飞
   */
  sendText(text) {
    const params = {
      common: {
        app_id: this.config.appId
      },
      business: {
        aue: 'lame',        // MP3格式
        auf: 'audio/L16;rate=16000',
        vcn: 'x2_engam_laura',  // 英语发音人（美式女声）
        speed: 50,          // 语速（0-100）
        volume: 50,         // 音量（0-100）
        pitch: 50,          // 音高（0-100）
        tte: 'UTF8'
      },
      data: {
        status: 2,          // 一次性发送完整文本
        text: btoa(unescape(encodeURIComponent(text)))  // Base64编码
      }
    };
    
    console.log('讯飞TTS发送文本:', text);
    this.ws.send(JSON.stringify(params));
  },

  /**
   * 处理返回消息
   */
  handleMessage(data) {
    try {
      const res = JSON.parse(data);
      
      if (res.code !== 0) {
        console.error('讯飞TTS错误:', res.code, res.message);
        if (this.onError) this.onError(new Error(res.message));
        this.close();
        return;
      }
      
      // 收集音频数据
      if (res.data && res.data.audio) {
        this.audioData.push(res.data.audio);
      }
      
      // 合成完成
      if (res.data && res.data.status === 2) {
        console.log('讯飞TTS合成完成');
        this.playAudio();
        this.close();
      }
      
    } catch (e) {
      console.error('讯飞TTS解析错误:', e);
    }
  },

  /**
   * 播放音频
   */
  playAudio() {
    if (this.audioData.length === 0) {
      console.warn('讯飞TTS无音频数据');
      return;
    }
    
    // 合并所有音频数据
    const audioBase64 = this.audioData.join('');
    const audioUrl = 'data:audio/mp3;base64,' + audioBase64;
    
    const audio = new window.Audio(audioUrl);
    audio.onended = () => {
      console.log('讯飞TTS播放完成');
      if (this.onEnd) this.onEnd();
    };
    audio.onerror = (e) => {
      console.error('讯飞TTS播放错误:', e);
      if (this.onError) this.onError(e);
    };
    
    audio.play().catch(e => {
      console.error('讯飞TTS播放失败:', e);
      if (this.onError) this.onError(e);
    });
  },

  /**
   * 关闭连接
   */
  close() {
    if (this.ws) {
      this.ws.close();
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

