# Deer个人主页

一个现代化、响应式的个人主页模板，基于纯HTML/CSS/JavaScript构建。支持多功能模块，包括个人简介、博客导航、留言板、友链管理等，用于展示个人信息和作品。

---

## ✨ 核心特性

- 📱 **响应式设计** - 完美适配桌面端、平板和移动设备
- 🎨 **动态背景** - 必应每日壁纸 + 渐变备用背景
- 💬 **互动留言** - 基于GitHub Discussions的评论系统
- 🔗 **友链管理** - 支持在线申请，自动推送至Telegram/飞书
- 🎵 **音乐播放** - 集成网易云音乐播放器
- 📊 **导航管理** - 多分类个人常用网站导航
- 🚀 **性能优化** - PWA支持、Service Worker、懒加载
- 🔊 **音效系统** - 交互音效反馈
- 📈 **SEO优化** - 结构化数据、Open Graph标签
- 🌙 **暗色主题** - 现代化深色设计风格

---

## 🚀 快速部署

### GitHub Pages 部署
1. **Fork 本仓库** 到你的 GitHub 账号
2. 进入仓库 `Settings` → `Pages`，选择 `main` 分支
3. 等待构建完成，访问生成的网址

### Cloudflare Pages 部署
1. 登录 Cloudflare Pages
2. 连接 GitHub 仓库
3. 使用默认构建设置一键部署

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/deerwan/homepage.git
cd homepage

# 启动本地服务器
python -m http.server 8000
# 或使用 Node.js
npx serve .

# 访问 http://localhost:8000
```

---

## 📁 项目结构

```
homepage/
├── assets/                 # 静态资源目录
│   ├── css/
│   │   └── style.css      # 主样式文件
│   ├── fonts/             # 自定义字体文件
│   │   ├── AlimamaDaoLiTi-Regular.woff2
│   │   └── ...
│   ├── img/               # 图片资源
│   │   ├── logo.png       # 网站Logo
│   │   ├── favicon.ico    # 网站图标
│   │   └── ...
│   ├── js/                # JavaScript脚本
│   │   ├── app.js         # 现代版主应用（ES6模块）
│   │   ├── main.js        # 兼容版主脚本
│   │   └── modules/       # 模块化组件
│   │       ├── config.js  # 配置管理
│   │       ├── api.js     # API接口
│   │       ├── background.js # 背景管理
│   │       ├── ui.js      # 用户界面
│   │       └── ...
│   └── sounds/            # 音效文件
│       ├── click-btn.wav  # 按钮点击音效
│       └── ...
├── docs/                  # 文档目录
├── index.html             # 主页面入口
├── manifest.json          # PWA应用清单
├── push_friend_link.js    # Cloudflare Worker友链推送脚本
├── web.config             # IIS部署配置
├── sw.js                  # Service Worker
├── sitemap.xml            # 网站地图
├── robots.txt             # 搜索引擎配置
└── CNAME                  # 自定义域名配置
```

---

## ⚙️ 详细配置说明

### 1. 基础信息配置

编辑 `index.html` 文件中的个人信息：

```html
<!-- 网站标题和描述 -->
<title>Deer - homepage</title>
<meta name="description" content="Deer个人主页，展示个人作品、博客、生活动态和联系方式">

<!-- 个人信息 -->
<p class="subtitle">hi 👋,I'm Deer</p>

<!-- 社交链接 -->
<a href="https://github.com/deerwan" target="_blank">GitHub</a>
<a href="mailto:mrdeer7@qq.com">邮箱</a>
```

### 2. API服务配置

在 `assets/js/modules/config.js` 中配置各种API服务：

```javascript
export const CONFIG = {
    // 背景图片API
    BING_WALLPAPER_URL: 'https://bing.img.run/rand.php',
    BING_FALLBACK_URL: 'https://api.dujin.org/bing/1920.php',
    
    // 一言API
    HITOKOTO_API: 'https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=h&c=i&c=k',
    HITOKOTO_BACKUP_API: 'https://api.uomg.com/api/rand.qinghua?format=json',
    
    // 友链推送API
    FRIEND_LINK_API: 'https://home-push-friend-link.952780.xyz/',
    
    // 性能配置
    API_TIMEOUT: 3000,
    WALLPAPER_TIMEOUT: 5000
};
```

### 3. 留言板配置（Giscus）

1. 访问 [Giscus官网](https://giscus.app/zh-CN)
2. 根据向导配置你的GitHub仓库
3. 在 `index.html` 中更新Giscus配置：

```html
<script src="https://giscus.app/client.js"
    data-repo="你的用户名/仓库名"
    data-repo-id="仓库ID"
    data-category="Announcements"
    data-category-id="分类ID"
    data-mapping="pathname"
    data-theme="dark_dimmed"
    data-lang="zh-CN"
    crossorigin="anonymous"
    async>
