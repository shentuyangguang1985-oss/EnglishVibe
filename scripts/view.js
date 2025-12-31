/**
 * view.js - EnglishVibe 视图层
 * 负责 DOM 操作、动效渲染及交互反馈
 */

const UI = {
    wordText: document.getElementById('word-text'),
    wordPhonetic: document.getElementById('phonetic'),
    wordImg: document.getElementById('word-img'),
    optionsContainer: document.getElementById('options-container'),
    progressFill: document.getElementById('progress-fill'),
    learnedCounter: document.getElementById('learned-count'),
    remainingCounter: document.getElementById('remaining-count'),

    /**
     * 更新主卡片内容
     */
    renderCard(data, mode) {
        // 重置状态
        this.wordText.style.display = 'block';
        this.wordPhonetic.style.display = 'block';
        this.wordImg.style.display = 'block';
        this.wordImg.style.filter = 'none';
        this.wordImg.style.width = "100%";
        this.wordImg.style.objectFit = "cover";

        if (mode === 'visual') {
            this.wordText.innerText = data.word;
            this.wordPhonetic.innerText = data.phonetic;
            this.wordImg.src = data.image;
        } else {
            // 听音模式
            this.wordText.style.display = 'none';
            this.wordPhonetic.style.display = 'none';
            this.wordImg.src = "https://cdn-icons-png.flaticon.com/512/59/59284.png";
            this.wordImg.style.width = "100px";
            this.wordImg.style.objectFit = "contain";
        }
    },

    /**
     * 渲染选项按钮
     */
    renderOptions(options, correctMeaning, onChoice) {
        this.optionsContainer.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => onChoice(opt, correctMeaning, btn);
            this.optionsContainer.appendChild(btn);
        });
    },

    /**
     * 更新进度条
     */
    updateProgress(current, total, learned) {
        const progress = total > 0 ? (current / total) * 100 : 0;
        this.progressFill.style.width = `${progress}%`;
        this.learnedCounter.innerText = learned;
        this.remainingCounter.innerText = total - current;
    },

    /**
     * 播放斩碎闪光特效
     */
    playSlashEffect() {
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(125,147,205,0.4), rgba(244,142,145,0.4));
            pointer-events: none; z-index: 1000;
            animation: flashFade 0.3s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    },

    /**
     * 显示成就弹窗
     */
    showAchievement(title, desc) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-content">
                <h2>${title}</h2>
                <p>${desc}</p>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2500);
    },

    /**
     * 播放发音
     */
    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    },

    /**
     * 显示完成界面
     */
    showCompletion(onRestart) {
        this.wordImg.src = "https://images.unsplash.com/photo-1531353826977-0941b4779a1c?q=80&w=400&auto=format&fit=crop";
        this.wordText.innerText = "🎉 今日目标达成！";
        this.wordPhonetic.innerText = "You are awesome!";
        this.optionsContainer.innerHTML = `
            <button class="option-btn" style="grid-column: span 2" id="restart-btn">再学一遍</button>
        `;
        document.getElementById('restart-btn').onclick = onRestart;
        this.progressFill.style.width = "100%";
    }
};
