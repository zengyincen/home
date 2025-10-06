/**
 * UI交互模块
 * @module UI
 */

import { CONFIG, SOUNDS } from './config.js';
import { $, $$, on, debounce, isMobile } from './utils.js';

/**
 * UI管理器类
 */
class UIManager {
    constructor() {
        this.sounds = this._initSounds();
        this.mobileNavOpen = false;
        this.overlay = null;
    }

    /**
     * 初始化所有UI交互
     */
    init() {
        this._initNavigation();
        this._initMobileNavigation();
        this._initRippleEffect();
        this._initSoundEffects();
        this._initFormHandlers();
        this._initBackButtons();
        this._initLoadingScreen();
        this._initKeyboardNavigation();
    }

    /**
     * 初始化音效
     * @private
     */
    _initSounds() {
        const sounds = {};
        try {
            sounds.blank = new Audio(SOUNDS.BLANK);
            sounds.button = new Audio(SOUNDS.BUTTON);
            sounds.back = new Audio(SOUNDS.BACK);
            
            // 预加载音效
            Object.values(sounds).forEach(audio => {
                audio.preload = 'auto';
                audio.volume = 0.3; // 降低音量
            });
        } catch (error) {
            console.warn('音效初始化失败:', error);
        }
        return sounds;
    }

    /**
     * 播放音效
     * @private
     * @param {Audio} audio - 音频对象
     */
    _playSound(audio) {
        if (audio && typeof audio.play === 'function') {
            try {
                audio.pause();
                audio.currentTime = 0;
                audio.play().catch(() => {}); // 忽略播放失败
            } catch (error) {
                // 静默处理音效播放错误
            }
        }
    }

    /**
     * 初始化导航功能
     * @private
     */
    _initNavigation() {
        // 设置当前活动的导航项
        const setActiveNavItem = () => {
            const navItems = $$('.nav-item');
            const hash = window.location.hash;

            // 移除所有active类
            navItems.forEach(item => item.classList.remove('active'));

            // 根据当前hash设置active类
            if (hash) {
                const activeItem = $(`.nav-item[href="${hash}"]`);
                if (activeItem) {
                    activeItem.classList.add('active');
                }
            }
        };

        // 初始设置和监听hash变化
        setActiveNavItem();
        on(window, 'hashchange', setActiveNavItem);
    }

