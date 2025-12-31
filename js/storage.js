/**
 * EnglishVibe - 本地存储模块
 * 负责所有数据的本地持久化
 */

const Storage = {
  // 存储键前缀
  PREFIX: 'ev_',

  /**
   * 保存数据到 localStorage
   * @param {string} key - 存储键
   * @param {any} data - 要存储的数据
   */
  save(key, data) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  },

  /**
   * 从 localStorage 读取数据
   * @param {string} key - 存储键
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的数据或默认值
   */
  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  },

  /**
   * 删除指定键的数据
   * @param {string} key - 存储键
   */
  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  /**
   * 清除所有 EnglishVibe 相关数据
   */
  clear() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  // ============================================
  // 用户进度相关
  // ============================================

  /**
   * 获取用户进度
   * @returns {Object} 用户进度对象
   */
  getProgress() {
    return this.load('progress', {
      currentBook: 'junior_high_all',  // 当前词书（初中完整词库）
      currentIndex: 0,                  // 当前学到的位置
      dailyGoal: 20,                    // 每日目标
      wordProgress: {},                 // 单词进度详情
      reviewQueue: [],                  // 复习队列
      wrongWords: [],                   // 错题本
      totalStats: {
        totalLearned: 0,                // 累计学习单词数
        totalMastered: 0,               // 已掌握单词数
        streakDays: 0,                  // 连续学习天数
        startDate: null                 // 开始学习日期
      }
    });
  },

  /**
   * 保存用户进度
   * @param {Object} progress - 用户进度对象
   */
  saveProgress(progress) {
    return this.save('progress', progress);
  },

  /**
   * 更新单个单词的进度
   * @param {string} wordId - 单词ID
   * @param {Object} wordProgress - 单词进度数据
   */
  updateWordProgress(wordId, wordProgress) {
    const progress = this.getProgress();
    progress.wordProgress[wordId] = {
      ...progress.wordProgress[wordId],
      ...wordProgress
    };
    return this.saveProgress(progress);
  },

  // ============================================
  // 今日统计相关
  // ============================================

  /**
   * 获取今日统计
   * @returns {Object} 今日统计对象
   */
  getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.load('todayStats', {
      date: today,
      newLearned: 0,
      reviewed: 0,
      correctCount: 0,
      wrongCount: 0
    });

    // 如果不是今天的数据，重置
    if (stats.date !== today) {
      const newStats = {
        date: today,
        newLearned: 0,
        reviewed: 0,
        correctCount: 0,
        wrongCount: 0
      };
      this.save('todayStats', newStats);
      return newStats;
    }

    return stats;
  },

  /**
   * 保存今日统计
   * @param {Object} stats - 今日统计对象
   */
  saveTodayStats(stats) {
    return this.save('todayStats', stats);
  },

  /**
   * 增加今日新学单词数
   */
  incrementNewLearned() {
    const stats = this.getTodayStats();
    stats.newLearned++;
    return this.saveTodayStats(stats);
  },

  /**
   * 增加今日复习单词数
   */
  incrementReviewed() {
    const stats = this.getTodayStats();
    stats.reviewed++;
    return this.saveTodayStats(stats);
  },

  /**
   * 记录答题结果
   * @param {boolean} isCorrect - 是否答对
   */
  recordAnswer(isCorrect) {
    const stats = this.getTodayStats();
    if (isCorrect) {
      stats.correctCount++;
    } else {
      stats.wrongCount++;
    }
    return this.saveTodayStats(stats);
  },

  // ============================================
  // 设置相关
  // ============================================

  /**
   * 获取设置
   * @returns {Object} 设置对象
   */
  getSettings() {
    return this.load('settings', {
      dailyGoal: 20,
      autoPlayAudio: true,
      showSentence: true,
      vibrationEnabled: true,
      // 讯飞TTS配置
      xfyunAppId: '',
      xfyunApiKey: '',
      xfyunApiSecret: '',
      usePremiumTTS: false  // 是否使用付费TTS
    });
  },

  /**
   * 保存设置
   * @param {Object} settings - 设置对象
   */
  saveSettings(settings) {
    return this.save('settings', settings);
  },

  /**
   * 更新单个设置项
   * @param {string} key - 设置项键
   * @param {any} value - 设置项值
   */
  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.saveSettings(settings);
  },

  // ============================================
  // 复习队列相关
  // ============================================

  /**
   * 获取今日待复习单词列表
   * @returns {Array} 待复习单词ID数组
   */
  getTodayReviewWords() {
    const progress = this.getProgress();
    const now = Date.now();
    
    return Object.entries(progress.wordProgress)
      .filter(([wordId, wp]) => {
        // 排除新词和已掌握的词
        if (wp.state === 'new' || wp.state === 'mastered') {
          return false;
        }
        // 检查是否到了复习时间
        return wp.nextReviewAt && wp.nextReviewAt <= now;
      })
      .map(([wordId]) => wordId);
  },

  /**
   * 将单词加入复习队列
   * @param {string} wordId - 单词ID
   */
  addToReviewQueue(wordId) {
    const progress = this.getProgress();
    if (!progress.reviewQueue.includes(wordId)) {
      progress.reviewQueue.push(wordId);
    }
    return this.saveProgress(progress);
  },

  /**
   * 从复习队列移除单词
   * @param {string} wordId - 单词ID
   */
  removeFromReviewQueue(wordId) {
    const progress = this.getProgress();
    progress.reviewQueue = progress.reviewQueue.filter(id => id !== wordId);
    return this.saveProgress(progress);
  },

  // ============================================
  // 错题本相关
  // ============================================

  /**
   * 将单词加入错题本
   * @param {string} wordId - 单词ID
   */
  addToWrongWords(wordId) {
    const progress = this.getProgress();
    if (!progress.wrongWords.includes(wordId)) {
      progress.wrongWords.push(wordId);
    }
    return this.saveProgress(progress);
  },

  /**
   * 从错题本移除单词
   * @param {string} wordId - 单词ID
   */
  removeFromWrongWords(wordId) {
    const progress = this.getProgress();
    progress.wrongWords = progress.wrongWords.filter(id => id !== wordId);
    return this.saveProgress(progress);
  },

  // ============================================
  // 连续学习天数
  // ============================================

  /**
   * 更新连续学习天数
   */
  updateStreak() {
    const progress = this.getProgress();
    const lastStudyDate = this.load('lastStudyDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastStudyDate) {
      // 首次学习
      progress.totalStats.streakDays = 1;
      progress.totalStats.startDate = today;
    } else if (lastStudyDate === today) {
      // 今天已经学习过，不更新
      return this.saveProgress(progress);
    } else {
      // 检查是否连续
      const lastDate = new Date(lastStudyDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // 连续学习
        progress.totalStats.streakDays++;
      } else {
        // 断了，重新计数
        progress.totalStats.streakDays = 1;
      }
    }
    
    this.save('lastStudyDate', today);
    return this.saveProgress(progress);
  }
};

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}

