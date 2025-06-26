# Deer 个人主页

这是一个简洁美观的多功能个人主页项目，适合开发者、极客、博主展示自我、作品、友链、导航等内容。

## 主要功能

- **关于我**：展示个人简介、技能、兴趣等信息
- **博客/导航/留言/友链**：单页多区块，内容丰富
- **自定义导航**：常用网站、工具、学习资源、娱乐等分门别类
- **友链申请**：支持表单提交，推送到 Telegram/飞书
- **留言板**：基于GitHub Discussions/Issues的评论系统，无需额外服务器
- **音乐播放器**：集成网易云歌单，自动播放
- **响应式设计**：适配 PC 和移动端
- **SEO 优化**：完善的 meta 标签和社交媒体预览
- **丰富图标**：FontAwesome、RemixIcon
- **极简加载动画**：提升用户体验

## 目录结构

```
homepage_demo_one/
├── assets/
│   ├── css/
│   │   └── style.css         # 主要样式文件
│   ├── fonts/                # 字体文件
│   ├── img/                  # 图片资源（logo、favicon等）
│   ├── js/
│   │   └── main.js           # 主交互脚本
│   └── sounds/               # 按钮音效
├── index.html                # 主页入口
├── manifest.json             # PWA 配置
├── push_friend_link.js       # 友链推送脚本
├── web.config                # 部署配置（如 IIS）
├── CNAME                     # 自定义域名（如 GitHub Pages）
├── LICENSE                   # 许可证
└── README.md                 # 项目说明
```



## 部署流程

### 1. 一键 Fork 部署（推荐新手）

1. 打开本项目的 GitHub 仓库页面。
2. 点击右上角的"Fork"按钮，将仓库 Fork 到你自己的账号下。
3. 进入你 Fork 后的仓库页面，点击"Settings" > "Pages"。
4. 在"Source"处选择 `main` 分支，目录选择 `/（root）`，点击"Save"。
5. 稍等片刻，页面会显示你的 GitHub Pages 访问地址（如 `https://你的用户名.github.io/仓库名/`）。
6. 如需绑定自定义域名，添加或修改 `CNAME` 文件，并在 Pages 设置中填写你的域名。
7. 你可以直接在 GitHub 网页端在线编辑 `index.html` 等文件，内容修改后自动部署，无需本地操作。

### 2. Cloudflare Pages 部署

1. 注册并登录 [Cloudflare](https://dash.cloudflare.com/) 账号。
2. 进入 Cloudflare Pages 控制台，点击"Create a project"。
3. 选择"Connect to Git"，授权并选择你 Fork 或上传的 GitHub 仓库。
4. 项目名称可自定义，构建设置如下：
   - 构建命令（Build command）：留空
   - 构建输出目录（Build output directory）：`./`（根目录）
5. 点击"Save and Deploy"开始部署。
6. 部署完成后会生成 `*.pages.dev` 的访问地址，也可在设置中绑定自定义域名。


> 以上平台均支持自动化部署，后续只需推送或在线编辑代码即可自动更新。

## 友链推送脚本（Cloudflare Worker）

本项目支持通过 Cloudflare Worker 实现友链申请自动推送到 Telegram 或飞书机器人。

### 1. 脚本位置
- `push_friend_link.js`：主目录下，Cloudflare Worker 脚本。

### 2. 支持的推送方式
- Telegram 机器人
- 飞书群机器人
- 用户可通过 `pushType` 字段选择推送方式（`telegram` 或 `feishu`）

### 3. Cloudflare Worker 部署与环境变量配置
1. 登录 Cloudflare Dashboard，创建 Worker 服务。
2. 上传 `push_friend_link.js` 代码。
3. 在 Worker 的"设置"->"变量"中添加如下环境变量：
   - `TG_BOT_TOKEN`：你的 Telegram Bot Token
   - `TG_CHAT_ID`：你的 Telegram Chat ID
   - `FEISHU_WEBHOOK`：你的飞书群自定义机器人 Webhook 地址
   > 可只配置你需要的推送方式，未用到的可留空

### 配置信息，统一管理所有API和服务端地址

打开main.js填入链接
```
BING_WALLPAPER_URL: 'https://bing.img.run/rand.php', // 必应壁纸API
BING_FALLBACK_URL: 'https://api.dujin.org/bing/1920.php', // 备用壁纸API
HITOKOTO_API: 'https://v.api.aa1.cn/api/yiyan/index.php', // 一言API
FRIEND_LINK_API: 'https://home-push-friend-link.952780.xyz/' // 友链推送API地址
```

### Giscus留言板配置

本项目使用Giscus作为留言系统，需要进行以下配置：

1. 在你的GitHub仓库中启用Discussions功能（在仓库设置中）
2. 安装 [Giscus App](https://github.com/apps/giscus) 到你的仓库
3. 访问 https://giscus.app/zh-CN 生成配置代码
4. 用生成的配置替换index.html中的Giscus脚本部分
5. 可在Giscus脚本中配置颜色主题、语言等参数

例如：

```html
<script src="https://giscus.app/client.js"
        data-repo="你的用户名/你的仓库"
        data-repo-id="仓库ID"
        data-category="Announcements"
        data-category-id="分类ID"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="dark_dimmed"
        data-lang="zh-CN"
        data-loading="lazy"
        crossorigin="anonymous"
        async>
</script>
```


## 许可证

本项目采用 MIT License，详见 LICENSE 文件。



## 贡献与维护

- 关键 JS/CSS 逻辑均有注释，便于二次开发和团队协作。
- 如需批量管理友链等，建议用 JS 维护数据源并动态渲染。
- 欢迎 issue 或 PR 反馈和贡献！