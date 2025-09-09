/**
 * 背景管理模块
 * @module Background
 */

import { CONFIG, GRADIENTS } from './config.js';
import { randomChoice, createTimeoutController } from './utils.js';

/**
 * 背景管理器类
 */
class BackgroundManager {
    constructor() {
        this.currentGradient = null;
        this.imageLoaded = false;
    }

    /**
     * 设置初始渐变背景
     */
    setInitialBackground() {
        const randomGradient = randomChoice(GRADIENTS);
        this.currentGradient = randomGradient;
        
        document.body.style.backgroundImage = randomGradient;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.transition = 'background-image 1.5s ease-in-out';
    }

    /**
     * 获取必应每日壁纸
     * @returns {Promise<boolean>} 是否成功加载壁纸
     */
    async getBingWallpaper() {
        // 先设置渐变背景
        this.setInitialBackground();
        
        try {
            const success = await this._loadWallpaper(CONFIG.BING_WALLPAPER_URL);
            if (success) {
                this.imageLoaded = true;
                return true;
            }
            
            // 尝试备用API
            console.warn('主要壁纸API失败，尝试备用API');
            const fallbackSuccess = await this._loadWallpaper(CONFIG.BING_FALLBACK_URL);
            if (fallbackSuccess) {
                this.imageLoaded = true;
                return true;
            }
            
            console.error('所有壁纸API都失败，保留渐变背景');
            return false;
            
        } catch (error) {
            console.error('壁纸加载过程中出错:', error);
            return false;
        }
    }

    /**
     * 加载壁纸的内部方法
     * @private
     * @param {string} url - 壁纸API地址
     * @returns {Promise<boolean>} 是否成功加载
     */
    _loadWallpaper(url) {
        return new Promise((resolve) => {
            const img = new Image();
            const { controller, timeoutId, clear } = createTimeoutController(CONFIG.WALLPAPER_TIMEOUT);
            
            img.onload = () => {
                clear();
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        document.body.style.backgroundImage = `url(${img.src})`;
                        resolve(true);
                    }, 300); // 给渐变背景一点展示时间
                });
            };
            
            img.onerror = () => {
                clear();
                resolve(false);
            };

            // 添加缓存破坏参数
            const timestamp = new Date().getTime();
            img.src = `${url}?t=${timestamp}`;
            
            // 超时处理
            controller.signal.addEventListener('abort', () => {
                resolve(false);
            });
        });
    }

    /**
     * 切换到指定渐变背景
     * @param {number} index - 渐变背景索引
     */
    switchToGradient(index) {
        if (index >= 0 && index < GRADIENTS.length) {
            this.currentGradient = GRADIENTS[index];
            document.body.style.backgroundImage = this.currentGradient;
            this.imageLoaded = false;
        }
    }

    /**
     * 获取当前背景状态
     * @returns {Object} 背景状态信息
     */
    getStatus() {
        return {
            hasImage: this.imageLoaded,
            currentGradient: this.currentGradient,
            gradientCount: GRADIENTS.length
        };
    }
}

// 创建单例实例
const backgroundManager = new BackgroundManager();

// 导出方法
export const setInitialBackground = () => backgroundManager.setInitialBackground();
export const getBingWallpaper = () => backgroundManager.getBingWallpaper();
export const switchToGradient = (index) => backgroundManager.switchToGradient(index);
export const getBackgroundStatus = () => backgroundManager.getStatus();

// 导出类供高级使用
export { BackgroundManager };
