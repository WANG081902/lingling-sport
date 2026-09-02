/**
 * 玲玲你好 - 运动打卡 App
 * Service Worker - 离线缓存与版本管理
 * 版本: 1.1.0
 * 
 * 升级指南：
 * 1. 修改 CACHE_VERSION 字符串（如 'v1.2.0'）
 * 2. 更新 ASSETS 列表中的文件
 * 3. 用户下次打开应用时自动更新
 */

const APP_NAME = 'lingling-sport';
const CACHE_VERSION = 'v1.1.0';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;

// 需要缓存的核心资源
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 安装事件：缓存核心资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中，缓存版本:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 缓存资源:', ASSETS);
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] 缓存失败:', err))
  );
});

// 激活事件：清理旧版本缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中，清理旧缓存');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith(APP_NAME) && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] 删除旧缓存:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

//  fetch 事件：缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 命中缓存，直接返回
        if (cachedResponse) {
          return cachedResponse;
        }

        // 未命中，发起网络请求并缓存
        return fetch(event.request)
          .then((response) => {
            // 只缓存同源的成功响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应（响应流只能读取一次）
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));

            return response;
          })
          .catch(() => {
            // 网络失败时，返回离线页面
            return caches.match('./index.html');
          });
      })
  );
});

// 消息事件：支持手动触发更新
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'GET_VERSION') {
    event.source.postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service Worker 已加载, 版本:', CACHE_VERSION);
