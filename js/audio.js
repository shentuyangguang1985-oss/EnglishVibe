/**
 * EnglishVibe - 音频模块
 * 使用有道词典真人发音 + Web Speech API 备用
 */

const Audio = {
  // 当前音频实例
  currentAudio: null,
  
  // 发音类型：us(美式) / uk(英式)
  accent: 'us',

  // 重复播放计数
  repeatCount: 0,
  repeatTarget: 2,  // 默认读2遍
  
  // 例句播放状态（防抖）
  sentencePlayingId: 0,
  lastSentenceTime: 0,

  /**
   * 播放单词发音（使用有道词典API）
   * @param {string} word - 要发音的单词
   * @param {Object} options - 配置选项
   */
  speak(word, options = {}) {
    // 停止当前播放
    this.stop();
    
    // 重置重复计数
    const repeat = options.repeat !== undefined ? options.repeat : this.repeatTarget;
    this.repeatCount = 0;
    
    // 开始播放
    this._playOnce(word, options, repeat);
  },

  /**
   * 播放一次发音
   * @private
   */
  _playOnce(word, options, totalRepeat) {
    console.log('_playOnce called with word:', word);
    var self = this;
    options = options || {};
    var accent = options.accent || this.accent;
    
    // 有道词典发音接口
    // type=1 英式, type=2 美式
    var type = accent === 'uk' ? 1 : 2;
    var url = 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(word) + '&type=' + type;
    
    console.log('_playOnce URL:', url);
    
    try {
      this.currentAudio = new window.Audio(url);
      this.currentAudio.volume = options.volume || 1;
      
      this.currentAudio.onended = function() {
        self.repeatCount++;
        if (self.repeatCount < totalRepeat) {
          // 间隔250ms后播放下一遍
          setTimeout(function() {
            self._playOnce(word, options, totalRepeat);
          }, 250);
        } else {
          // 全部播放完成
          if (options.onEnd) options.onEnd();
        }
      };
      
      this.currentAudio.onerror = function(e) {
        console.error('Audio error event:', e);
        console.error('Audio error code:', self.currentAudio.error ? self.currentAudio.error.code : 'unknown');
        console.warn('Youdao audio failed, trying backup...');
        // 备用方案：使用 Web Speech API
        var backupOptions = { volume: options.volume, repeat: totalRepeat - self.repeatCount };
        self.speakWithSpeechAPI(word, backupOptions);
      };
      
      this.currentAudio.onloadstart = function() {
        console.log('Audio loading started');
      };
      
      this.currentAudio.oncanplay = function() {
        console.log('Audio can play now');
      };
      
      var playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(function() {
          console.log('Audio playing successfully!');
        }).catch(function(e) {
          console.warn('Audio play failed:', e);
          // 备用方案
          var backupOptions = { volume: options.volume, repeat: totalRepeat - self.repeatCount };
          self.speakWithSpeechAPI(word, backupOptions);
        });
      } else {
        console.log('Audio play returned undefined (older browser)');
      }
      
    } catch (e) {
      console.warn('Audio error:', e);
      var backupOptions = { volume: options.volume, repeat: totalRepeat - this.repeatCount };
      this.speakWithSpeechAPI(word, backupOptions);
    }
  },

  /**
   * 使用 Web Speech API 发音（备用方案）
   */
  speakWithSpeechAPI(word, options) {
    options = options || {};
    var self = this;
    var synth = window.speechSynthesis;
    
    if (!synth) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // 取消任何正在进行的语音
    synth.cancel();
    
    var repeat = options.repeat || 1;
    var currentRepeat = 0;
    
    var playOnce = function() {
      // 再次取消以确保干净状态
      synth.cancel();
      
      var utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = options.volume || 1;

      // 尝试获取英语语音
      var voices = synth.getVoices();
      console.log('Available voices:', voices.length);
      
      var englishVoice = null;
      for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang === 'en-US' || voices[i].lang === 'en-GB') {
          englishVoice = voices[i];
          break;
        }
      }
      if (!englishVoice) {
        for (var i = 0; i < voices.length; i++) {
          if (voices[i].lang.indexOf('en') === 0) {
            englishVoice = voices[i];
            break;
          }
        }
      }
      
      if (englishVoice) {
        utterance.voice = englishVoice;
        console.log('Using voice:', englishVoice.name);
      }

      utterance.onend = function() {
        console.log('Speech API finished');
        currentRepeat++;
        if (currentRepeat < repeat) {
          setTimeout(playOnce, 250);
        } else {
          if (options.onEnd) options.onEnd();
        }
      };
      
      utterance.onerror = function(e) {
        console.warn('Speech API error:', e);
        // 不再重试，静默失败
      };

      // 延迟一点播放，确保状态稳定
      setTimeout(function() {
        synth.speak(utterance);
      }, 50);
    };
    
    // 确保语音已加载
    var voices = synth.getVoices();
    if (voices.length === 0) {
      console.log('Waiting for voices to load...');
      synth.onvoiceschanged = function() {
        console.log('Voices loaded:', synth.getVoices().length);
        playOnce();
      };
      // 设置超时，如果5秒内语音没加载就放弃
      setTimeout(function() {
        if (synth.getVoices().length === 0) {
          console.warn('Voices failed to load');
        }
      }, 5000);
    } else {
      playOnce();
    }
  },

  /**
   * 停止播放
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },

  /**
   * 设置发音类型
   * @param {string} type - 'us' 美式 / 'uk' 英式
   */
  setAccent(type) {
    this.accent = type === 'uk' ? 'uk' : 'us';
  },

  /**
   * 播放句子发音（优先使用有道词典API真人发音）
   * @param {string} sentence - 要发音的句子
   * @param {Object} options - 配置选项
   */
  speakSentence(sentence, options) {
    console.log('Audio.speakSentence called with:', sentence);
    options = options || {};
    var self = this;
    
    // 防抖：300ms内的重复调用忽略
    var now = Date.now();
    if (now - this.lastSentenceTime < 300) {
      console.log('Sentence debounced, ignoring...');
      return;
    }
    this.lastSentenceTime = now;
    
    // 生成唯一ID，用于检测是否被新调用覆盖
    this.sentencePlayingId++;
    var currentId = this.sentencePlayingId;
    
    // 停止当前播放
    this.stop();
    
    // 清理句子：替换智能引号，移除末尾标点（有道API对问号等支持不好）
    var cleanSentence = sentence
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/[?!。？！，,\.]+$/g, '');  // 移除末尾标点
    
    console.log('Clean sentence:', cleanSentence);
    
    // 优先使用有道词典API（真人发音）
    this.speakSentenceWithYoudao(cleanSentence, options, currentId);
  },
  
  /**
   * 使用Web Speech API播放句子（专门优化）
   */
  speakSentenceWithSpeechAPI(sentence, options, playId) {
    options = options || {};
    var self = this;
    var synth = window.speechSynthesis;
    
    if (!synth) {
      console.warn('Speech synthesis not supported, trying Youdao...');
      this.speakSentenceWithYoudao(sentence, options);
      return;
    }
    
    // 完全停止之前的语音
    synth.cancel();
    
    // 等待一小段时间确保取消完成
    setTimeout(function() {
      // 检查是否已被新调用覆盖
      if (playId !== self.sentencePlayingId) {
        console.log('Sentence play superseded, skipping...');
        return;
      }
      
      var utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = options.volume || 1;
      
      // 获取语音列表
      var voices = synth.getVoices();
      console.log('Available voices for sentence:', voices.length);
      
      // 尝试找到高质量的英语语音
      var englishVoice = null;
      var preferredVoices = ['Samantha', 'Karen', 'Daniel', 'Moira', 'Alex'];
      
      for (var i = 0; i < preferredVoices.length; i++) {
        for (var j = 0; j < voices.length; j++) {
          if (voices[j].name.indexOf(preferredVoices[i]) !== -1) {
            englishVoice = voices[j];
            break;
          }
        }
        if (englishVoice) break;
      }
      
      // 如果没找到首选，找任意英语语音
      if (!englishVoice) {
        for (var i = 0; i < voices.length; i++) {
          if (voices[i].lang === 'en-US' || voices[i].lang === 'en-GB') {
            englishVoice = voices[i];
            break;
          }
        }
      }
      
      if (!englishVoice) {
        for (var i = 0; i < voices.length; i++) {
          if (voices[i].lang.indexOf('en') === 0) {
            englishVoice = voices[i];
            break;
          }
        }
      }
      
      if (englishVoice) {
        utterance.voice = englishVoice;
        console.log('Using voice for sentence:', englishVoice.name);
      }
      
      utterance.onend = function() {
        console.log('Sentence speech ended');
        if (options.onEnd) options.onEnd();
      };
      
      utterance.onerror = function(e) {
        console.warn('Sentence speech error:', e.error);
        // canceled 是正常取消，不需要备用方案
        // interrupted 也是正常中断
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          self.speakSentenceWithYoudao(sentence, options);
        }
      };
      
      synth.speak(utterance);
      console.log('Sentence speech started');
    }, 100);
  },
  
  /**
   * 使用有道词典API播放句子（主要方案）
   */
  speakSentenceWithYoudao(sentence, options, playId) {
    console.log('Playing sentence with Youdao:', sentence);
    options = options || {};
    var self = this;
    
    var url = 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(sentence) + '&type=2';
    console.log('Youdao sentence URL:', url);
    
    try {
      this.currentAudio = new window.Audio(url);
      this.currentAudio.volume = options.volume || 1;
      
      this.currentAudio.onended = function() {
        console.log('Youdao sentence ended successfully');
        if (options.onEnd) options.onEnd();
      };
      
      this.currentAudio.onerror = function(e) {
        console.warn('Youdao sentence error:', e);
        // 有道失败，尝试 Web Speech API 作为备用
        if (playId === self.sentencePlayingId) {
          console.log('Trying Web Speech API as backup...');
          self.speakSentenceWithSpeechAPI(sentence, options, playId);
        }
      };
      
      var playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(function() {
          console.log('Youdao sentence playing!');
        }).catch(function(e) {
          console.warn('Youdao sentence play failed:', e);
          // 播放失败，尝试 Web Speech API
          if (playId === self.sentencePlayingId) {
            console.log('Trying Web Speech API as backup...');
            self.speakSentenceWithSpeechAPI(sentence, options, playId);
          }
        });
      }
    } catch (e) {
      console.warn('Youdao sentence exception:', e);
      // 异常，尝试 Web Speech API
      if (playId === self.sentencePlayingId) {
        self.speakSentenceWithSpeechAPI(sentence, options, playId);
      }
    }
  },

  /**
   * 预加载单词发音
   * @param {string} word - 单词
   */
  preload(word) {
    const type = this.accent === 'uk' ? 1 : 2;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;
    
    // 预加载但不播放
    const audio = new window.Audio();
    audio.preload = 'auto';
    audio.src = url;
  },

  /**
   * 播放反馈音效
   * @param {string} type - 'correct' | 'wrong'
   */
  playFeedback(type) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';

      if (type === 'correct') {
        // 答对：愉悦的上升音
        oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.08);
        oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.16);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.25);
      } else {
        // 答错：低沉的下降音
        oscillator.frequency.setValueAtTime(280, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {
      // 静默失败
    }
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Audio;
}
