/**
 * engine.js - EnglishVibe 逻辑引擎
 * 核心调度算法所在，负责管理学习流程、复习计划及状态切换
 */

const Engine = {
    vocab: [],
    progress: {},
    currentIndex: 0,
    currentMode: 'visual',
    dailyGoal: 15,
    todayLearned: 0,

    /**
     * 加载数据并初始化引擎状态
     */
    async setup(vocabData, progressData) {
        this.vocab = vocabData;
        this.progress = (progressData || []).reduce((acc, curr) => {
            acc[curr.wordId] = curr;
            return acc;
        }, {});

        // 恢复学习位置
        this.currentIndex = parseInt(localStorage.getItem('english_vibe_index') || '0');
        this.todayLearned = parseInt(localStorage.getItem('english_vibe_today_count') || '0');
    },

    /**
     * 获取当前需要处理的任务
     */
    getNextTask() {
        if (this.currentIndex >= this.vocab.length) {
            return null;
        }

        const word = this.vocab[this.currentIndex];
        // 随机决定模式：听音 vs 视觉 (V2 逻辑)
        this.currentMode = Math.random() > 0.7 ? 'audio' : 'visual';

        return {
            word,
            mode: this.currentMode,
            options: this.generateOptions(word.meaning)
        };
    },

    /**
     * 生成随机干扰项
     */
    generateOptions(correctMeaning) {
        let options = [correctMeaning];
        const allMeanings = this.vocab.map(item => item.meaning);

        while (options.length < 4) {
            let randomMeaning = allMeanings[Math.floor(Math.random() * allMeanings.length)];
            if (!options.includes(randomMeaning)) {
                options.push(randomMeaning);
            }
        }
        return options.sort(() => Math.random() - 0.5);
    },

    /**
     * 处理一次回答结果
     */
    async handleAnswer(isCorrect) {
        if (isCorrect) {
            this.currentIndex++;
            this.todayLearned++;

            // 持久化到 localStorage
            localStorage.setItem('english_vibe_index', this.currentIndex);
            localStorage.setItem('english_vibe_today_count', this.todayLearned);

            return {
                finished: this.currentIndex >= this.vocab.length,
                learnedToday: this.todayLearned,
                learnedCount: this.currentIndex
            };
        }
        return { finished: false };
    },

    /**
     * 检测成就
     */
    getAchievement() {
        const achievements = [
            { count: 5, title: '🌱 初露锋芒', desc: '第一次斩碎 5 个单词！' },
            { count: 10, title: '⚔️ 十斩十决', desc: '已斩碎 10 个单词！' },
            { count: 50, title: '💪 百斩不殆', desc: '已斩碎 50 个单词！' },
            { count: 100, title: '🏆 词霸初现', desc: '已斩碎 100 个单词！' },
        ];
        return achievements.find(a => a.count === this.currentIndex);
    }
};
