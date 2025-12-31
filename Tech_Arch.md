# EnglishVibe 产品技术架构说明书 (Technical Architecture)

## 1. 架构总览
EnglishVibe 采用 **PWA (Progressive Web App)** 架构，确保能够离线运行且具备类 App 的原生体验。

## 2. 技术栈
- **Frontend**: Vanilla JS (ES6+), HTML5 Canvas (用于动效), CSS3 (CSS Variables + Flexbox/Grid).
- **Storage**: 从 `localStorage` 迁移至 **IndexedDB**（使用 `idb` 库封装），以支持万级词库和海量复习记录。
- **Audio/Speech**: Web Speech API (朗读) + 自定义音效。
- **Service Worker**: 拦截资源请求，实现秒级启动。

## 3. 核心算法设计：Bucket Memory Algorithm
系统将用户数据存储为以下结构：
- **Vocabulary Store**: 基础词库（Word, Image, Meaning, etc.）
- **User Progress Store**: 用户记忆轨迹（WordID, State, LastInterval, NextReviewTime, ErrorCount）

基于时间的调度逻辑：
- `Interval = 1, 2, 4, 7, 15, 30` (天)
- 答对则进入下一阶。
- 答错则重置为阶 1 且 ErrorCount + 1。

## 4. 目录结构规范
```text
EnglishVibe/
├── assets/          # 图片、音效、图标
├── data/            # JSON 词库 (按照年级分文件)
├── scripts/         # 逻辑拆分
│   ├── engine.js    # 复习调度核心算法
│   ├── ui.js        # DOM 操作与动效
│   └── db.js        # IndexedDB 交互
├── index.html       # 唯一入口
├── style.css        # 全局莫兰迪风格
├── manifest.json    # PWA 配置
└── sw.js            # Service Worker
```
