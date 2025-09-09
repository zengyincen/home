/**
 * 主应用文件 - 使用ES6模块化架构
 * @author Deer
 * @version 2.0.0
 */

import { CONFIG } from './modules/config.js';
import { getBingWallpaper } from './modules/background.js';
import { getHitokoto, updateHitokotoDisplay } from './modules/api.js';
import { initUI, updateYear, showNotification } from './modules/ui.js';
import { registerSW, getSWStatus } from './modules/sw.js';
import { initAnalytics, trackEvent } from './modules/analytics.js';
import { initErrorHandler, wrapAsync, handleError } from './modules/error-handler.js';
import { debounce } from './modules/utils.js';

/**
 * 应用主类
 */
class App {
    constructor() {
        this.initialized = false;
        this.resources = {
            background: false,
            hitokoto: false,
            ui: false,
            serviceWorker: false,
            analytics: false,
            errorHandler: false
        };
    }

    /**
     * 初始化应用
     */
    async init() {
        if (this.initialized) return;

        console.log('🚀 应用初始化开始...');
        
        try {
            // 首先初始化错误处理系统
            await this._initErrorHandler();
            
            // 然后初始化分析系统
            await this._initAnalytics();
            
            // 并行加载资源
            await this._loadResources();
            
            // 初始化UI组件
            this._initComponents();
            
            // 设置事件监听
            this._setupEventListeners();
            
            // 初始化音乐播放器
            this._initMusicPlayer();
            
            this.initialized = true;
            console.log('✅ 应用初始化完成');
            
            // 追踪应用启动事件
            trackEvent('app_initialized', {
                version: '2.0.0',
                resources: this.resources,
                initTime: performance.now() - this.pageLoadTime
            });
            
            // 显示初始化完成通知
            showNotification('欢迎访问！', 'success', 2000);
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            handleError({
                type: 'app_initialization_error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            }, {
                showNotification: true,
                severity: 'high'
            });
        }
    }

    /**
     * 并行加载资源
     * @private
     */
    async _loadResources() {
        const tasks = [
            // 背景加载
            this._loadBackground(),
            // 一言加载
            this._loadHitokoto(),
            // UI初始化
            this._loadUI(),
            // Service Worker注册
            this._loadServiceWorker()
        ];

        const results = await Promise.allSettled(tasks);
        
        // 检查加载结果
        results.forEach((result, index) => {
            const resourceNames = ['background', 'hitokoto', 'ui', 'serviceWorker'];
            if (result.status === 'fulfilled') {
                this.resources[resourceNames[index]] = true;
                console.log(`✅ ${resourceNames[index]} 加载成功`);
            } else {
                console.warn(`⚠️ ${resourceNames[index]} 加载失败:`, result.reason);
                // 追踪资源加载失败
                trackEvent('resource_load_failed', {
                    resource: resourceNames[index],
                    error: result.reason?.message || String(result.reason)
                });
            }
        });
    }

    /**
     * 加载背景
     * @private
     */
    async _loadBackground() {
        try {
            const success = await getBingWallpaper();
            if (!success) {
                console.warn('背景图片加载失败，使用渐变背景');
            }
            return success;
        } catch (error) {
            console.error('背景加载错误:', error);
            throw error;
        }
    }

    /**
     * 加载一言
     * @private
     */
    async _loadHitokoto() {
        try {
            const data = await getHitokoto();
            updateHitokotoDisplay(data);
            
            if (!data.success) {
                console.warn('一言API失败，使用备用内容');
            }
            
            return data;
        } catch (error) {
            console.error('一言加载错误:', error);
            // 显示默认内容
            updateHitokotoDisplay({
                text: '加载失败，请刷新页面重试',
                from: '系统',
                success: false
            });
            throw error;
        }
    }

    /**
     * 加载UI组件
     * @private
     */
    async _loadUI() {
        try {
            initUI();
            updateYear();
            return true;
        } catch (error) {
            console.error('UI初始化错误:', error);
            throw error;
        }
    }

    /**
     * 加载Service Worker
     * @private
     */
    async _loadServiceWorker() {
        try {
            const success = await registerSW();
            if (success) {
                console.log('Service Worker 状态:', getSWStatus());
            }
            return success;
        } catch (error) {
            console.error('Service Worker 注册错误:', error);
            // Service Worker 失败不影响应用运行
            return false;
        }
    }