</script>
```

### 4. 音乐播放器配置

在 `index.html` 底部配置网易云音乐播放器：

```html
<meting-js
    server="netease"          <!-- 音乐平台：netease/qq/xiami/kugou -->
    type="playlist"           <!-- 类型：song/playlist/album/artist -->
    id="你的歌单ID"            <!-- 对应的ID -->
    fixed="true"              <!-- 固定模式 -->
    autoplay="true"           <!-- 自动播放 -->
    order="random"            <!-- 播放顺序：list/random -->
    theme="#4a89dc"           <!-- 主题色 -->
    loop="all"                <!-- 循环模式：all/one/none -->
    volume="0.7">             <!-- 默认音量 -->
</meting-js>
```

### 5. 友链推送配置（Cloudflare Worker）

1. **创建Cloudflare Worker**：
   - 登录Cloudflare仪表盘
   - 创建新的Worker
   - 复制 `push_friend_link.js` 内容到Worker

2. **设置环境变量**：
   ```
   TG_BOT_TOKEN=你的Telegram机器人Token
   TG_CHAT_ID=你的Telegram聊天ID
   FEISHU_WEBHOOK=你的飞书Webhook地址
   ```

3. **获取Telegram机器人**：
   - 与 @BotFather 对话创建机器人
   - 获取Bot Token
   - 获取Chat ID（可通过 @userinfobot）

4. **配置飞书机器人**：
   - 在飞书群中添加自定义机器人
   - 复制Webhook地址

### 6. PWA配置

编辑 `manifest.json` 配置PWA应用信息：

```json
{
  "name": "你的网站名称",
  "short_name": "简称",
  "description": "网站描述",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#121212",
  "theme_color": "#121212",
  "icons": [
    {
      "src": "assets/img/logo.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### 7. 导航链接管理

在 `index.html` 的导航区域添加或修改链接：

```html
<div class="nav-category">
    <h3><i class="fas fa-code"></i> 开发工具</h3>
    <div class="nav-links">
        <a class="nav-link-item" href="链接地址" target="_blank">
            <img src="图标地址" alt="名称" width="32" height="32" class="nav-icon">
            <div>
                <div class="nav-name">网站名称</div>
                <div class="nav-desc">网站描述</div>
            </div>
        </a>
    </div>
</div>
```

### 8. 部署配置

**web.config（IIS部署）**：
- 已配置HTTPS重定向、缓存策略、安全头
- 支持WebP图片、字体文件等MIME类型

**CNAME（自定义域名）**：
```
你的域名.com
```

**sitemap.xml（SEO优化）**：
更新网站地图中的URL和更新频率

---

## 🎨 自定义样式

### 主题色彩
在 `assets/css/style.css` 中修改CSS变量：

```css
:root {
    --primary-color: #4a89dc;
    --background-color: #121212;
    --text-color: #ffffff;
    --card-background: rgba(255, 255, 255, 0.1);
}
```

### 字体配置
项目使用阿里妈妈刀隶体，可在CSS中替换：

```css
@font-face {
    font-family: 'CustomFont';
    src: url('../fonts/YourFont.woff2') format('woff2');
}
```

---

## 🔧 开发说明

### 技术栈
- **前端**：HTML5 + CSS3 + ES6+ JavaScript
- **架构**：模块化设计，支持ES6 Modules
- **兼容性**：现代浏览器 + IE11降级支持
- **工具**：PWA、Service Worker、Web Components

### 模块说明
- `app.js`：现代版主应用，使用ES6模块
- `main.js`：兼容版本，支持旧浏览器
- `modules/`：功能模块化组件
  - `config.js`：配置管理
  - `api.js`：API接口处理
  - `background.js`：背景图片管理
  - `ui.js`：用户界面交互
  - `analytics.js`：数据分析
  - `error-handler.js`：错误处理

### 性能优化
- 图片懒加载和预加载
- CSS/JS异步加载
- 资源缓存策略
- 防抖函数优化
- Service Worker缓存

---

## 🐛 常见问题

### Q: 一言API无法加载？
A: 检查网络连接，或在config.js中更换备用API

### Q: 音乐播放器不工作？
A: 确保网易云歌单是公开的，检查歌单ID是否正确

### Q: 友链推送失败？
A: 检查Cloudflare Worker环境变量配置，确认API地址正确

### Q: 图片无法显示？
A: 检查图片路径，确保图片文件存在且可访问

### Q: 移动端显示异常？
A: 清除浏览器缓存，检查CSS媒体查询配置

---

## 📈 版本历史

- **v2.0.0**：模块化重构，添加ES6支持
- **v1.5.0**：添加音效系统和性能监控
- **v1.0.0**：初始版本发布

---

## 📄 开源协议

本项目基于 [Apache-2.0](LICENSE) 协议开源

---

## 🤝 贡献指南

欢迎提交 Pull Request 和 Issue！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -am '添加新功能'`
4. 推送分支：`git push origin feature/新功能`
5. 提交 Pull Request

---

## 💬 联系方式

- **作者**：Deer
- **邮箱**：mrdeer7@qq.com
- **GitHub**：[@deerwan](https://github.com/deerwan)
- **博客**：[deerwan.github.io](https://deerwan.github.io)