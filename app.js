/**
 * app.js - EnglishVibe 总控脚本
 * 负责各模块间的协调与应用启动
 */

async function startApp() {
    try {
        // 1. 初始化数据库
        await initDB();

        // 2. 加载基础词库 (模拟从 data/vocab_junior_1.json 加载)
        const response = await fetch('data/vocab_junior_1.json');
        const vocabData = await response.json();

        // 3. 导入数据到 IndexedDB (如果是第一次)
        await importVocab(vocabData);

        // 4. 获取用户进度并启动引擎
        const progressData = await getAllProgress();
        await Engine.setup(vocabData, progressData);

        // 5. 注册 Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(console.error);
        }

        // 6. 首次渲染
        renderNextStep();

    } catch (err) {
        console.error('App Launch Failed:', err);
    }
}

/**
 * 渲染下一步操作
 */
function renderNextStep() {
    const task = Engine.getNextTask();

    if (!task) {
        UI.showCompletion(() => {
            localStorage.clear();
            location.reload();
        });
        return;
    }

    // 渲染卡片
    UI.renderCard(task.word, task.mode);

    // 如果是听音模式，自动发音
    if (task.mode === 'audio') {
        setTimeout(() => UI.speak(task.word.word), 300);
    }

    // 渲染选项
    UI.renderOptions(task.options, task.word.meaning, async (selected, correct, btn) => {
        const isCorrect = selected === correct;

        if (isCorrect) {
            btn.classList.add('correct');
            UI.playSlashEffect();

            // 如果是听音模式，显示单词
            if (task.mode === 'audio') {
                UI.renderCard(task.word, 'visual');
                UI.speak(task.word.word);
            }

            const status = await Engine.handleAnswer(true);

            // 更新进度条
            UI.updateProgress(Engine.currentIndex, Engine.vocab.length, Engine.currentIndex);

            // 检查成就
            const ach = Engine.getAchievement();
            if (ach) UI.showAchievement(ach.title, ach.desc);

            // 切题延迟
            setTimeout(renderNextStep, 1000);
        } else {
            btn.classList.add('wrong');
            if (navigator.vibrate) navigator.vibrate(50);
            setTimeout(() => btn.classList.remove('wrong'), 500);
        }
    });

    // 更新初始进度
    UI.updateProgress(Engine.currentIndex, Engine.vocab.length, Engine.currentIndex);
}

// 启动！
startApp();
