/**
 * Service Worker - 缓存策略和离线支持
 * @version 2.0.0
 */

const CACHE_NAME = 'deer-homepage-v2.0.0';
const STATIC_CACHE = 'static-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-v2.0.0';
const API_CACHE = 'api-v2.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/js/app.js',
    '/assets/js/main.js',
    '/assets/js/modules/config.js',
    '/assets/js/modules/utils.js',
    '/assets/js/modules/background.js',
    '/assets/js/modules/api.js',
    '/assets/js/modules/ui.js',
    '/assets/img/logo-optimized.png',
    '/assets/img/favicon.ico',
    '/assets/img/mouse.png',
    '/assets/fonts/AlimamaDaoLiTi-Regular.woff2',
    '/assets/sounds/click-blank.wav',
    '/assets/sounds/click-btn.wav',
    '/assets/sounds/click-back.wav',
    '/manifest.json'
];

// 需要网络优先的资源
const NETWORK_FIRST = [
    'https://v1.hitokoto.cn/',
    'https://api.uomg.com/',
    'https://bing.img.run/',
    'https://api.dujin.org/',
    'https://home-push-friend-link.952780.xyz/'
];

// 需要缓存优先的CDN资源
const CACHE_FIRST = [
    'https://cdnjs.cloudflare.com/',
    'https://cdn.jsdelivr.net/',
    'https://unpkg.com/'
];

/**
 * Service Worker 安装事件
 */
self.addEventListener('install', event => {
    console.log('🔧 Service Worker 安装中...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 缓存静态资源...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ 静态资源缓存完成');
                return self.skipWaiting(); // 强制激活新的SW
            })
            .catch(error => {
                console.error('❌ 静态资源缓存失败:', error);
            })
    );
});

/**
 * Service Worker 激活事件
 */
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // 删除旧版本缓存
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('🗑️ 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker 激活完成');
                return self.clients.claim(); // 立即控制所有页面
            })
    );
});

/**
 * 请求拦截和缓存策略
 */
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // 跳过非GET请求
    if (request.method !== 'GET') {
        return;
    }
    
    // 跳过Chrome扩展请求
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    event.respondWith(
        handleRequest(request)
    );
});

/**
 * 处理请求的主要逻辑
 * @param {Request} request - 请求对象
 * @returns {Promise<Response>} 响应对象
 */
async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // 1. API请求 - 网络优先，带超时
        if (isAPIRequest(url.href)) {
            return await networkFirstWithTimeout(request, API_CACHE, 3000);
        }
        
        // 2. CDN资源 - 缓存优先
        if (isCDNRequest(url.href)) {
            return await cacheFirstWithNetworkFallback(request, DYNAMIC_CACHE);
        }
        
        // 3. 静态资源 - 缓存优先
        if (isStaticAsset(request.url)) {
            return await cacheFirstWithNetworkFallback(request, STATIC_CACHE);
        }
        
        // 4. 页面请求 - 网络优先，缓存降级
        if (request.destination === 'document') {
            return await networkFirstWithCacheFallback(request, STATIC_CACHE);
        }
        
        // 5. 其他资源 - 缓存优先
        return await cacheFirstWithNetworkFallback(request, DYNAMIC_CACHE);
        
    } catch (error) {
        console.error('请求处理失败:', error);
        return await getOfflineFallback(request);
    }
}

/**
 * 网络优先策略（带超时）
 */
async function networkFirstWithTimeout(request, cacheName, timeout = 3000) {
    try {
        // 创建超时控制器
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(request, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            // 缓存成功的响应
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        console.warn('网络请求失败，尝试缓存:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

/**
 * 缓存优先策略
 */
async function cacheFirstWithNetworkFallback(request, cacheName) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // 后台更新缓存
        updateCacheInBackground(request, cacheName);
        return cachedResponse;
    }
    
    // 缓存未命中，从网络获取
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('网络和缓存都失败:', error);
        throw error;
    }
}

/**
 * 网络优先策略（缓存降级）
 */
async function networkFirstWithCacheFallback(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('网络失败，尝试缓存:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

/**
 * 后台更新缓存
 */
function updateCacheInBackground(request, cacheName) {
    // 不等待结果，后台更新
    fetch(request)
        .then(response => {
            if (response.ok) {
                return caches.open(cacheName)
                    .then(cache => cache.put(request, response));
            }
        })
        .catch(error => {
            console.warn('后台缓存更新失败:', error);
        });
}

/**
 * 获取离线降级响应
 */
async function getOfflineFallback(request) {
    if (request.destination === 'document') {
        const cachedIndex = await caches.match('/');
        if (cachedIndex) {
            return cachedIndex;
        }
    }
    
    // 返回简单的离线页面
    return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
            <title>离线模式</title>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px; 
                    background: #121212; 
                    color: #fff; 
                }
                .offline { 
                    max-width: 400px; 
                    margin: 0 auto; 
                }
            </style>
        </head>
        <body>
            <div class="offline">
                <h1>🔌 离线模式</h1>
                <p>当前网络不可用，请检查网络连接后重试。</p>
                <button onclick="location.reload()">重新加载</button>
            </div>
        </body>
        </html>`,
        {
            headers: { 'Content-Type': 'text/html' }
        }
    );
}

/**
 * 判断是否为API请求
 */
function isAPIRequest(url) {
    return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

/**
 * 判断是否为CDN请求
 */
function isCDNRequest(url) {
    return CACHE_FIRST.some(pattern => url.includes(pattern));
}

/**
 * 判断是否为静态资源
 */
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.endsWith(asset));
}

/**
 * 消息处理
 */
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_STATUS') {
        getCacheStatus().then(status => {
            event.ports[0].postMessage(status);
        });
    }
});

/**
 * 获取缓存状态
 */
async function getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        status[cacheName] = keys.length;
    }
    
    return status;
}
