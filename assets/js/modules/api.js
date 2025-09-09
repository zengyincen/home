/**
 * API管理模块
 * @module API
 */

import { CONFIG } from './config.js';
import { $, createTimeoutController } from './utils.js';

/**
 * API管理器类
 */
class APIManager {
    constructor() {
        this.cache = new Map();
        this.retryCount = new Map();
        this.maxRetries = 2;
    }

    /**
     * 获取一言
     * @returns {Promise<Object>} 一言数据
     */
    async getHitokoto() {
        // 使用时间戳作为缓存键，确保每次页面刷新都获取新内容
        const cacheKey = `hitokoto_${Date.now()}`;
        
        try {
            const { controller, timeoutId, clear } = createTimeoutController(CONFIG.API_TIMEOUT);
            
            // 添加随机参数确保不会被浏览器缓存
            const apiUrl = `${CONFIG.HITOKOTO_API}&_t=${Date.now()}&_r=${Math.random()}`;
            
            const response = await fetch(apiUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            clear();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const jsonData = await response.json();
            const data = {
                text: jsonData.hitokoto || jsonData.text || '获取一言失败',
                from: jsonData.from || jsonData.from_who || '一言',
                success: true,
                timestamp: new Date().toISOString()
            };
            
            // 清理旧的缓存，只保留最新的
            this._cleanupHitokotoCache();
            // 缓存成功的结果（仅作为备用，不用于页面刷新）
            this.cache.set(cacheKey, data);
            this.retryCount.delete('hitokoto');
            
            return data;
            
        } catch (error) {
            console.error('主要一言API失败:', error);
            
            // 尝试备用API
            try {
                console.log('尝试备用一言API...');
                const backupApiUrl = `${CONFIG.HITOKOTO_BACKUP_API}&_t=${Date.now()}`;
                
                const backupResponse = await fetch(backupApiUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (backupResponse.ok) {
                    const backupData = await backupResponse.json();
                    const data = {
                        text: backupData.content || backupData.text || '获取一言失败',
                        from: '情话API',
                        success: true,
                        isBackup: true,
                        timestamp: new Date().toISOString()
                    };
                    
                    // 缓存备用API的结果（仅作为备用）
                    this.cache.set(cacheKey, data);
                    return data;
                }
            } catch (backupError) {
                console.error('备用一言API也失败:', backupError);
            }
            
            return this._getFallbackHitokoto();
        }
    }

    /**
     * 提交友链申请
     * @param {Object} formData - 表单数据
     * @returns {Promise<Object>} 提交结果
     */
    async submitFriendLink(formData) {
        try {
            // 自动获取favicon
            let logo = formData.logo?.trim() || '';
            if (!logo && formData.url) {
                logo = this._generateFaviconUrl(formData.url);
            }

            const data = {
                name: formData.name,
                url: formData.url,
                logo: logo,
                desc: formData.desc || '',
                pushType: formData.pushType
            };

            const { controller, timeoutId, clear } = createTimeoutController(CONFIG.API_TIMEOUT * 2);
            
            const response = await fetch(CONFIG.FRIEND_LINK_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clear();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            return {
                success: true,
                message: '感谢您的提交！我们会尽快审核。',
                data: result
            };

        } catch (error) {
            console.error('友链提交失败:', error);
            
            return {
                success: false,
                message: '提交失败，请稍后重试。',
                error: error.message
            };
        }
    }

    /**
     * 生成favicon URL
     * @private
     * @param {string} url - 网站URL
     * @returns {string} favicon URL
     */
    _generateFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            // 主接口
            return `https://www.faviconextractor.com/favicon/${domain}`;
        } catch {
            return '';
        }
    }

    /**
     * 获取备用一言
     * @private
     * @returns {Object} 备用一言数据
     */
    _getFallbackHitokoto() {
        const fallbackTexts = [
            '哪有什么岁月静好，不过是有人在替你负重前行。',
            '生活不止眼前的苟且，还有诗和远方的田野。',
            '愿你走出半生，归来仍是少年。',
            '山川是不卷收的文章，日月为你掌灯伴读。',
            '纵然万劫不复，纵然相思入骨，我也待你眉眼如初，岁月如故。',
            '世界上最遥远的距离，不是生与死，而是我就站在你面前，你却不知道我爱你。',
            '我们听过无数的道理，却仍旧过不好这一生。',
            '有些人，一旦错过就不再。',
            '时间会带走一切，长年累月会把你的名字、外貌、性格、命运都改变。',
            '每个人都有一个死角，自己走不出来，别人也闯不进去。',
            '青春是一本太仓促的书，我们含着眼泪，一读再读。',
            '你若安好，便是晴天。',
            '时光荏苒，愿你我都能成为更好的自己。',
            '路漫漫其修远兮，吾将上下而求索。',
            '落红不是无情物，化作春泥更护花。'
        ];
        
        // 使用时间戳和随机数确保每次都不同
        const randomIndex = (Date.now() + Math.floor(Math.random() * 1000)) % fallbackTexts.length;
        const randomText = fallbackTexts[randomIndex];
        
        return {
            text: randomText,
            from: '备用语录',
            success: false,
            isFallback: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 更新一言显示
     * @param {Object} data - 一言数据
     */
    updateHitokotoDisplay(data) {
        const hitokotoText = $('.hitokoto-text');
        const hitokotoFrom = $('.hitokoto-from');
        
        if (!hitokotoText || !hitokotoFrom) return;

        // 设置透明度为0
        hitokotoText.style.opacity = '0';
        hitokotoFrom.style.opacity = '0';
        
        // 更新文本内容
        hitokotoText.textContent = data.text;
        hitokotoFrom.textContent = `- [${data.from}]`;
        
        // 使用setTimeout实现淡入效果
        setTimeout(() => {
            hitokotoText.style.transition = 'opacity 0.8s ease';
            hitokotoFrom.style.transition = 'opacity 0.8s ease';
            hitokotoText.style.opacity = '1';
            hitokotoFrom.style.opacity = '1';
        }, 100);
    }

    /**
     * 清除API缓存
     * @param {string} key - 缓存键，不传则清除所有
     */
    clearCache(key) {
        if (key) {
            this.cache.delete(key);
            this.retryCount.delete(key);
        } else {
            this.cache.clear();
            this.retryCount.clear();
        }
    }

    /**
     * 清理一言缓存
     * @private
     */
    _cleanupHitokotoCache() {
        // 清理所有一言相关的缓存
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith('hitokoto_')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * 获取缓存状态
     * @returns {Object} 缓存状态
     */
    getCacheStatus() {
        return {
            cacheSize: this.cache.size,
            cachedKeys: Array.from(this.cache.keys()),
            retryStatus: Object.fromEntries(this.retryCount)
        };
    }
}

// 创建单例实例
const apiManager = new APIManager();

// 导出方法
export const getHitokoto = () => apiManager.getHitokoto();
export const submitFriendLink = (data) => apiManager.submitFriendLink(data);
export const updateHitokotoDisplay = (data) => apiManager.updateHitokotoDisplay(data);
export const clearAPICache = (key) => apiManager.clearCache(key);
export const getAPICacheStatus = () => apiManager.getCacheStatus();

// 导出类供高级使用
export { APIManager };
