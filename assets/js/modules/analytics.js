/**
 * 分析和监控模块
 * @module Analytics
 */

import { CONFIG } from './config.js';
import { debounce } from './utils.js';

/**
 * 分析管理器类
 */
class AnalyticsManager {
    constructor() {
        this.initialized = false;
        this.sessionId = this._generateSessionId();
        this.pageLoadTime = performance.now();
        this.interactions = [];
        this.errors = [];
        this.vitals = {};
    }

    /**
     * 初始化分析系统
     */
    async init() {
        if (this.initialized) return;

        console.log('📊 初始化分析系统...');

        try {
            // 初始化核心指标收集
            this._initWebVitals();
            
            // 初始化用户行为追踪
            this._initUserTracking();
            
            // 初始化错误监控
            this._initErrorTracking();
            
            // 初始化性能监控
            this._initPerformanceTracking();

            // 可选：初始化Google Analytics（如果配置了）
            await this._initGoogleAnalytics();

            this.initialized = true;
            console.log('✅ 分析系统初始化完成');

            // 发送页面加载事件
            this.trackEvent('page_load', {
                sessionId: this.sessionId,
                loadTime: performance.now() - this.pageLoadTime,
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ 分析系统初始化失败:', error);
        }
    }

    /**
     * 初始化Web Vitals监控
     * @private
     */
    _initWebVitals() {
        // Core Web Vitals 监控
        if ('PerformanceObserver' in window) {
            try {
                // LCP (Largest Contentful Paint)
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.vitals.lcp = Math.round(lastEntry.startTime);
                    console.log('📊 LCP:', this.vitals.lcp + 'ms');
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // FID (First Input Delay)
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        this.vitals.fid = Math.round(entry.processingStart - entry.startTime);
                        console.log('📊 FID:', this.vitals.fid + 'ms');
                    }
                }).observe({ entryTypes: ['first-input'] });

                // CLS (Cumulative Layout Shift)
                let clsValue = 0;
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.vitals.cls = Math.round(clsValue * 1000) / 1000;
                    console.log('📊 CLS:', this.vitals.cls);
                }).observe({ entryTypes: ['layout-shift'] });

            } catch (error) {
                console.warn('Web Vitals 监控失败:', error);
            }
        }
    }

    /**
     * 初始化用户行为追踪
     * @private
     */
    _initUserTracking() {
        // 点击事件追踪
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, .nav-item, .back-btn');
            if (target) {
                this.trackInteraction('click', {
                    element: target.tagName.toLowerCase(),
                    text: target.textContent?.trim().substring(0, 50),
                    href: target.href || null,
                    className: target.className,
                    timestamp: Date.now()
                });
            }
        });

        // 页面停留时间追踪
        let startTime = Date.now();
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                const stayTime = Date.now() - startTime;
                this.trackEvent('page_stay', {
                    duration: stayTime,
                    timestamp: new Date().toISOString()
                });
            } else {
                startTime = Date.now();
            }
        });

        // 滚动深度追踪
        let maxScrollDepth = 0;
        const trackScrollDepth = debounce(() => {
            const scrollDepth = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;
                
                // 追踪重要的滚动里程碑
                if (scrollDepth >= 25 && scrollDepth < 50 && maxScrollDepth >= 25) {
                    this.trackEvent('scroll_depth', { depth: 25 });
                } else if (scrollDepth >= 50 && scrollDepth < 75 && maxScrollDepth >= 50) {
                    this.trackEvent('scroll_depth', { depth: 50 });
                } else if (scrollDepth >= 75 && scrollDepth < 90 && maxScrollDepth >= 75) {
                    this.trackEvent('scroll_depth', { depth: 75 });
                } else if (scrollDepth >= 90 && maxScrollDepth >= 90) {
                    this.trackEvent('scroll_depth', { depth: 90 });
                }
            }
        }, 250);

        window.addEventListener('scroll', trackScrollDepth);
    }

    /**
     * 初始化错误监控
     * @private
     */
    _initErrorTracking() {
        // JavaScript错误
        window.addEventListener('error', (e) => {
            this.trackError({
                type: 'javascript_error',
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Promise拒绝
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError({
                type: 'unhandled_promise_rejection',
                reason: e.reason?.toString(),
                stack: e.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // 资源加载错误
        window.addEventListener('error', (e) => {
            if (e.target !== window) {
                this.trackError({
                    type: 'resource_error',
                    element: e.target.tagName,
                    source: e.target.src || e.target.href,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);
    }

    /**
     * 初始化性能监控
     * @private
     */
    _initPerformanceTracking() {
        // 页面加载完成后收集性能数据
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.trackEvent('performance', {
                        dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
                        tcp: Math.round(perfData.connectEnd - perfData.connectStart),
                        request: Math.round(perfData.responseStart - perfData.requestStart),
                        response: Math.round(perfData.responseEnd - perfData.responseStart),
                        dom: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                        load: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                        total: Math.round(perfData.loadEventEnd - perfData.navigationStart)
                    });
                }
            }, 1000);
        });
    }

    /**
     * 初始化Google Analytics（可选）
     * @private
     */
    async _initGoogleAnalytics() {
        // 这里可以添加Google Analytics初始化代码
        // 为了隐私考虑，默认不启用
        const GA_ID = null; // 如需启用，请设置您的GA ID
        
        if (GA_ID && window.location.hostname !== 'localhost') {
            try {
                // 动态加载GA脚本
                const script = document.createElement('script');
                script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
                script.async = true;
                document.head.appendChild(script);

                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', GA_ID, {
                    anonymize_ip: true,
                    cookie_flags: 'SameSite=None;Secure'
                });

                console.log('📊 Google Analytics 已启用');
            } catch (error) {
                console.warn('Google Analytics 初始化失败:', error);
            }
        }
    }

    /**
     * 生成会话ID
     * @private
     */
    _generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 追踪事件
     * @param {string} eventName - 事件名称
     * @param {Object} data - 事件数据
     */
    trackEvent(eventName, data = {}) {
        const event = {
            name: eventName,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            referrer: document.referrer,
            ...data
        };

        console.log('📊 事件追踪:', eventName, data);
        
        // 存储到本地（用于调试）
        this._storeEvent(event);

        // 发送到分析服务（如果配置了）
        this._sendEvent(event);
    }

    /**
     * 追踪交互
     * @param {string} type - 交互类型
     * @param {Object} data - 交互数据
     */
    trackInteraction(type, data) {
        this.interactions.push({
            type,
            timestamp: Date.now(),
            ...data
        });

        // 限制存储数量
        if (this.interactions.length > 100) {
            this.interactions = this.interactions.slice(-50);
        }

        this.trackEvent('user_interaction', { type, ...data });
    }

    /**
     * 追踪错误
     * @param {Object} error - 错误信息
     */
    trackError(error) {
        this.errors.push(error);
        
        // 限制存储数量
        if (this.errors.length > 20) {
            this.errors = this.errors.slice(-10);
        }

        console.error('🚨 错误追踪:', error);
        this.trackEvent('error', error);
    }

    /**
     * 存储事件到本地
     * @private
     */
    _storeEvent(event) {
        try {
            const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            events.push(event);
            
            // 只保留最近100个事件
            if (events.length > 100) {
                events.splice(0, events.length - 100);
            }
            
            localStorage.setItem('analytics_events', JSON.stringify(events));
        } catch (error) {
            console.warn('事件存储失败:', error);
        }
    }

    /**
     * 发送事件到分析服务
     * @private
     */
    _sendEvent(event) {
        // 这里可以添加发送到自定义分析服务的代码
        // 例如发送到自己的服务器或第三方分析服务
        
        // 示例：发送到自定义端点
        // fetch('/api/analytics', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(event)
        // }).catch(() => {}); // 静默处理失败
    }

    /**
     * 获取分析数据
     * @returns {Object} 分析数据摘要
     */
    getAnalyticsData() {
        return {
            sessionId: this.sessionId,
            vitals: this.vitals,
            interactions: this.interactions.length,
            errors: this.errors.length,
            uptime: Date.now() - this.pageLoadTime,
            events: JSON.parse(localStorage.getItem('analytics_events') || '[]').length
        };
    }

    /**
     * 清除本地数据
     */
    clearData() {
        localStorage.removeItem('analytics_events');
        this.interactions = [];
        this.errors = [];
        console.log('📊 分析数据已清除');
    }
}

// 创建单例实例
const analyticsManager = new AnalyticsManager();

// 导出方法
export const initAnalytics = () => analyticsManager.init();
export const trackEvent = (name, data) => analyticsManager.trackEvent(name, data);
export const trackInteraction = (type, data) => analyticsManager.trackInteraction(type, data);
export const trackError = (error) => analyticsManager.trackError(error);
export const getAnalyticsData = () => analyticsManager.getAnalyticsData();
export const clearAnalyticsData = () => analyticsManager.clearData();

// 导出类供高级使用
export { AnalyticsManager };
