// 向后兼容版本 - 使用旧的API配置
// 注意：这个文件仅为不支持ES6模块的浏览器提供降级支持
const CONFIG = {
    BING_WALLPAPER_URL: 'https://bing.img.run/rand.php',
    BING_FALLBACK_URL: 'https://api.dujin.org/bing/1920.php',
    HITOKOTO_API: 'https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=h&c=i&c=k',
    FRIEND_LINK_API: 'https://home-push-friend-link.952780.xyz/'
};

// 简化版本：不包含复杂的服务工作者管理

// 性能优化：使用防抖函数
function debounce(func, delay = 300) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// 设置初始渐变背景
function setInitialBackground() {
    const gradients = [
        'linear-gradient(to right, #4568dc, #b06ab3)',
        'linear-gradient(to right, #2980b9, #6dd5fa)',
        'linear-gradient(to right, #403b4a, #e7e9bb)',
        'linear-gradient(to right, #334d50, #cbcaa5)',
        'linear-gradient(to right, #5f2c82, #49a09d)'
    ];
    
    // 随机选择一个渐变
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    
    document.body.style.backgroundImage = randomGradient;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.transition = 'background-image 1.5s ease-in-out';
}

// 获取必应每日壁纸
function getBingWallpaper() {
    // 先设置渐变背景
    setInitialBackground();
    
    const img = new Image();
    
    // 设置加载和错误处理
    img.onload = () => {
        // 使用requestAnimationFrame和setTimeout组合优化渲染性能
        requestAnimationFrame(() => {
            setTimeout(() => {
                document.body.style.backgroundImage = `url(${img.src})`;
            }, 300); // 给渐变背景一点展示时间
        });
    };
    
    img.onerror = () => {
        console.error('获取必应壁纸失败，尝试备用API');
        tryFallbackWallpaper();
    };

    // 添加缓存破坏参数
    const timestamp = new Date().getTime();
    img.src = `${CONFIG.BING_WALLPAPER_URL}?t=${timestamp}`;
    
    // 设置超时，5秒后如果图片还未加载则尝试备用
    setTimeout(() => {
        if (!img.complete) {
            console.warn('获取必应壁纸超时，尝试备用API');
            tryFallbackWallpaper();
        }
    }, 5000);
}

// 尝试使用备用壁纸API
function tryFallbackWallpaper() {
    const backupImg = new Image();
    
    backupImg.onload = () => {
        requestAnimationFrame(() => {
            document.body.style.backgroundImage = `url(${backupImg.src})`;
        });
    };
    
    backupImg.onerror = () => {
        console.error('备用壁纸API也失败，保留渐变背景');
    };
    
    const timestamp = new Date().getTime();
    backupImg.src = `${CONFIG.BING_FALLBACK_URL}?t=${timestamp}`;
    
    // 设置超时
    setTimeout(() => {
        if (!backupImg.complete) {
            console.warn('备用壁纸API超时，保留渐变背景');
        }
    }, 3000);
}

// 已删除未使用的setBackground函数

