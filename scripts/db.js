/**
 * db.js - EnglishVibe 数据库层
 * 负责 IndexedDB 的初始化、数据导入及进度保存
 */

const DB_NAME = 'EnglishVibeDB';
const DB_VERSION = 1;
const STORE_VOCAB = 'vocabulary';
const STORE_PROGRESS = 'progress';

let db;

/**
 * 初始化数据库
 */
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // 词库表：存储单词元数据
            if (!db.objectStoreNames.contains(STORE_VOCAB)) {
                db.createObjectStore(STORE_VOCAB, { keyPath: 'id', autoIncrement: true });
            }

            // 进度表：存储学习状态
            if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
                db.createObjectStore(STORE_PROGRESS, { keyPath: 'wordId' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            reject('DB Init Error: ' + event.target.errorCode);
        };
    });
}

/**
 * 批量导入初始词库
 */
async function importVocab(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_VOCAB], 'readwrite');
        const store = transaction.objectStore(STORE_VOCAB);

        // 先检查是否已经有数据，避免重复导入
        const countRequest = store.count();
        countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
                data.forEach(item => store.add(item));
                console.log('Vocab imported successfully');
            }
            resolve();
        };

        transaction.onerror = () => reject('Import Error');
    });
}

/**
 * 获取所有单词
 */
async function getAllVocab() {
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_VOCAB], 'readonly');
        const store = transaction.objectStore(STORE_VOCAB);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * 保存单词进度
 * @param {Object} progress { wordId, state, nextReview, errorCount }
 */
async function saveProgress(progress) {
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_PROGRESS], 'readwrite');
        const store = transaction.objectStore(STORE_PROGRESS);
        store.put(progress);
        transaction.oncomplete = () => resolve();
    });
}

/**
 * 获取用户所有进度
 */
async function getAllProgress() {
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_PROGRESS], 'readonly');
        const store = transaction.objectStore(STORE_PROGRESS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
}
