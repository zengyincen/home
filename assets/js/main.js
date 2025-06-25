// 配置信息，统一管理所有API和服务端地址
const CONFIG = {
    BING_WALLPAPER_URL: 'https://bing.img.run/rand.php', // 必应壁纸API
    BING_FALLBACK_URL: 'https://api.dujin.org/bing/1920.php', // 备用壁纸API
    HITOKOTO_API: 'https://v1.hitokoto.cn', // 一言API
    FRIEND_LINK_API: 'https://home-push-friend-link.952780.xyz/', // 友链推送API地址
    WALINE_SERVER_URL: 'https://waline.952780.xyz' // Waline评论系统服务端地址
};

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

// 设置固定背景色或图片
function setBackground() {
    document.body.style.backgroundColor = '#121212';
    document.body.style.backgroundImage = 'none';
}

// 获取一言
async function getHitokoto() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
        
        const response = await fetch(CONFIG.HITOKOTO_API, { 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        // 添加淡入效果
        const hitokotoText = document.querySelector('.hitokoto-text');
        const hitokotoFrom = document.querySelector('.hitokoto-from');
        
        // 设置透明度为0
        hitokotoText.style.opacity = '0';
        hitokotoFrom.style.opacity = '0';
        
        // 更新文本内容
        hitokotoText.textContent = data.hitokoto;
        hitokotoFrom.textContent = `- [${data.from}]`;
        
        // 使用setTimeout实现淡入效果
        setTimeout(() => {
            hitokotoText.style.transition = 'opacity 0.8s ease';
            hitokotoFrom.style.transition = 'opacity 0.8s ease';
            hitokotoText.style.opacity = '1';
            hitokotoFrom.style.opacity = '1';
        }, 100);
    } catch (error) {
        console.error('获取一言失败:', error);
        // 设置默认一言
        document.querySelector('.hitokoto-text').textContent = '哪有什么岁月静好，不过是有人在替你负重前行。';
        document.querySelector('.hitokoto-from').textContent = '- [网络]';
    }
}

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
}

// 创建留言HTML
function createMessageHTML(message) {
    return `
        <div class="message-item">
            <div class="message-header">
                <span class="message-author">${message.name}</span>
                <span class="message-date">${formatDate(message.timestamp)}</span>
            </div>
            <div class="message-content">
                <p>${message.content}</p>
            </div>
        </div>
    `;
}

// 获取留言列表
async function getMessages() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/messages`);
        if (!response.ok) throw new Error('获取留言失败');
        
        const messages = await response.json();
        const messageList = document.querySelector('.message-list');
        messageList.innerHTML = '';
        
        messages.forEach(message => {
            messageList.insertAdjacentHTML('beforeend', createMessageHTML(message));
        });
    } catch (error) {
        console.error('获取留言失败:', error);
        alert('获取留言失败，请稍后再试');
    }
}

// 页面加载后主入口
// 包含：自动设置年份、返回按钮处理、表单处理、导航高亮、Waline初始化等

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

    if (window.location.hash === '#guestbook') {
        // 添加小延迟确保DOM已完全渲染
        setTimeout(() => {
            const guestbookSection = document.getElementById('guestbook');
            if (guestbookSection) {
                guestbookSection.style.transform = 'translateY(0)';
                guestbookSection.style.visibility = 'visible';

                // 只有在可见时才加载评论系统
                if (typeof loadWaline === 'function') {
                    loadWaline();
                }
            }
        }, 100);
    }
    
    // 添加页面可见性监听，节省资源
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // 页面重新可见时刷新一言
            getHitokoto();
        }
    });

    // 添加窗口大小变化监听，使用防抖优化性能
    window.addEventListener('resize', debounce(() => {
        // 可以在这里添加响应窗口大小变化的逻辑
    }, 200));
    
    // 定期更新一言
    setInterval(getHitokoto, 60000); // 每分钟更新一次
    
    // 等待字体和背景图片都加载好后再移除 loading
    setTimeout(() => {
        document.getElementById('global-loading').classList.add('hide');
        setTimeout(() => {
            document.getElementById('global-loading').style.display = 'none';
        }, 500);
    }, 300); // 可根据实际情况调整延迟

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

// 仅当访问留言板时才加载评论系统
if(window.location.hash === '#guestbook') {
    loadWaline();
}

window.addEventListener('hashchange', function() {
    if(window.location.hash === '#guestbook') {
        loadWaline();
    }
});

function loadWaline() {
    // 先加载CSS确保样式正常
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/@waline/client@v3/dist/waline.css';
    document.head.appendChild(cssLink);

    import('https://unpkg.com/@waline/client@v3/dist/waline.js')
        .then(module => {
            const { init } = module;
            if (!window.walineInstance) {
                window.walineInstance = init({
                    el: '#waline',
                    serverURL: CONFIG.WALINE_SERVER_URL,
                    dark: true,
                    lang: 'zh-CN', // 明确指定中文
                    emoji: [
                        '//unpkg.com/@waline/emojis@1.1.0/weibo',
                        '//unpkg.com/@waline/emojis@1.1.0/bilibili'
                    ],
                    meta: ['nick', 'mail'],
                    requiredMeta: ['nick', 'mail'],
                    pageSize: 10,
                    login: 'enable',
                    quickComment: true,
                    search: false,
                    copyright: false,
                    locale: { // 自定义语言
                        placeholder: '欢迎留言讨论...',
                        sofa: '来做第一个留言的人吧~',
                        submit: '提交',
                        reply: '回复',
                        cancelReply: '取消回复',
                        admin: '管理员',
                        level0: '潜水',
                        level1: '冒泡',
                        level2: '活跃',
                        level3: '热心'
                    }
                });
            }
        })
        .catch(error => console.error('Waline 加载失败:', error));
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