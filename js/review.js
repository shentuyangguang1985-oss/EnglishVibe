/**
 * EnglishVibe - 复习页面逻辑
 * 实现固定间隔复习算法（1天、3天、7天）
 */

const Review = {
  // 复习间隔配置（天）
  INTERVALS: {
    1: 1,   // 第1次复习: 1天后
    2: 3,   // 第2次复习: 3天后
    3: 7    // 第3次复习: 7天后
  },

  // 复习状态
  state: {
    isLoading: true,
    currentBook: 'junior_high_all',  // 初中完整词库
    
    // 复习队列
    reviewQueue: [],
    currentIndex: 0,
    
    // 当前单词
    currentWord: null,
    currentOptions: [],
    correctIndex: -1,
    
    // 统计
    reviewedCount: 0,
    correctCount: 0,
    wrongCount: 0,
    
    // 答题状态
    hasAnswered: false
  },

  /**
   * 初始化
   */
  async init() {
    console.log('Review page initializing...');
    
    try {
      // 先绑定基础事件（返回首页等）
      this.bindBasicEvents();
      
      const progress = Storage.getProgress();
      this.state.currentBook = progress.currentBook;
      
      // 加载词库
      await Vocabulary.loadBook(this.state.currentBook);
      
      // 获取待复习单词
      this.loadReviewQueue();
      
      if (this.state.reviewQueue.length === 0) {
        this.showComplete('暂无需要复习的单词');
        return;
      }
      
      // 绑定学习相关事件
      this.bindEvents();
      
      // 更新统计
      this.updateStats();
      
      // 显示第一个单词
      this.showCurrentWord();
      
      this.state.isLoading = false;
      console.log('Review page initialized');
    } catch (error) {
      console.error('Review init error:', error);
      this.showError('加载失败，请返回重试');
    }
  },

  /**
   * 加载复习队列
   */
  loadReviewQueue() {
    const progress = Storage.getProgress();
    const now = Date.now();
    
    // 获取所有需要复习的单词
    const reviewWordIds = Object.entries(progress.wordProgress)
      .filter(([wordId, wp]) => {
        // 排除新词和已掌握的词
        if (!wp.state || wp.state === 'new' || wp.state === 'mastered') {
          return false;
        }
        // 检查是否到了复习时间
        return wp.nextReviewAt && wp.nextReviewAt <= now;
      })
      .map(([wordId]) => wordId);
    
    // 获取单词详情
    this.state.reviewQueue = Vocabulary.getWordsByIds(reviewWordIds);
    this.state.currentIndex = 0;
    
    console.log(`Found ${this.state.reviewQueue.length} words to review`);
  },

  /**
   * 绑定基础事件（即使没有复习单词也需要绑定）
   */
  bindBasicEvents() {
    // 返回按钮
    document.getElementById('btn-back')?.addEventListener('click', () => {
      window.location.href = './index.html';
    });
    
    // 返回首页（完成页面）
    document.getElementById('btn-back-home')?.addEventListener('click', () => {
      window.location.href = './index.html';
    });

    // 暂停按钮
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      window.location.href = './index.html';
    });
  },

  /**
   * 绑定事件
   */
  bindEvents() {
    // 发音按钮
    document.getElementById('btn-audio')?.addEventListener('click', () => {
      if (this.state.currentWord) {
        Audio.speak(this.state.currentWord.word);
      }
    });
    
    // 例句朗读按钮（使用有道翻译TTS，对句子发音更清晰）
    document.getElementById('btn-sentence-audio')?.addEventListener('click', () => {
      if (this.state.currentWord && this.state.currentWord.sentence) {
        // 先停止当前正在播放的单词音频
        Audio.stop();
        
        const sentence = this.state.currentWord.sentence;
        
        // 使用专门的例句发音方法
        Audio.speakSentence(sentence);
      }
    });
    
    // 选项点击
    const options = document.querySelectorAll('.option');
    options.forEach((option, index) => {
      option.addEventListener('click', () => {
        this.handleOptionClick(index);
      });
    });
    
    // 继续按钮
    document.getElementById('btn-continue')?.addEventListener('click', () => {
      this.nextWord();
    });
  },

  /**
   * 显示当前单词
   */
  showCurrentWord() {
    if (this.state.currentIndex >= this.state.reviewQueue.length) {
      this.showComplete();
      return;
    }
    
    this.state.hasAnswered = false;
    this.state.currentWord = this.state.reviewQueue[this.state.currentIndex];
    
    // 生成选项
    this.state.currentOptions = Vocabulary.generateOptions(this.state.currentWord, 4);
    this.state.correctIndex = this.state.currentOptions.findIndex(
      opt => opt.id === this.state.currentWord.id
    );
    
    // 更新UI
    this.updateWordCard();
    this.updateOptions();
    this.updateProgress();
    
    // 隐藏继续按钮和例句
    document.getElementById('btn-continue').style.display = 'none';
    document.getElementById('sentence-box').classList.remove('show');
    
    // 播放发音
    setTimeout(() => {
      Audio.speak(this.state.currentWord.word);
    }, 300);
  },

  /**
   * 更新单词卡片
   */
  updateWordCard() {
    const word = this.state.currentWord;
    
    document.getElementById('word-text').textContent = word.word;
    document.getElementById('word-phonetic').textContent = word.phonetic || '';
    
    const imgEl = document.getElementById('word-image-img');
    if (word.image) {
      imgEl.src = word.image;
      imgEl.alt = word.word;
      imgEl.onerror = () => {
        imgEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="%23F5F7FB" width="400" height="200"/><text x="200" y="100" text-anchor="middle" fill="%239BA5B7" font-size="48">🔄</text></svg>';
      };
    } else {
      imgEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="%23F5F7FB" width="400" height="200"/><text x="200" y="100" text-anchor="middle" fill="%239BA5B7" font-size="48">🔄</text></svg>';
    }
    
    document.getElementById('sentence-en').textContent = word.sentence || '';
    document.getElementById('sentence-cn').textContent = word.sentence_cn || '';
  },

  /**
   * 更新选项
   */
  updateOptions() {
    const options = document.querySelectorAll('.option');
    options.forEach((option, index) => {
      const word = this.state.currentOptions[index];
      option.textContent = word ? word.meaning : '';
      option.className = 'option';
      option.disabled = false;
    });
  },

  /**
   * 更新进度
   */
  updateProgress() {
    const current = this.state.currentIndex + 1;
    const total = this.state.reviewQueue.length;
    const percent = (this.state.currentIndex / total) * 100;
    
    document.getElementById('progress-text').textContent = `复习 ${current} / ${total}`;
    document.getElementById('progress-bar').style.width = `${percent}%`;
  },

  /**
   * 更新统计
   */
  updateStats() {
    document.getElementById('today-reviewed').textContent = this.state.reviewedCount;
    
    const total = this.state.correctCount + this.state.wrongCount;
    const accuracy = total > 0 ? Math.round(this.state.correctCount / total * 100) : 100;
    document.getElementById('accuracy').textContent = accuracy + '%';
  },

  /**
   * 处理选项点击
   */
  handleOptionClick(index) {
    if (this.state.hasAnswered) return;
    
    this.state.hasAnswered = true;
    const isCorrect = index === this.state.correctIndex;
    
    // 更新选项样式
    const options = document.querySelectorAll('.option');
    options.forEach((opt, i) => {
      opt.classList.add('option--disabled');
      if (i === this.state.correctIndex) {
        opt.classList.add('option--correct');
        opt.innerHTML = `<span class="option__icon">✓</span> ${opt.textContent}`;
      }
      if (i === index && !isCorrect) {
        opt.classList.add('option--wrong');
        opt.innerHTML = `<span class="option__icon">✗</span> ${opt.textContent}`;
      }
    });
    
    // 显示例句
    document.getElementById('sentence-box').classList.add('show');
    
    // 处理结果
    if (isCorrect) {
      this.handleCorrect();
    } else {
      this.handleWrong();
    }
    
    // 记录答题
    Storage.recordAnswer(isCorrect);
  },

  /**
   * 处理答对
   */
  handleCorrect() {
    this.state.correctCount++;
    this.state.reviewedCount++;
    
    Audio.playFeedback('correct');
    this.vibrate([50]);
    this.showFeedback('✓ 正确!', 'success');
    
    // 更新复习进度
    this.updateReviewProgress(true);
    this.updateStats();
    
    // 显示"下一个"按钮（和学习页一样需要点击才继续）
    document.getElementById('btn-continue').style.display = 'flex';
  },

  /**
   * 处理答错
   */
  handleWrong() {
    this.state.wrongCount++;
    this.state.reviewedCount++;
    
    Audio.playFeedback('wrong');
    this.vibrate([50, 50, 50]);
    this.showFeedback('✗ 再记一记', 'error');
    
    // 重置复习进度
    this.updateReviewProgress(false);
    this.updateStats();
    
    // 显示继续按钮
    document.getElementById('btn-continue').style.display = 'flex';
  },

  /**
   * 更新单词复习进度
   */
  updateReviewProgress(isCorrect) {
    const wordId = this.state.currentWord.id;
    const progress = Storage.getProgress();
    const wordProgress = progress.wordProgress[wordId] || {};
    const currentStage = wordProgress.reviewStage || 1;
    const now = Date.now();
    
    if (isCorrect) {
      if (currentStage >= 3) {
        // 完成所有复习，标记为已掌握
        wordProgress.state = 'mastered';
        wordProgress.nextReviewAt = null;
        wordProgress.reviewStage = 4;
        
        // 更新已掌握数量
        progress.totalStats.totalMastered = (progress.totalStats.totalMastered || 0) + 1;
      } else {
        // 进入下一复习阶段
        const nextStage = currentStage + 1;
        const intervalDays = this.INTERVALS[nextStage];
        wordProgress.reviewStage = nextStage;
        wordProgress.nextReviewAt = now + intervalDays * 24 * 60 * 60 * 1000;
      }
    } else {
      // 答错，重置到第1阶段
      wordProgress.state = 'reviewing';
      wordProgress.reviewStage = 1;
      wordProgress.nextReviewAt = now + 1 * 24 * 60 * 60 * 1000;
      wordProgress.errorCount = (wordProgress.errorCount || 0) + 1;
    }
    
    Storage.updateWordProgress(wordId, wordProgress);
    Storage.incrementReviewed();
  },

  /**
   * 下一个单词
   */
  nextWord() {
    // 停止当前音频（防止第二遍还在播放）
    Audio.stop();
    
    this.state.currentIndex++;
    this.showCurrentWord();
  },

  /**
   * 显示反馈
   */
  showFeedback(text, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = text;
    feedback.className = `feedback show feedback--${type}`;
    
    setTimeout(() => {
      feedback.classList.remove('show');
    }, 800);
  },

  /**
   * 震动
   */
  vibrate(pattern) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  /**
   * 显示完成页面
   */
  showComplete(message) {
    const total = this.state.correctCount + this.state.wrongCount;
    const accuracy = total > 0 ? Math.round(this.state.correctCount / total * 100) : 100;
    
    document.getElementById('complete-reviewed').textContent = this.state.reviewedCount;
    document.getElementById('complete-accuracy').textContent = accuracy + '%';
    document.getElementById('complete-message').textContent = message || '今日复习任务已完成';
    document.getElementById('complete-overlay').style.display = 'flex';
  },

  /**
   * 显示错误
   */
  showError(message) {
    document.getElementById('main-content').innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 24px;">😵</div>
        <div style="font-size: 16px; color: #3A4750; margin-bottom: 16px;">${message}</div>
        <button onclick="window.location.href='./index.html'" class="btn btn--primary">
          返回首页
        </button>
      </div>
    `;
  }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  Review.init();
});