    /**
     * 初始化错误处理系统
     * @private
     */
    async _initErrorHandler() {
        try {
            initErrorHandler();
            this.resources.errorHandler = true;
            console.log('✅ 错误处理系统初始化完成');
        } catch (error) {
            console.error('错误处理系统初始化失败:', error);
            // 错误处理系统失败不应阻止应用启动
        }
    }

    /**
     * 初始化分析系统
     * @private
     */
    async _initAnalytics() {
        try {
            await initAnalytics();
            this.resources.analytics = true;
            console.log('✅ 分析系统初始化完成');
        } catch (error) {
            console.error('分析系统初始化失败:', error);
            // 分析系统失败不应阻止应用启动
        }
    }

    /**
     * 初始化组件
     * @private
     */
    _initComponents() {
        // 清理旧的service worker
        this._cleanupServiceWorkers();
        
        // 初始化性能监控
        this._initPerformanceMonitoring();
    }

    /**
     * 设置事件监听
     * @private
     */
    _setupEventListeners() {
        // 窗口大小变化监听
        window.addEventListener('resize', debounce(() => {
            this._handleResize();
        }, CONFIG.RESIZE_DEBOUNCE));

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this._handleVisibilityChange();
        });

        // 错误处理
        window.addEventListener('error', (e) => {
            this._handleError(e);
        });

        // 未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (e) => {
            this._handleUnhandledRejection(e);
        });
    }

    /**
     * 初始化音乐播放器
     * @private
     */
    _initMusicPlayer() {
        const tryPlay = () => {
            const meting = document.querySelector('meting-js');
            if (meting && meting.aplayer && meting.aplayer.audio && meting.aplayer.audio.paused) {
                meting.aplayer.audio.play().catch(() => {
                    // 静默处理自动播放失败
                });
            }
            document.removeEventListener('click', tryPlay);
            document.removeEventListener('touchstart', tryPlay);
        };

        document.addEventListener('click', tryPlay, { once: true });
        document.addEventListener('touchstart', tryPlay, { once: true });
    }

    /**
     * 清理旧的service worker
     * @private
     */
    _cleanupServiceWorkers() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister();
                    console.log('🧹 已注销旧的service worker:', registration.scope);
                }
            });
        }
    }

    /**
     * 初始化性能监控
     * @private
     */
    _initPerformanceMonitoring() {
        // Web Vitals 监控
        if ('PerformanceObserver' in window) {
            try {
                // 监控 LCP (Largest Contentful Paint)
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        console.log('📊 LCP:', entry.startTime);
                    }
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // 监控 FID (First Input Delay)
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        console.log('📊 FID:', entry.processingStart - entry.startTime);
                    }
                }).observe({ entryTypes: ['first-input'] });

            } catch (error) {
                console.warn('性能监控初始化失败:', error);
            }
        }
    }

    /**
     * 处理窗口大小变化
     * @private
     */
    _handleResize() {
        // 可以在这里添加响应式逻辑
        console.log('📱 窗口大小变化:', window.innerWidth, 'x', window.innerHeight);
    }

    /**
     * 处理页面可见性变化
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            console.log('👀 页面隐藏');
        } else {
            console.log('👀 页面显示');
        }
    }

    /**
     * 处理全局错误
     * @private
     */
    _handleError(event) {
        console.error('🚨 全局错误:', event.error);
        
        // 发送错误报告（如果需要）
        // this._reportError(event.error);
    }

    /**
     * 处理未捕获的Promise拒绝
     * @private
     */
    _handleUnhandledRejection(event) {
        console.error('🚨 未处理的Promise拒绝:', event.reason);
        event.preventDefault(); // 阻止默认的错误处理
        
        // 发送错误报告（如果需要）
        // this._reportError(event.reason);
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态信息
     */
    getStatus() {
        return {
            initialized: this.initialized,
            resources: this.resources,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    /**
     * 重新加载资源
     */
    async reload() {
        console.log('🔄 重新加载应用资源...');
        this.initialized = false;
        this.resources = { background: false, hitokoto: false, ui: false, serviceWorker: false, analytics: false, errorHandler: false };
        await this.init();
    }
}

// 创建应用实例
const app = new App();

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 导出应用实例供调试使用
window.app = app;

// 导出应用类
export default App;