    /**
     * 初始化移动端导航
     * @private
     */
    _initMobileNavigation() {
        const menuToggle = $('.mobile-menu-toggle');
        const navigation = $('.navigation');
        
        if (!menuToggle || !navigation) return;

        // 创建遮罩层
        const createOverlay = () => {
            if (!this.overlay) {
                this.overlay = document.createElement('div');
                this.overlay.className = 'mobile-overlay';
                document.body.appendChild(this.overlay);
                // 移除点击遮罩层关闭菜单的功能
                // on(this.overlay, 'click', () => this.closeMobileMenu());
            }
        };

        // 打开移动端菜单
        this.openMobileMenu = () => {
            createOverlay();
            menuToggle.classList.add('active');
            navigation.classList.add('mobile-open');
            this.overlay.classList.add('active');
            menuToggle.setAttribute('aria-expanded', 'true');
            menuToggle.setAttribute('aria-label', '关闭菜单');
            document.body.style.overflow = 'hidden';
            this.mobileNavOpen = true;
        };

        // 关闭移动端菜单
        this.closeMobileMenu = () => {
            menuToggle.classList.remove('active');
            navigation.classList.remove('mobile-open');
            if (this.overlay) this.overlay.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', '打开菜单');
            document.body.style.overflow = '';
            this.mobileNavOpen = false;
        };

        // 切换菜单状态
        const toggleMobileMenu = () => {
            if (this.mobileNavOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        };

        // 绑定事件
        on(menuToggle, 'click', toggleMobileMenu);
        
        // 点击导航项时关闭菜单
        $$('.nav-item').forEach(item => {
            on(item, 'click', (e) => {
                // 先关闭菜单
                this.closeMobileMenu();
                // 不阻止默认行为，让链接正常跳转
            });
        });

        // ESC键关闭菜单
        on(document, 'keydown', (e) => {
            if (e.key === 'Escape' && this.mobileNavOpen) {
                this.closeMobileMenu();
            }
        });

        // 窗口大小改变时关闭移动端菜单
        on(window, 'resize', debounce(() => {
            if (window.innerWidth > CONFIG.MOBILE_BREAKPOINT && this.mobileNavOpen) {
                this.closeMobileMenu();
            }
        }, CONFIG.RESIZE_DEBOUNCE));
    }

    /**
     * 初始化波纹效果
     * @private
     */
    _initRippleEffect() {
        on(document, 'click', (e) => {
            // 排除交互元素
            if (e.target.closest('a, button, input, textarea, select, .back-btn, .nav-item')) {
                return;
            }

            const ripple = document.createElement('div');
            ripple.className = 'ripple-effect';
            ripple.style.width = ripple.style.height = CONFIG.RIPPLE_SIZE + 'px';
            ripple.style.left = (e.clientX - CONFIG.RIPPLE_SIZE / 2) + 'px';
            ripple.style.top = (e.clientY - CONFIG.RIPPLE_SIZE / 2) + 'px';
            
            document.body.appendChild(ripple);

            on(ripple, 'animationend', () => {
                ripple.remove();
            });
        });
    }

    /**
     * 初始化音效系统
     * @private
     */
    _initSoundEffects() {
        on(document, 'click', (e) => {
            // 返回键
            if (e.target.closest('.back-btn')) {
                this._playSound(this.sounds.back);
                return;
            }
            // 按钮、导航
            if (e.target.closest('a, button, .nav-item')) {
                this._playSound(this.sounds.button);
                return;
            }
            // 空白处
            this._playSound(this.sounds.blank);
        });
    }

    /**
     * 初始化表单处理
     * @private
     */
    _initFormHandlers() {
        // 友链申请表单折叠/展开功能
        const friendSubmitToggle = $('#friend-submit-toggle');
        const friendSubmitForm = $('#friend-submit-form');
        const toggleBtn = friendSubmitToggle ? friendSubmitToggle.querySelector('.toggle-btn') : null;
        
        if (friendSubmitToggle && friendSubmitForm && toggleBtn) {
            on(friendSubmitToggle, 'click', () => {
                // 切换显示状态
                const isShowing = friendSubmitForm.classList.contains('show');
                
                if (isShowing) {
                    // 折叠
                    friendSubmitForm.classList.remove('show');
                    friendSubmitForm.style.display = 'none';
                    toggleBtn.classList.remove('active');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                    toggleBtn.setAttribute('aria-label', '展开友链申请表单');
                } else {
                    // 展开
                    friendSubmitForm.style.display = 'block';
                    // 使用setTimeout确保display:block生效后再添加show类
                    setTimeout(() => {
                        friendSubmitForm.classList.add('show');
                    }, 10);
                    toggleBtn.classList.add('active');
                    toggleBtn.setAttribute('aria-expanded', 'true');
                    toggleBtn.setAttribute('aria-label', '收起友链申请表单');
                }
            });
        }

        const form = $('#friend-link-form');
        const result = $('#friend-link-result');
        
        if (!form || !result) return;

        on(form, 'submit', async (e) => {
            e.preventDefault();
            
            // 动态导入API模块
            const { submitFriendLink } = await import('./api.js');
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // 显示提交状态
            result.textContent = '正在提交...';
            result.style.color = '#ffa500';
            
            try {
                const response = await submitFriendLink(data);
                
                result.textContent = response.message;
                result.style.color = response.success ? '#6cf' : '#ff6b6b';
                
                if (response.success) {
                    form.reset();
                }
            } catch (error) {
                result.textContent = '提交失败，请稍后重试。';
                result.style.color = '#ff6b6b';
            }
        });
    }

    /**
     * 初始化返回按钮
     * @private
     */
    _initBackButtons() {
        $$('.back-btn').forEach(btn => {
            on(btn, 'click', (e) => {
                e.preventDefault();
                window.location.hash = '';
            });
        });
    }

    /**
     * 初始化加载屏幕
     * @private
     */
    _initLoadingScreen() {
        const loading = $('#global-loading');
        if (!loading) return;

        setTimeout(() => {
            loading.classList.add('hide');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }, CONFIG.LOADING_DELAY);
    }

    /**
     * 初始化键盘导航
     * @private
     */
    _initKeyboardNavigation() {
        // Tab键导航优化
        on(document, 'keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        on(document, 'mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // 快捷键支持
        on(document, 'keydown', (e) => {
            // Alt + M 打开/关闭移动菜单
            if (e.altKey && e.key === 'm' && isMobile()) {
                e.preventDefault();
                const menuToggle = $('.mobile-menu-toggle');
                if (menuToggle) {
                    menuToggle.click();
                }
            }
        });
    }

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success', 'error', 'warning', 'info')
     * @param {number} duration - 显示时长（毫秒）
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // 根据类型设置颜色
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    /**
     * 更新年份显示
     */
    updateYear() {
        const yearSpan = $('#current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
    }

    /**
     * 获取UI状态
     * @returns {Object} UI状态信息
     */
    getStatus() {
        return {
            mobileNavOpen: this.mobileNavOpen,
            isMobile: isMobile(),
            soundsLoaded: Object.keys(this.sounds).length > 0,
            hasOverlay: !!this.overlay
        };
    }
}

// 创建单例实例
const uiManager = new UIManager();

// 导出方法
export const initUI = () => uiManager.init();
export const showNotification = (message, type, duration) => uiManager.showNotification(message, type, duration);
export const updateYear = () => uiManager.updateYear();
export const getUIStatus = () => uiManager.getStatus();

// 导出类供高级使用
export { UIManager };
