/**
 * EnglishVibe - 词库管理模块
 * 负责词库加载、单词查询等功能
 * 词库范围：初中三年（七年级、八年级、九年级）共3500词
 */

const Vocabulary = {
  // 词库数据
  words: [],
  
  // 词库索引（按ID快速查找）
  wordIndex: {},

  // 词库配置 - 使用合并后的单一文件，加载更快
  books: {
    'junior_high_all': {
      name: '初中完整词库（2276词）',
      files: [
        // 所有词汇合并到一个文件，只需一次网络请求
        'vocab_all.json'
      ]
    },
    'grade7': {
      name: '七年级词库（800词）',
      files: [
        'vocab_grade7_core.json',
        'vocab_grade7_core2.json',
        'vocab_g7_batch3.json',
        'vocab_g7_batch4.json',
        'vocab_g7_batch5.json',
        'vocab_g7_batch6.json',
        'vocab_g7_batch7.json',
        'vocab_g7_batch8.json',
        'vocab_g7_batch9.json',
        'vocab_g7_batch10.json',
        'vocab_g7_batch11.json',
        'vocab_g7_batch12.json',
        'vocab_g7_batch13.json',
        'vocab_g7_batch14.json',
        'vocab_g7_batch15.json'
      ]
    },
    'grade8': {
      name: '八年级词库（1200词）',
      files: [
        'vocab_g8_batch1.json',
        'vocab_g8_batch2.json',
        'vocab_g8_batch3.json',
        'vocab_g8_batch4.json',
        'vocab_g8_batch5.json',
        'vocab_g8_batch6.json',
        'vocab_g8_batch7.json',
        'vocab_g8_batch8.json',
        'vocab_g8_batch9.json',
        'vocab_g8_batch10.json',
        'vocab_g8_batch11.json',
        'vocab_g8_batch12.json',
        'vocab_g8_batch13.json',
        'vocab_g8_batch14.json',
        'vocab_g8_batch15.json',
        'vocab_g8_batch16.json',
        'vocab_g8_batch17.json',
        'vocab_g8_batch18.json',
        'vocab_g8_batch19.json',
        'vocab_g8_batch20.json'
      ]
    },
    'grade9': {
      name: '九年级词库（1500词）',
      files: [
        'vocab_g9_batch1.json',
        'vocab_g9_batch2.json',
        'vocab_g9_batch3.json',
        'vocab_g9_batch4.json',
        'vocab_g9_batch5.json',
        'vocab_g9_batch6.json',
        'vocab_g9_batch7.json',
        'vocab_g9_batch8.json',
        'vocab_g9_batch9.json',
        'vocab_g9_batch10.json',
        'vocab_g9_batch11.json',
        'vocab_g9_batch12.json',
        'vocab_g9_batch13.json',
        'vocab_g9_batch14.json',
        'vocab_g9_batch15.json',
        'vocab_g9_batch16.json',
        'vocab_g9_batch17.json',
        'vocab_g9_batch18.json',
        'vocab_g9_batch19.json',
        'vocab_g9_batch20.json',
        'vocab_g9_batch21.json',
        'vocab_g9_batch22.json',
        'vocab_g9_batch23.json',
        'vocab_g9_batch24.json'
      ]
    }
  },

  // 内嵌备用词库（确保应用即使网络失败也能工作，包含30个常用词）
  fallbackWords: [
    { id: 'f1', word: 'introduce', phonetic: '/ˌɪntrəˈdjuːs/', meaning: 'v. 介绍', sentence: 'Let me introduce myself.', sentenceCn: '让我介绍一下我自己。' },
    { id: 'f2', word: 'capital', phonetic: '/ˈkæpɪtl/', meaning: 'n. 首都', sentence: 'Beijing is the capital of China.', sentenceCn: '北京是中国的首都。' },
    { id: 'f3', word: 'factory', phonetic: '/ˈfæktri/', meaning: 'n. 工厂', sentence: 'My father works in a factory.', sentenceCn: '我父亲在工厂工作。' },
    { id: 'f4', word: 'university', phonetic: '/ˌjuːnɪˈvɜːrsəti/', meaning: 'n. 大学', sentence: 'I want to go to university.', sentenceCn: '我想上大学。' },
    { id: 'f5', word: 'hospital', phonetic: '/ˈhɒspɪtl/', meaning: 'n. 医院', sentence: 'The hospital is near here.', sentenceCn: '医院就在附近。' },
    { id: 'f6', word: 'theatre', phonetic: '/ˈθɪətər/', meaning: 'n. 剧院', sentence: 'We went to the theatre.', sentenceCn: '我们去了剧院。' },
    { id: 'f7', word: 'village', phonetic: '/ˈvɪlɪdʒ/', meaning: 'n. 村庄', sentence: 'I live in a small village.', sentenceCn: '我住在一个小村庄。' },
    { id: 'f8', word: 'mountain', phonetic: '/ˈmaʊntən/', meaning: 'n. 山', sentence: 'The mountain is very high.', sentenceCn: '这座山很高。' },
    { id: 'f9', word: 'ancestor', phonetic: '/ˈænsestər/', meaning: 'n. 祖先', sentence: 'Our ancestors lived here.', sentenceCn: '我们的祖先住在这里。' },
    { id: 'f10', word: 'character', phonetic: '/ˈkærəktər/', meaning: 'n. 人物；性格', sentence: 'He has a good character.', sentenceCn: '他性格很好。' },
    { id: 'f11', word: 'especially', phonetic: '/ɪˈspeʃəli/', meaning: 'adv. 尤其', sentence: 'I like fruits, especially apples.', sentenceCn: '我喜欢水果，尤其是苹果。' },
    { id: 'f12', word: 'foreign', phonetic: '/ˈfɒrən/', meaning: 'adj. 外国的', sentence: 'I like foreign movies.', sentenceCn: '我喜欢外国电影。' },
    { id: 'f13', word: 'popular', phonetic: '/ˈpɒpjələr/', meaning: 'adj. 受欢迎的', sentence: 'This song is very popular.', sentenceCn: '这首歌很受欢迎。' },
    { id: 'f14', word: 'traditional', phonetic: '/trəˈdɪʃənl/', meaning: 'adj. 传统的', sentence: 'This is a traditional festival.', sentenceCn: '这是一个传统节日。' },
    { id: 'f15', word: 'experience', phonetic: '/ɪkˈspɪəriəns/', meaning: 'n. 经历；经验', sentence: 'It was a great experience.', sentenceCn: '这是一次很棒的经历。' },
    { id: 'f16', word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', meaning: 'n. 环境', sentence: 'We should protect the environment.', sentenceCn: '我们应该保护环境。' },
    { id: 'f17', word: 'pollution', phonetic: '/pəˈluːʃn/', meaning: 'n. 污染', sentence: 'Air pollution is serious.', sentenceCn: '空气污染很严重。' },
    { id: 'f18', word: 'recycle', phonetic: '/ˌriːˈsaɪkl/', meaning: 'v. 回收利用', sentence: 'We should recycle paper.', sentenceCn: '我们应该回收纸张。' },
    { id: 'f19', word: 'technology', phonetic: '/tekˈnɒlədʒi/', meaning: 'n. 技术', sentence: 'Technology is changing our life.', sentenceCn: '技术正在改变我们的生活。' },
    { id: 'f20', word: 'communicate', phonetic: '/kəˈmjuːnɪkeɪt/', meaning: 'v. 交流', sentence: 'We communicate by email.', sentenceCn: '我们通过电子邮件交流。' }
  ],

  /**
   * 加载词库
   * @param {string} bookId - 词书ID，默认加载完整初中词库
   * @returns {Promise<Array>} 词库数组
   */
  async loadBook(bookId = 'junior_high_all') {
    const book = this.books[bookId];
    if (!book) {
      throw new Error(`Unknown book: ${bookId}`);
    }

    this.words = [];
    this.wordIndex = {};

    try {
      // 并行加载所有词库文件（添加超时控制）
      const loadPromises = book.files.map(file => 
        fetch(`./data/${file}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to load ${file}`);
            return res.json();
          })
          .catch(e => {
            console.warn(`Warning: Could not load ${file}`, e);
            return [];
          })
      );

      // 添加超时控制（30秒，手机网络可能较慢）
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Load timeout')), 30000)
      );

      const results = await Promise.race([
        Promise.all(loadPromises),
        timeoutPromise
      ]).catch(e => {
        console.warn('Vocabulary load failed, using fallback:', e);
        return null;
      });

      // 如果加载失败，使用备用词库
      if (!results) {
        console.log('Using fallback vocabulary');
        this.words = [...this.fallbackWords];
        this.words.forEach((word, index) => {
          this.wordIndex[word.id] = index;
        });
        return this.words;
      }

      // 合并所有词库并去重
      const wordMap = new Map();
      results.forEach(wordList => {
        if (Array.isArray(wordList)) {
          wordList.forEach(word => {
            // 使用单词本身作为去重键
            const key = word.word.toLowerCase();
            if (!wordMap.has(key)) {
              wordMap.set(key, word);
            }
          });
        }
      });

      // 转换为数组
      this.words = Array.from(wordMap.values());

      // 建立索引
      this.words.forEach((word, index) => {
        if (word.id) {
          this.wordIndex[word.id] = index;
        }
      });

      console.log(`Loaded ${this.words.length} unique words from ${bookId}`);
      return this.words;
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      // 加载失败时使用备用词库
      console.log('Using fallback vocabulary due to error');
      this.words = [...this.fallbackWords];
      this.words.forEach((word, index) => {
        this.wordIndex[word.id] = index;
      });
      return this.words;
    }
  },

  /**
   * 获取词库总数
   * @returns {number} 单词总数
   */
  getTotalCount() {
    return this.words.length;
  },

  /**
   * 根据ID获取单词
   * @param {string} wordId - 单词ID
   * @returns {Object|null} 单词对象
   */
  getWordById(wordId) {
    const index = this.wordIndex[wordId];
    return index !== undefined ? this.words[index] : null;
  },

  /**
   * 根据索引获取单词
   * @param {number} index - 索引位置
   * @returns {Object|null} 单词对象
   */
  getWordByIndex(index) {
    return this.words[index] || null;
  },

  /**
   * 获取一批新单词（用于学习）- 顺序模式（已弃用，保留兼容）
   * @param {number} startIndex - 起始索引
   * @param {number} count - 数量
   * @returns {Array} 单词数组
   */
  getNewWords(startIndex, count) {
    return this.words.slice(startIndex, startIndex + count);
  },

  /**
   * 随机获取未学过的单词（新的随机模式）
   * @param {Object} wordProgress - 已学单词的进度对象 { wordId: { ... } }
   * @param {number} count - 需要获取的数量
   * @returns {Array} 随机选取的未学单词数组
   */
  getRandomNewWords(wordProgress, count) {
    // 获取所有未学过的单词
    const learnedIds = new Set(Object.keys(wordProgress || {}));
    const unlearnedWords = this.words.filter(word => !learnedIds.has(word.id));
    
    // 如果未学单词不足，返回所有未学的
    if (unlearnedWords.length <= count) {
      return this.shuffleArray(unlearnedWords);
    }
    
    // 随机选取指定数量的单词
    const shuffled = this.shuffleArray(unlearnedWords);
    return shuffled.slice(0, count);
  },

  /**
   * 获取未学单词总数
   * @param {Object} wordProgress - 已学单词的进度对象
   * @returns {number} 未学单词数量
   */
  getUnlearnedCount(wordProgress) {
    const learnedIds = new Set(Object.keys(wordProgress || {}));
    return this.words.filter(word => !learnedIds.has(word.id)).length;
  },

  /**
   * 根据ID列表获取单词
   * @param {Array<string>} wordIds - 单词ID数组
   * @returns {Array} 单词对象数组
   */
  getWordsByIds(wordIds) {
    return wordIds
      .map(id => this.getWordById(id))
      .filter(word => word !== null);
  },

  /**
   * 生成选项（用于四选一）
   * @param {Object} correctWord - 正确单词对象
   * @param {number} optionCount - 选项数量（默认4）
   * @returns {Array} 选项数组（包含正确答案和干扰项）
   */
  generateOptions(correctWord, optionCount = 4) {
    const options = [correctWord];
    const usedIds = new Set([correctWord.id]);

    // 随机选择干扰项
    while (options.length < optionCount && options.length < this.words.length) {
      const randomIndex = Math.floor(Math.random() * this.words.length);
      const randomWord = this.words[randomIndex];
      
      // 避免重复和相同释义的词
      if (!usedIds.has(randomWord.id) && randomWord.meaning !== correctWord.meaning) {
        options.push(randomWord);
        usedIds.add(randomWord.id);
      }
    }

    // 打乱选项顺序
    return this.shuffleArray(options);
  },

  /**
   * 打乱数组顺序（Fisher-Yates 洗牌算法）
   * @param {Array} array - 要打乱的数组
   * @returns {Array} 打乱后的数组
   */
  shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  /**
   * 搜索单词
   * @param {string} query - 搜索关键词
   * @returns {Array} 匹配的单词数组
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.words.filter(word => 
      word.word.toLowerCase().includes(lowerQuery) ||
      word.meaning.includes(query)
    );
  },

  /**
   * 获取词书信息
   * @param {string} bookId - 词书ID
   * @returns {Object} 词书信息
   */
  getBookInfo(bookId) {
    return this.books[bookId] || null;
  },

  /**
   * 获取所有可用词书
   * @returns {Array} 词书列表
   */
  getAllBooks() {
    return Object.entries(this.books).map(([id, info]) => ({
      id,
      name: info.name,
      fileCount: info.files.length
    }));
  }
};

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Vocabulary;
}

