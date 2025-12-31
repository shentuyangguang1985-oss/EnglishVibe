/**
 * EnglishVibe - 学习页面逻辑
 * 核心学习交互控制
 */

const Learn = {
  // 学习状态
  state: {
    isLoading: true,
    currentBook: 'junior_high_all',  // 初中完整词库
    
    // 当前学习批次
    learnQueue: [],        // 本次学习的单词队列
    currentIndex: 0,       // 当前学习到的位置
    
    // 当前单词
    currentWord: null,
    currentOptions: [],
    correctIndex: -1,
    
    // 统计
    todayLearned: 0,
    dailyGoal: 20,
    correctCount: 0,
    wrongCount: 0,
    
    // 答题状态
    hasAnswered: false,
    isCorrect: false
  },

  /**
   * 初始化
   */
  async init() {
    console.log('Learn page initializing...');
    
    try {
      // 加载设置和进度
      const settings = Storage.getSettings();
      const progress = Storage.getProgress();
      const todayStats = Storage.getTodayStats();
      
      this.state.dailyGoal = settings.dailyGoal || 20;
      this.state.todayLearned = todayStats.newLearned || 0;
      this.state.currentBook = progress.currentBook;
      
      // 更新底部显示
      this.updateBottomStats();
      
      // 加载词库
      await Vocabulary.loadBook(this.state.currentBook);
      
      // 准备学习队列
      this.prepareLearnQueue(progress);
      
      // 绑定事件
      this.bindEvents();
      
      // 显示第一个单词
      this.showCurrentWord();
      
      this.state.isLoading = false;
      console.log('Learn page initialized');
    } catch (error) {
      console.error('Learn init error:', error);
      this.showError('加载失败，请返回重试');
    }
  },

  /**
   * 准备学习队列
   */
  prepareLearnQueue(progress) {
    const totalWords = Vocabulary.getTotalCount();
    const startIndex = progress.currentIndex || 0;
    const remainingToday = this.state.dailyGoal - this.state.todayLearned;
    
    // 获取今天要学的单词数量
    const count = Math.min(remainingToday, totalWords - startIndex, 20);
    
    if (count <= 0) {
      // 已完成今日目标或学完所有单词
      this.showComplete();
      return;
    }
    
    // 获取学习队列
    this.state.learnQueue = Vocabulary.getNewWords(startIndex, count);
    this.state.currentIndex = 0;
    
    console.log(`Prepared ${this.state.learnQueue.length} words for learning`);
  },

  /**
   * 绑定事件
   */
  bindEvents() {
    // 返回按钮
    document.getElementById('btn-back')?.addEventListener('click', () => {
      this.goBack();
    });
    
    // 发音按钮
    document.getElementById('btn-audio')?.addEventListener('click', () => {
      this.playCurrentWord();
    });
    
    // 例句朗读按钮
    document.getElementById('btn-sentence-audio')?.addEventListener('click', () => {
      this.playSentence();
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
    
    // 返回首页按钮
    document.getElementById('btn-back-home')?.addEventListener('click', () => {
      window.location.href = './index.html';
    });
    
    // 继续学习按钮（忽略今日目标，继续学习更多）
    document.getElementById('btn-continue-learn')?.addEventListener('click', () => {
      document.getElementById('complete-overlay').style.display = 'none';
      this.continueExtraLearning();
    });

    // 暂停按钮
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      this.goBack();
    });
  },

  /**
   * 显示当前单词
   */
  showCurrentWord() {
    if (this.state.currentIndex >= this.state.learnQueue.length) {
      // 本批次学习完成
      this.checkDailyComplete();
      return;
    }
    
    // 重置状态
    this.state.hasAnswered = false;
    this.state.isCorrect = false;
    
    // 获取当前单词
    this.state.currentWord = this.state.learnQueue[this.state.currentIndex];
    
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
    
    // 自动播放发音
    setTimeout(() => {
      this.playCurrentWord();
    }, 300);
  },

  /**
   * 更新单词卡片
   */
  updateWordCard() {
    const word = this.state.currentWord;
    
    // 单词
    document.getElementById('word-text').textContent = word.word;
    
    // 音标
    document.getElementById('word-phonetic').textContent = word.phonetic || '';
    
    // 配图
    const imgEl = document.getElementById('word-image-img');
    if (word.image) {
      imgEl.src = word.image;
      imgEl.alt = word.word;
      imgEl.onerror = () => {
        imgEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="%23F5F7FB" width="400" height="200"/><text x="200" y="100" text-anchor="middle" fill="%239BA5B7" font-size="48">📚</text></svg>';
      };
    } else {
      imgEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="%23F5F7FB" width="400" height="200"/><text x="200" y="100" text-anchor="middle" fill="%239BA5B7" font-size="48">📚</text></svg>';
    }
    
    // 例句
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
      option.className = 'option';  // 重置样式
      option.disabled = false;
    });
  },

  /**
   * 更新进度
   */
  updateProgress() {
    const current = this.state.currentIndex + 1;
    const total = this.state.learnQueue.length;
    const percent = (this.state.currentIndex / total) * 100;
    
    document.getElementById('progress-text').textContent = `${current} / ${total}`;
    document.getElementById('progress-bar').style.width = `${percent}%`;
  },

  /**
   * 更新底部统计
   */
  updateBottomStats() {
    document.getElementById('today-learned').textContent = this.state.todayLearned;
    document.getElementById('daily-goal').textContent = this.state.dailyGoal;
  },

  /**
   * 处理选项点击
   */
  handleOptionClick(index) {
    if (this.state.hasAnswered) return;
    
    this.state.hasAnswered = true;
    const isCorrect = index === this.state.correctIndex;
    this.state.isCorrect = isCorrect;
    
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
    
    // 反馈
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
    
    // 播放音效
    Audio.playFeedback('correct');
    
    // 震动反馈
    this.vibrate([50]);
    
    // 显示反馈
    this.showFeedback('✓ 正确!', 'success');
    
    // 保存进度
    this.saveWordProgress(true);
    
    // 显示"下一个"按钮（和答错一样需要点击才继续）
    document.getElementById('btn-continue').style.display = 'flex';
  },

  /**
   * 处理答错
   */
  handleWrong() {
    this.state.wrongCount++;
    
    // 播放音效
    Audio.playFeedback('wrong');
    
    // 震动反馈
    this.vibrate([50, 50, 50]);
    
    // 显示反馈
    this.showFeedback('✗ 再想想', 'error');
    
    // 保存进度（加入复习队列）
    this.saveWordProgress(false);
    
    // 显示继续按钮
    document.getElementById('btn-continue').style.display = 'flex';
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
   * 震动反馈
   */
  vibrate(pattern) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  /**
   * 播放当前单词发音
   */
  playCurrentWord() {
    if (this.state.currentWord) {
      Audio.speak(this.state.currentWord.word);
    }
  },

  /**
   * 播放例句发音（使用有道翻译TTS，对句子发音更清晰）
   */
  playSentence() {
    if (this.state.currentWord && this.state.currentWord.sentence) {
      // 先停止当前正在播放的单词音频
      Audio.stop();
      
      const sentence = this.state.currentWord.sentence;
      
      // 使用专门的例句发音方法（有道翻译TTS）
      Audio.speakSentence(sentence);
    }
  },

  /**
   * 下一个单词
   */
  nextWord() {
    // 停止当前音频（防止第二遍还在播放）
    Audio.stop();
    
    this.state.currentIndex++;
    this.state.todayLearned++;
    this.updateBottomStats();
    
    // 更新今日统计
    Storage.incrementNewLearned();
    
    // 更新总进度
    const progress = Storage.getProgress();
    progress.currentIndex = (progress.currentIndex || 0) + 1;
    progress.totalStats.totalLearned = (progress.totalStats.totalLearned || 0) + 1;
    Storage.saveProgress(progress);
    
    // 显示下一个单词
    this.showCurrentWord();
  },

  /**
   * 保存单词进度
   */
  saveWordProgress(isCorrect) {
    const wordId = this.state.currentWord.id;
    const now = Date.now();
    
    // 更新单词进度
    const wordProgress = {
      state: 'learning',
      learnedAt: now,
      reviewStage: 1,
      nextReviewAt: now + 1 * 24 * 60 * 60 * 1000, // 1天后复习
      errorCount: isCorrect ? 0 : 1
    };
    
    Storage.updateWordProgress(wordId, wordProgress);
    
    // 如果答错，加入错题本
    if (!isCorrect) {
      Storage.addToWrongWords(wordId);
    }
  },

  /**
   * 检查今日是否完成
   */
  checkDailyComplete() {
    const todayStats = Storage.getTodayStats();
    
    if (todayStats.newLearned >= this.state.dailyGoal) {
      this.showComplete();
    } else {
      // 继续准备下一批
      this.prepareLearnQueue(Storage.getProgress());
      if (this.state.learnQueue.length > 0) {
        this.showCurrentWord();
      } else {
        this.showComplete('所有单词已学完!');
      }
    }
  },

  /**
   * 继续额外学习（超出今日目标）
   */
  continueExtraLearning() {
    const progress = Storage.getProgress();
    const totalWords = Vocabulary.getTotalCount();
    const startIndex = progress.currentIndex || 0;
    
    // 还有单词可学吗？
    const remaining = totalWords - startIndex;
    if (remaining <= 0) {
      alert('恭喜！你已学完全部单词！🎉');
      window.location.href = './index.html';
      return;
    }
    
    // 每次额外学习10个单词
    const count = Math.min(remaining, 10);
    this.state.learnQueue = Vocabulary.getNewWords(startIndex, count);
    this.state.currentIndex = 0;
    
    console.log(`Extra learning: ${count} words`);
    this.showCurrentWord();
  },

  /**
   * 显示完成页面
   */
  showComplete(message) {
    // 更新连续学习天数
    Storage.updateStreak();
    
    // 跳转到完成页面
    window.location.href = './complete.html';
  },

  /**
   * 返回首页
   */
  goBack() {
    window.location.href = './index.html';
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  Learn.init();
});

