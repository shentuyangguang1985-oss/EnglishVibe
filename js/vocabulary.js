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

  // 词库配置 - 初中三年完整词库
  books: {
    'junior_high_all': {
      name: '初中完整词库（3500词）',
      files: [
        // 七年级词库 (800词)
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
        'vocab_g7_batch15.json',
        // 八年级词库 (1200词)
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
        'vocab_g8_batch20.json',
        // 九年级词库 (1500词)
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
      // 并行加载所有词库文件
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

      const results = await Promise.all(loadPromises);
      
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
      throw error;
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
   * 获取一批新单词（用于学习）
   * @param {number} startIndex - 起始索引
   * @param {number} count - 数量
   * @returns {Array} 单词数组
   */
  getNewWords(startIndex, count) {
    return this.words.slice(startIndex, startIndex + count);
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

