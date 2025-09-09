/**
 * Service Worker 注册和管理模块
 * @module ServiceWorker
 */

/**
 * Service Worker 管理器
 */
class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.updateAvailable = false;
    }

    /**
     * 注册 Service Worker
     * @returns {Promise<boolean>} 注册是否成功
     */
    async register() {
        if (!('serviceWorker' in navigator)) {
            console.warn('当前浏览器不支持 Service Worker');
            return false;
        }

        try {
            console.log('📡 注册 Service Worker...');
            
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('✅ Service Worker 注册成功:', this.registration.scope);

            // 监听更新
            this._setupUpdateListener();
            
            // 检查是否有等待中的 Service Worker
            if (this.registration.waiting) {
                this._showUpdatePrompt();
            }

            return true;

        } catch (error) {
            console.error('❌ Service Worker 注册失败:', error);
            return false;
        }
    }

    /**
     * 设置更新监听器
     * @private
     */
    _setupUpdateListener() {
        if (!this.registration) return;

        // 监听新的 Service Worker 安装
        this.registration.addEventListener('updatefound', () => {
            console.log('🔄 发现 Service Worker 更新');
            
            const newWorker = this.registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('⏳ Service Worker 更新就绪');
                    this.updateAvailable = true;
                    this._showUpdatePrompt();
                }
            });
        });

        // 监听控制器变化
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker 控制器已更新');
            window.location.reload();
        });
    }

    /**
     * 显示更新提示
     * @private
     */
    _showUpdatePrompt() {
        // 动态导入UI模块来显示通知
        import('./ui.js').then(({ showNotification }) => {
            showNotification(
                '发现新版本！点击刷新页面以获取最新功能。',
                'info',
                10000
            );
        });

        // 创建更新按钮
        this._createUpdateButton();
    }

    /**
     * 创建更新按钮
     * @private
     */
    _createUpdateButton() {
        // 避免重复创建
        if (document.querySelector('.update-prompt')) return;

        const updatePrompt = document.createElement('div');
        updatePrompt.className = 'update-prompt';
        updatePrompt.innerHTML = `
            <div class="update-content">
                <span>🚀 新版本可用</span>
                <button class="update-btn">更新</button>
                <button class="dismiss-btn">×</button>
            </div>
        `;

        // 样式
        Object.assign(updatePrompt.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            maxWidth: '400px',
            margin: '0 auto',
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            zIndex: '10001',
            transform: 'translateY(100px)',
            transition: 'transform 0.3s ease',
            fontFamily: 'inherit'
        });

        const updateContent = updatePrompt.querySelector('.update-content');
        Object.assign(updateContent.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
        });

        const updateBtn = updatePrompt.querySelector('.update-btn');
        Object.assign(updateBtn.style, {
            background: '#4caf50',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
        });

        const dismissBtn = updatePrompt.querySelector('.dismiss-btn');
        Object.assign(dismissBtn.style, {
            background: 'transparent',
            color: '#fff',
            border: 'none',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        // 事件监听
        updateBtn.addEventListener('click', () => {
            this.activateUpdate();
        });

        dismissBtn.addEventListener('click', () => {
            updatePrompt.remove();
        });

        document.body.appendChild(updatePrompt);

        // 动画显示
        setTimeout(() => {
            updatePrompt.style.transform = 'translateY(0)';
        }, 100);
    }

    /**
     * 激活更新
     */
    activateUpdate() {
        if (this.registration && this.registration.waiting) {
            console.log('🔄 激活 Service Worker 更新');
            
            // 发送消息给等待中的 Service Worker
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    /**
     * 获取缓存状态
     * @returns {Promise<Object>} 缓存状态
     */
    async getCacheStatus() {
        if (!this.registration || !this.registration.active) {
            return { error: 'Service Worker 未激活' };
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            this.registration.active.postMessage(
                { type: 'GET_CACHE_STATUS' },
                [messageChannel.port2]
            );
        });
    }

    /**
     * 清除所有缓存
     * @returns {Promise<boolean>} 清除是否成功
     */
    async clearAllCaches() {
        try {
            const cacheNames = await caches.keys();
            const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
            await Promise.all(deletePromises);
            
            console.log('🗑️ 所有缓存已清除');
            return true;
        } catch (error) {
            console.error('缓存清除失败:', error);
            return false;
        }
    }

    /**
     * 注销 Service Worker
     * @returns {Promise<boolean>} 注销是否成功
     */
    async unregister() {
        if (!this.registration) return false;

        try {
            const success = await this.registration.unregister();
            console.log('🗑️ Service Worker 已注销');
            return success;
        } catch (error) {
            console.error('Service Worker 注销失败:', error);
            return false;
        }
    }

    /**
     * 获取 Service Worker 状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        if (!this.registration) {
            return { status: 'not_registered' };
        }

        return {
            status: 'registered',
            scope: this.registration.scope,
            updateAvailable: this.updateAvailable,
            installing: !!this.registration.installing,
            waiting: !!this.registration.waiting,
            active: !!this.registration.active
        };
    }
}

// 创建单例实例
const swManager = new ServiceWorkerManager();

// 导出方法
export const registerSW = () => swManager.register();
export const activateUpdate = () => swManager.activateUpdate();
export const getCacheStatus = () => swManager.getCacheStatus();
export const clearAllCaches = () => swManager.clearAllCaches();
export const unregisterSW = () => swManager.unregister();
export const getSWStatus = () => swManager.getStatus();

// 导出类供高级使用
export { ServiceWorkerManager };