// 获取一言
async function getHitokoto() {
    try {
        // 创建一个超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
        
        // 直接使用fetch请求新API
        const response = await fetch(CONFIG.HITOKOTO_API, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // 添加淡入效果
        const hitokotoText = document.querySelector('.hitokoto-text');
        const hitokotoFrom = document.querySelector('.hitokoto-from');
        
        // 设置透明度为0
        hitokotoText.style.opacity = '0';
        hitokotoFrom.style.opacity = '0';
        
        // 更新文本内容 - 新API直接返回文本
        hitokotoText.textContent = text.trim();
        hitokotoFrom.textContent = '- [每日一言]';
        
        // 使用setTimeout实现淡入效果
        setTimeout(() => {
            hitokotoText.style.transition = 'opacity 0.8s ease';
            hitokotoFrom.style.transition = 'opacity 0.8s ease';
            hitokotoText.style.opacity = '1';
            hitokotoFrom.style.opacity = '1';
        }, 100);
        
    } catch (error) {
        console.error('获取一言失败:', error);
        fallbackHitokoto();
    }
}

// 一言API失败时的备用显示
function fallbackHitokoto() {
    // 设置默认一言
    document.querySelector('.hitokoto-text').textContent = '哪有什么岁月静好，不过是有人在替你负重前行。';
    document.querySelector('.hitokoto-from').textContent = '- [网络]';
}

// 已删除未使用的formatDate函数



// 页面加载后主入口
// 包含：自动设置年份、返回按钮处理、表单处理、导航高亮等

document.addEventListener('DOMContentLoaded', function() {
    // 并行加载资源
    Promise.all([
        new Promise(resolve => {
            getBingWallpaper();
            resolve();
        }),
        getHitokoto()
    ]).catch(err => console.error('资源加载错误:', err));

    // 自动设置年份
    var yearSpan = document.getElementById('current-year');
    if(yearSpan) yearSpan.textContent = new Date().getFullYear();

    // 统一处理所有返回按钮，点击后清空hash，返回主页
    document.querySelectorAll('.back-btn').forEach(function(btn){
        btn.addEventListener('click', function(e){
            e.preventDefault();
            window.location.hash = '';
        });
    });

    // 设置当前活动的导航项
    setActiveNavItem();

    // 监听hash变化
    window.addEventListener('hashchange', setActiveNavItem);

    // 初始化移动端导航
    initMobileNavigation();


    
    // 添加窗口大小变化监听，使用防抖优化性能
    window.addEventListener('resize', debounce(() => {
        // 可以在这里添加响应窗口大小变化的逻辑
    }, 200));
    
    // 不再定期更新一言，仅在页面刷新时获取新内容
    
    // 等待字体和背景图片都加载好后再移除 loading
    setTimeout(() => {
        document.getElementById('global-loading').classList.add('hide');
        setTimeout(() => {
            document.getElementById('global-loading').style.display = 'none';
        }, 500);
    }, 300); // 可根据实际情况调整延迟

    // 友链申请表单折叠/展开功能
    var friendSubmitToggle = document.getElementById('friend-submit-toggle');
    var friendSubmitForm = document.getElementById('friend-submit-form');
    var toggleBtn = friendSubmitToggle ? friendSubmitToggle.querySelector('.toggle-btn') : null;
    
    if (friendSubmitToggle && friendSubmitForm && toggleBtn) {
        friendSubmitToggle.addEventListener('click', function() {
            // 切换显示状态
            var isShowing = friendSubmitForm.classList.contains('show');
            
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
                setTimeout(function() {
                    friendSubmitForm.classList.add('show');
                }, 10);
                toggleBtn.classList.add('active');
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.setAttribute('aria-label', '收起友链申请表单');
            }
        });
    }

    // 友链表单提交处理
    var form = document.getElementById('friend-link-form');
    if(form) {
        form.onsubmit = async function(e) {
            e.preventDefault();
            let logo = form.logo.value.trim();
            const url = form.url.value.trim();
            // 自动获取favicon，主接口+备用接口
            function getFaviconUrls(domain) {
                return [
                    `https://www.faviconextractor.com/favicon/${domain}`,
                    `https://api.iowen.cn/favicon/${domain}.png`
                ];
            }
            if (!logo) {
                try {
                    const u = new URL(url);
                    const domain = u.hostname;
                    // 默认用主接口
                    logo = getFaviconUrls(domain)[0];
                } catch {
                    logo = '';
                }
            }
            const data = {
                name: form.name.value,
                url: url,
                logo: logo,
                desc: form.desc.value,
                pushType: form.pushType.value
            };
            try {
                await fetch(CONFIG.FRIEND_LINK_API, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                document.getElementById('friend-link-result').textContent = '感谢您的提交！我们会尽快审核。';
                form.reset();
            } catch {
                document.getElementById('friend-link-result').textContent = '提交失败，请稍后重试。';
            }
        };
    }

    // 自动播放APlayer音乐（需用户首次交互后）
    function tryPlay() {
        var meting = document.querySelector('meting-js');
        if (meting && meting.aplayer && meting.aplayer.audio && meting.aplayer.audio.paused) {
            meting.aplayer.audio.play();
        }
        document.removeEventListener('click', tryPlay);
        document.removeEventListener('touchstart', tryPlay);
    }
    document.addEventListener('click', tryPlay);
    document.addEventListener('touchstart', tryPlay);
});

// 从 index.html 移动过来的函数
// 设置当前活动的导航项
function setActiveNavItem() {
    const navItems = document.querySelectorAll('.nav-item');
    const hash = window.location.hash;

    // 移除所有active类
    navItems.forEach(item => item.classList.remove('active'));

    // 根据当前hash设置active类
    if (hash) {
        const activeItem = document.querySelector(`.nav-item[href="${hash}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
    // 如果没有hash，则不设置任何活动项
}

// 初始化移动端导航
function initMobileNavigation() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navigation = document.querySelector('.navigation');
    let overlay = null;
    
    if (!menuToggle || !navigation) return;
    
    // 创建遮罩层
    function createOverlay() {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            document.body.appendChild(overlay);
            
            // 移除点击遮罩关闭菜单的功能
            // overlay.addEventListener('click', closeMobileMenu);
        }
    }
    
    // 打开移动端菜单
    function openMobileMenu() {
        createOverlay();
        menuToggle.classList.add('active');
        navigation.classList.add('mobile-open');
        overlay.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', '关闭菜单');
        
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
    }
    
    // 关闭移动端菜单
    function closeMobileMenu() {
        menuToggle.classList.remove('active');
        navigation.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', '打开菜单');
        
        // 恢复背景滚动
        document.body.style.overflow = '';
    }
    
    // 切换菜单状态
    function toggleMobileMenu() {
        if (navigation.classList.contains('mobile-open')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
    
    // 绑定事件
    menuToggle.addEventListener('click', toggleMobileMenu);
    
    // 点击导航项时关闭菜单
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // 先关闭菜单
            closeMobileMenu();
            // 不阻止默认行为，让链接正常跳转
        });
    });
    
    // ESC键关闭菜单
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navigation.classList.contains('mobile-open')) {
            closeMobileMenu();
        }
    });
    
    // 窗口大小改变时关闭移动端菜单
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 480 && navigation.classList.contains('mobile-open')) {
            closeMobileMenu();
        }
    }, 250));
}

document.addEventListener('click', function(e) {
  // 排除按钮、链接、输入框等交互元素
  if (
    e.target.closest('a, button, input, textarea, select, .back-btn, .nav-item')
  ) return;

  const ripple = document.createElement('div');
  ripple.className = 'ripple-effect';
  const size = 120;
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - size / 2) + 'px';
  ripple.style.top = (e.clientY - size / 2) + 'px';
  document.body.appendChild(ripple);

  ripple.addEventListener('animationend', () => {
    ripple.remove();
  });
});

// 预加载音效
const soundBlank = new Audio('/assets/sounds/click-blank.wav');
const soundBtn = new Audio('/assets/sounds/click-btn.wav');
const soundBack = new Audio('/assets/sounds/click-back.wav');

function playSound(audio) {
  audio.pause();
  audio.currentTime = 0;
  audio.play();
}

document.addEventListener('click', function(e) {
  // 返回键
  if (e.target.closest('.back-btn')) {
    playSound(soundBack);
    return;
  }
  // 按钮、导航
  if (e.target.closest('a, button, .nav-item')) {
    playSound(soundBtn);
    return;
  }
  // 空白处
  playSound(soundBlank);
});