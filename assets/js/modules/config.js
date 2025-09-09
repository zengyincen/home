/**
 * 配置模块 - 统一管理所有API和服务端地址
 * @module Config
 */

export const CONFIG = {
    // API配置
    BING_WALLPAPER_URL: 'https://bing.img.run/rand.php',
    BING_FALLBACK_URL: 'https://api.dujin.org/bing/1920.php',
    HITOKOTO_API: 'https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=h&c=i&c=k',
    HITOKOTO_BACKUP_API: 'https://api.uomg.com/api/rand.qinghua?format=json',
    FRIEND_LINK_API: 'https://home-push-friend-link.952780.xyz/',
    
    // 性能配置
    DEBOUNCE_DELAY: 300,
    API_TIMEOUT: 3000,
    WALLPAPER_TIMEOUT: 5000,
    RESIZE_DEBOUNCE: 250,
    
    // UI配置
    LOADING_DELAY: 300,
    TRANSITION_DURATION: 300,
    RIPPLE_SIZE: 120,
    
    // 移动端配置
    MOBILE_BREAKPOINT: 480,
    TABLET_BREAKPOINT: 768
};

/**
 * 默认渐变背景配置
 */
export const GRADIENTS = [
    'linear-gradient(to right, #4568dc, #b06ab3)',
    'linear-gradient(to right, #2980b9, #6dd5fa)',
    'linear-gradient(to right, #403b4a, #e7e9bb)',
    'linear-gradient(to right, #334d50, #cbcaa5)',
    'linear-gradient(to right, #5f2c82, #49a09d)'
];

/**
 * 音效文件路径配置
 */
export const SOUNDS = {
    BLANK: '/assets/sounds/click-blank.wav',
    BUTTON: '/assets/sounds/click-btn.wav',
    BACK: '/assets/sounds/click-back.wav'
};
