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
    var self = this;
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
        console.warn('Youdao audio failed, trying backup...', e);
        // 备用方案：使用 Web Speech API
        var backupOptions = { volume: options.volume, repeat: totalRepeat - self.repeatCount };
        self.speakWithSpeechAPI(word, backupOptions);
      };
      
      var playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(function(e) {
          console.warn('Audio play failed:', e);
          // 备用方案
          var backupOptions = { volume: options.volume, repeat: totalRepeat - self.repeatCount };
          self.speakWithSpeechAPI(word, backupOptions);
        });
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
  speakWithSpeechAPI(word, options = {}) {
    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // 取消任何正在进行的语音
    synth.cancel();
    
    const repeat = options.repeat || 1;
    let currentRepeat = 0;
    
    const playOnce = () => {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = options.volume || 1;

      // 尝试获取英语语音
      const voices = synth.getVoices();
      const englishVoice = voices.find(v => 
        v.lang === 'en-US' || v.lang === 'en-GB'
      ) || voices.find(v => v.lang.startsWith('en'));
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => {
        currentRepeat++;
        if (currentRepeat < repeat) {
          setTimeout(playOnce, 250);
        } else {
          if (options.onEnd) options.onEnd();
        }
      };
      
      utterance.onerror = (e) => {
        console.warn('Speech API error:', e);
      };

      synth.speak(utterance);
    };
    
    // 确保语音已加载
    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = () => {
        playOnce();
      };
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
   * 播放句子发音（使用有道词典API，和单词发音完全一样）
   * @param {string} sentence - 要发音的句子
   * @param {Object} options - 配置选项
   */
  speakSentence(sentence, options) {
    console.log('Audio.speakSentence called with:', sentence);
    options = options || {};
    
    // 停止当前播放
    this.stop();
    
    // 重置计数，只播放1遍
    this.repeatCount = 0;
    
    // 使用和单词完全相同的方法播放
    this._playOnce(sentence, options, 1);
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
