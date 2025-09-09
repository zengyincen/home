/**
 * 工具函数模块
 * @module Utils
 */

/**
 * 防抖函数 - 性能优化
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 节流函数 - 限制函数执行频率
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 延迟执行函数
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise} Promise对象
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全的querySelector
 * @param {string} selector - CSS选择器
 * @param {Element} context - 查找上下文，默认为document
 * @returns {Element|null} 找到的元素或null
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * 安全的querySelectorAll
 * @param {string} selector - CSS选择器
 * @param {Element} context - 查找上下文，默认为document
 * @returns {NodeList} 找到的元素列表
 */
export function $$(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * 添加事件监听器的便捷方法
 * @param {Element} element - DOM元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object} options - 事件选项
 */
export function on(element, event, handler, options = {}) {
    if (element && typeof handler === 'function') {
        element.addEventListener(event, handler, options);
    }
}

/**
 * 移除事件监听器的便捷方法
 * @param {Element} element - DOM元素
 * @param {string} event - 事件类型
 * @param {Function} handler - 事件处理函数
 */
export function off(element, event, handler) {
    if (element && typeof handler === 'function') {
        element.removeEventListener(event, handler);
    }
}

/**
 * 检查是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export function isMobile() {
    return window.innerWidth <= 480;
}

/**
 * 检查是否为平板设备
 * @returns {boolean} 是否为平板设备
 */
export function isTablet() {
    return window.innerWidth > 480 && window.innerWidth <= 768;
}

/**
 * 生成随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数
 */
export function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 从数组中随机选择一个元素
 * @param {Array} array - 数组
 * @returns {*} 随机选择的元素
 */
export function randomChoice(array) {
    return array[random(0, array.length - 1)];
}

/**
 * 创建Promise超时控制器
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Object} 包含controller和timeoutId的对象
 */
export function createTimeoutController(timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    return {
        controller,
        timeoutId,
        clear: () => clearTimeout(timeoutId)
    };
}
