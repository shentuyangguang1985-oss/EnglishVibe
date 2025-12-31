/**
 * EnglishVibe - Service Worker
 * 实现PWA离线缓存功能
 */

const CACHE_NAME = 'englishvibe-v40';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  './',
  './index.html',
  './learn.html',
  './review.html',
  './settings.html',
  './complete.html',
  './css/style.css',
  './js/app.js',
  './js/storage.js',
  './js/vocabulary.js',
  './js/audio.js',
  './js/learn.js',
  './js/review.js',
  './manifest.json'
];

// 词库文件（按需缓存）
const VOCAB_FILES = [
  './data/vocab_grade7_core.json',
  './data/vocab_grade7_core2.json'
];

// 安装阶段：缓存静态资源
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // 跳过等待，立即激活
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        // 立即控制所有页面
        return self.clients.claim();
      })
  );
});

// 拦截请求：网络优先，失败时使用缓存
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 跳过非GET请求
  if (request.method !== 'GET') return;
  
  // 跳过外部请求（如有道词典API）
  if (!url.origin.includes(self.location.origin) && 
      !url.href.includes('dict.youdao.com')) {
    return;
  }
  
  // 对于词库文件，使用缓存优先策略
  if (url.pathname.includes('/data/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // 对于HTML页面，使用网络优先策略
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 其他资源使用缓存优先策略
  event.respondWith(cacheFirst(request));
});

// 缓存优先策略
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    
    // 缓存成功的响应
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    // 返回离线页面或默认响应
    return new Response('离线状态', { status: 503 });
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // 缓存成功的响应
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // 返回离线页面
    return caches.match('./index.html');
  }
}

// 监听推送消息
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'EnglishVibe';
  const options = {
    body: data.body || '该学习英语啦！',
    icon: './assets/icons/icon.svg',
    badge: './assets/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 监听通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // 如果已有窗口打开，聚焦它
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // 否则打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || './');
        }
      })
  );
});

console.log('[SW] Service Worker loaded');
