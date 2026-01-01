/**
 * EnglishVibe - 主应用模块
 * 首页逻辑控制
 */

const App = {
  // 应用状态
  state: {
    isLoading: true,
    currentBook: 'junior_high_all',  // 初中完整词库（3500词）
    totalWords: 0,
    todayStats: null,
    progress: null,
    settings: null,
    reviewWords: []
  },

  /**
   * 初始化应用
   */
  async init() {
    console.log('EnglishVibe initializing...');
    
    try {
      // 显示加载状态
      this.showLoading(true);
      
      // 加载设置
      this.state.settings = Storage.getSettings();
      
      // 加载用户进度
      this.state.progress = Storage.getProgress();
      this.state.currentBook = this.state.progress.currentBook;
      
      // 加载词库
      await Vocabulary.loadBook(this.state.currentBook);
      this.state.totalWords = Vocabulary.getTotalCount();
      
      // 加载今日统计
      this.state.todayStats = Storage.getTodayStats();
      
      // 获取待复习单词
      this.state.reviewWords = Storage.getTodayReviewWords();
      
      // 更新UI
      this.updateUI();
      
      // 绑定事件
      this.bindEvents();
      
      // 隐藏加载状态
      this.showLoading(false);
      
      console.log('EnglishVibe initialized successfully');
    } catch (error) {
      console.error('EnglishVibe init error:', error);
      this.showError('加载失败，请刷新重试');
    }
  },

  /**
   * 更新页面UI
   */
  updateUI() {
    const { todayStats, progress, settings, totalWords, reviewWords } = this.state;
    
    // 每日目标
    const dailyGoal = settings.dailyGoal || 20;
    this.setText('stat-daily-goal', dailyGoal);
    this.setText('stat-daily-goal-footer', dailyGoal);
    
    // 今日新学
    this.setText('stat-new-learned', todayStats.newLearned);
    
    // 待复习数量
    const reviewCount = reviewWords.length;
    this.setText('stat-review-count', `${reviewCount} 词`);
    this.setText('review-badge', reviewCount);
    
    // 显示/隐藏复习按钮
    const btnReview = document.getElementById('btn-review');
    if (btnReview) {
      btnReview.style.display = reviewCount > 0 ? 'flex' : 'none';
    }
    
    // 今日正确率
    const totalAnswers = (todayStats.correctCount || 0) + (todayStats.wrongCount || 0);
    if (totalAnswers > 0) {
      const accuracy = Math.round((todayStats.correctCount / totalAnswers) * 100);
      this.setText('stat-accuracy', `${accuracy}%`);
    } else {
      this.setText('stat-accuracy', '--');
    }
    
    // 当前学习阶段
    const stageInfo = Vocabulary.getStageInfo(progress.wordProgress);
    if (stageInfo) {
      this.setText('current-stage-name', stageInfo.stage.name);
      this.setText('stage-learned', stageInfo.learned);
      this.setText('stage-total', stageInfo.total);
      const stagePercent = stageInfo.total > 0 ? (stageInfo.learned / stageInfo.total * 100) : 0;
      const stageProgressFill = document.getElementById('stage-progress-fill');
      if (stageProgressFill) {
        stageProgressFill.style.width = `${stagePercent.toFixed(1)}%`;
      }
    } else {
      // 所有阶段都学完了
      this.setText('current-stage-name', '🎉 全部完成！');
      this.setText('stage-learned', '--');
      this.setText('stage-total', '--');
    }

    // 总进度
    const totalLearned = progress.totalStats.totalLearned || 0;
    this.setText('stat-total-learned', totalLearned);
    this.setText('stat-total-words', totalWords);
    
    // 进度条和百分比
    const progressPercent = totalWords > 0 ? (totalLearned / totalWords * 100) : 0;
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
      progressFill.style.width = `${progressPercent.toFixed(1)}%`;
    }
    this.setText('progress-percent', `(${progressPercent.toFixed(1)}%)`);
    
    // 已掌握词数
    const totalMastered = progress.totalStats.totalMastered || 0;
    this.setText('stat-mastered', totalMastered);
    
    // 连续学习天数
    const streakDays = progress.totalStats.streakDays || 0;
    this.setText('stat-streak', streakDays);
    
    // 预计完成天数
    const remainingWords = totalWords - totalLearned;
    const remainingDays = dailyGoal > 0 ? Math.ceil(remainingWords / dailyGoal) : '--';
    this.setText('stat-remaining-days', remainingDays);
    
    // 检查今日目标是否完成
    this.updateLearnButton();
  },

  /**
   * 更新学习按钮状态
   */
  updateLearnButton() {
    const { todayStats, settings, progress, totalWords } = this.state;
    const btnLearn = document.getElementById('btn-learn');
    
    if (!btnLearn) return;
    
    const dailyGoal = settings.dailyGoal || 20;
    const totalLearned = progress.totalStats.totalLearned || 0;
    
    // 已学完所有单词
    if (totalLearned >= totalWords) {
      btnLearn.innerHTML = '<span class="btn__icon">🎉</span> 已学完全部单词';
      btnLearn.classList.add('btn--disabled');
      return;
    }
    
    // 今日目标已完成
    if (todayStats.newLearned >= dailyGoal) {
      btnLearn.innerHTML = '<span class="btn__icon">✅</span> 今日目标已完成';
      // 仍可继续学习，但显示不同状态
    }
  },

  /**
   * 绑定事件
   */
  bindEvents() {
    // 开始学习按钮
    const btnLearn = document.getElementById('btn-learn');
    if (btnLearn) {
      btnLearn.addEventListener('click', () => this.startLearning());
    }
    
    // 开始复习按钮
    const btnReview = document.getElementById('btn-review');
    if (btnReview) {
      btnReview.addEventListener('click', () => this.startReview());
    }
    
    // 设置按钮
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => this.openSettings());
    }
  },

  /**
   * 开始学习
   */
  startLearning() {
    const { progress, totalWords } = this.state;
    const totalLearned = progress.totalStats.totalLearned || 0;
    
    // 检查是否已学完
    if (totalLearned >= totalWords) {
      this.showMessage('恭喜！你已学完全部单词 🎉');
      return;
    }
    
    // 跳转到学习页面
    window.location.href = './learn.html';
  },

  /**
   * 开始复习
   */
  startReview() {
    if (this.state.reviewWords.length === 0) {
      this.showMessage('暂无需要复习的单词 👍');
      return;
    }
    
    // 跳转到复习页面
    window.location.href = './review.html';
  },

  /**
   * 打开设置
   */
  openSettings() {
    window.location.href = './settings.html';
  },

  /**
   * 显示/隐藏加载状态
   */
  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
    this.state.isLoading = show;
  },

  /**
   * 设置元素文本
   */
  setText(id, text) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
    }
  },

  /**
   * 显示提示消息
   */
  showMessage(message, duration = 2000) {
    // 创建提示元素
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 16px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, duration);
  },

  /**
   * 显示错误
   */
  showError(message) {
    this.showLoading(false);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 24px;">😵</div>
          <div style="font-size: 18px; color: #3A4750; margin-bottom: 16px;">${message}</div>
          <button onclick="location.reload()" style="padding: 12px 24px; background: #7D93CD; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
            刷新页面
          </button>
        </div>
      `;
    }
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

