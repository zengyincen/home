/**
 * 错误处理模块
 * @module ErrorHandler
 */

import { showNotification } from './ui.js';

/**
 * 错误处理器类
 */
class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxErrors = 10;
        this.initialized = false;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
    }

    /**
     * 初始化错误处理系统
     */
    init() {
        if (this.initialized) return;

        console.log('🛡️ 初始化错误处理系统...');

        // 设置全局错误处理
        this._setupGlobalErrorHandling();
        
        // 设置网络错误处理
        this._setupNetworkErrorHandling();
        
        // 设置Promise错误处理
        this._setupPromiseErrorHandling();

        this.initialized = true;
        console.log('✅ 错误处理系统初始化完成');
    }

    /**
     * 设置全局错误处理
     * @private
     */
    _setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            const error = {
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            this.handleError(error, {
                showNotification: true,
                logToConsole: true,
                severity: 'high'
            });
        });
    }

    /**
     * 设置网络错误处理
     * @private
     */
    _setupNetworkErrorHandling() {
        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // 检查HTTP错误状态
                if (!response.ok) {
                    const error = {
                        type: 'network_error',
                        status: response.status,
                        statusText: response.statusText,
                        url: args[0],
                        method: args[1]?.method || 'GET',
                        timestamp: new Date().toISOString()
                    };

                    this.handleError(error, {
                        showNotification: response.status >= 500,
                        logToConsole: true,
                        severity: response.status >= 500 ? 'high' : 'medium'
                    });
                }

                return response;
            } catch (networkError) {
                const error = {
                    type: 'network_failure',
                    message: networkError.message,
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    timestamp: new Date().toISOString()
                };

                this.handleError(error, {
                    showNotification: true,
                    logToConsole: true,
                    severity: 'high'
                });

                throw networkError;
            }
        };
    }

    /**
     * 设置Promise错误处理
     * @private
     */
    _setupPromiseErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            const error = {
                type: 'unhandled_promise_rejection',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

            this.handleError(error, {
                showNotification: true,
                logToConsole: true,
                severity: 'high'
            });

            // 阻止默认的控制台错误输出
            event.preventDefault();
        });
    }

    /**
     * 处理错误
     * @param {Object} error - 错误对象
     * @param {Object} options - 处理选项
     */
    handleError(error, options = {}) {
        const defaultOptions = {
            showNotification: false,
            logToConsole: true,
            severity: 'medium',
            retry: false,
            fallback: null
        };

        const config = { ...defaultOptions, ...options };

        // 添加到错误队列
        this._addToErrorQueue(error);

        // 控制台日志
        if (config.logToConsole) {
            this._logError(error, config.severity);
        }

        // 显示用户通知
        if (config.showNotification) {
            this._showUserNotification(error, config.severity);
        }

        // 尝试恢复
        if (config.retry) {
            this._attemptRecovery(error, config);
        }

        // 执行降级方案
        if (config.fallback && typeof config.fallback === 'function') {
            try {
                config.fallback(error);
            } catch (fallbackError) {
                console.error('降级方案执行失败:', fallbackError);
            }
        }

        // 发送错误报告（如果配置了）
        this._reportError(error);
    }

    /**
     * 添加错误到队列
     * @private
     */
    _addToErrorQueue(error) {
        this.errorQueue.push({
            ...error,
            id: this._generateErrorId(),
            handled: true
        });

        // 限制队列大小
        if (this.errorQueue.length > this.maxErrors) {
            this.errorQueue.shift();
        }
    }

    /**
     * 记录错误日志
     * @private
     */
    _logError(error, severity) {
        const logMethod = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'log';
        
        console[logMethod]('🚨 错误处理:', {
            type: error.type,
            message: error.message,
            timestamp: error.timestamp,
            details: error
        });
    }

    /**
     * 显示用户通知
     * @private
     */
    _showUserNotification(error, severity) {
        let message = '出现了一个问题';
        let type = 'error';

        switch (error.type) {
            case 'network_error':
            case 'network_failure':
                message = '网络连接出现问题，请检查网络后重试';
                type = 'warning';
                break;
            case 'javascript_error':
                message = '页面功能异常，请刷新页面重试';
                break;
            case 'unhandled_promise_rejection':
                message = '操作失败，请稍后重试';
                break;
            default:
                message = '系统出现异常，请刷新页面';
        }

        // 根据严重程度调整通知类型
        if (severity === 'low') {
            type = 'info';
        } else if (severity === 'medium') {
            type = 'warning';
        }

        showNotification(message, type, 5000);
    }

    /**
     * 尝试错误恢复
     * @private
     */
    _attemptRecovery(error, config) {
        const errorKey = this._getErrorKey(error);
        const attempts = this.retryAttempts.get(errorKey) || 0;

        if (attempts < this.maxRetries) {
            this.retryAttempts.set(errorKey, attempts + 1);
            
            console.log(`🔄 尝试恢复错误 (${attempts + 1}/${this.maxRetries}):`, error.type);

            // 根据错误类型执行不同的恢复策略
            switch (error.type) {
                case 'network_failure':
                    this._retryNetworkRequest(error);
                    break;
                case 'javascript_error':
                    this._reloadComponent(error);
                    break;
                default:
                    console.warn('无法自动恢复的错误类型:', error.type);
            }
        } else {
            console.error('❌ 错误恢复失败，已达到最大重试次数:', error.type);
            this.retryAttempts.delete(errorKey);
        }
    }

    /**
     * 重试网络请求
     * @private
     */
    _retryNetworkRequest(error) {
        // 延迟重试
        setTimeout(() => {
            if (error.url && error.method) {
                console.log('🔄 重试网络请求:', error.url);
                
                // 这里可以实现具体的重试逻辑
                // 例如重新调用API或重新加载资源
            }
        }, 1000 * (this.retryAttempts.get(this._getErrorKey(error)) || 1));
    }

    /**
     * 重新加载组件
     * @private
     */
    _reloadComponent(error) {
        // 根据错误来源决定重新加载哪个组件
        if (error.filename && error.filename.includes('background')) {
            // 重新初始化背景模块
            import('./background.js').then(({ getBingWallpaper }) => {
                getBingWallpaper().catch(() => {
                    console.warn('背景重新加载失败');
                });
            });
        } else if (error.filename && error.filename.includes('api')) {
            // 重新初始化API模块
            import('./api.js').then(({ getHitokoto, updateHitokotoDisplay }) => {
                getHitokoto().then(updateHitokotoDisplay).catch(() => {
                    console.warn('API重新加载失败');
                });
            });
        }
    }

    /**
     * 生成错误ID
     * @private
     */
    _generateErrorId() {
        return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取错误键
     * @private
     */
    _getErrorKey(error) {
        return `${error.type}_${error.message}_${error.filename || error.url || 'unknown'}`;
    }

    /**
     * 发送错误报告
     * @private
     */
    _reportError(error) {
        // 这里可以添加发送错误报告到服务器的逻辑
        // 为了隐私和简洁，默认只在本地记录
        
        try {
            const reports = JSON.parse(localStorage.getItem('error_reports') || '[]');
            reports.push({
                ...error,
                reportedAt: new Date().toISOString()
            });

            // 只保留最近20个错误报告
            if (reports.length > 20) {
                reports.splice(0, reports.length - 20);
            }

            localStorage.setItem('error_reports', JSON.stringify(reports));
        } catch (storageError) {
            console.warn('错误报告存储失败:', storageError);
        }
    }

    /**
     * 创建安全的异步函数包装器
     * @param {Function} asyncFn - 异步函数
     * @param {Object} options - 错误处理选项
     * @returns {Function} 包装后的函数
     */
    wrapAsync(asyncFn, options = {}) {
        return async (...args) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                this.handleError({
                    type: 'async_function_error',
                    message: error.message,
                    stack: error.stack,
                    functionName: asyncFn.name || 'anonymous',
                    timestamp: new Date().toISOString()
                }, {
                    showNotification: true,
                    retry: options.retry || false,
                    fallback: options.fallback,
                    ...options
                });

                if (options.rethrow !== false) {
                    throw error;
                }
            }
        };
    }

    /**
     * 创建安全的事件处理器包装器
     * @param {Function} handler - 事件处理函数
     * @param {Object} options - 错误处理选项
     * @returns {Function} 包装后的处理器
     */
    wrapEventHandler(handler, options = {}) {
        return (event) => {
            try {
                return handler(event);
            } catch (error) {
                this.handleError({
                    type: 'event_handler_error',
                    message: error.message,
                    stack: error.stack,
                    eventType: event?.type,
                    timestamp: new Date().toISOString()
                }, {
                    showNotification: false,
                    logToConsole: true,
                    ...options
                });
            }
        };
    }

    /**
     * 获取错误统计
     * @returns {Object} 错误统计信息
     */
    getErrorStats() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const recentErrors = this.errorQueue.filter(error => 
            new Date(error.timestamp).getTime() > oneHourAgo
        );

        const dailyErrors = this.errorQueue.filter(error => 
            new Date(error.timestamp).getTime() > oneDayAgo
        );

        const errorTypes = {};
        this.errorQueue.forEach(error => {
            errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
        });

        return {
            total: this.errorQueue.length,
            recent: recentErrors.length,
            daily: dailyErrors.length,
            types: errorTypes,
            retryAttempts: Object.fromEntries(this.retryAttempts)
        };
    }

    /**
     * 清除错误数据
     */
    clearErrors() {
        this.errorQueue = [];
        this.retryAttempts.clear();
        localStorage.removeItem('error_reports');
        console.log('🧹 错误数据已清除');
    }
}

// 创建单例实例
const errorHandler = new ErrorHandler();

// 导出方法
export const initErrorHandler = () => errorHandler.init();
export const handleError = (error, options) => errorHandler.handleError(error, options);
export const wrapAsync = (fn, options) => errorHandler.wrapAsync(fn, options);
export const wrapEventHandler = (handler, options) => errorHandler.wrapEventHandler(handler, options);
export const getErrorStats = () => errorHandler.getErrorStats();
export const clearErrors = () => errorHandler.clearErrors();

// 导出类供高级使用
export { ErrorHandler };
