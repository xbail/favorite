# 蜗牛个人导航 - 腾讯云 EdgeOne Pages 版

> 本项目完全由 AI 生成，我对项目中的代码一无所知。您可自由修改演绎。

**蜗牛个人导航**是一个基于 **React** + **Tailwind CSS** 构建的现代化云端导航/书签管理页面，专为 **Tencent Cloud EdgeOne Pages** 设计。它利用 EdgeOne Pages Functions 和 Blob 存储（无需开通 KV 命名空间），提供了一个无需维护服务器的 Serverless 导航解决方案。

![CloudNav Screenshot](screenshots/preview.png)

## ✨ 特性

- **Serverless 架构**：完全运行在边缘节点，无需服务器。
- **Blob 数据存储**：配置、分类和链接数据均存储在 EdgeOne Blob 中，无需开通/绑定 KV 命名空间，首次访问自动创建。
- **安全管理**：
    - 后台管理通过 `PASSWORD` 环境变量保护。
    - 动态 Token 鉴权，支持自定义过期时间。
- **丰富的小组件**：
    - **实时天气**：集成和风天气 API。
    - **Mastodon 动态**：展示你的最新嘟文。
    - **AI**：集成 Gemini 等 AI 能力。
- **数据管理**：
    - 支持 Chrome/Edge 书签文件（Netscape HTML）导入/导出。
    - 支持 JSON 格式全量备份/恢复。
    - 完美的分类层级支持（递归导入导出）。
- **个性化**：
    - 支持深色/浅色模式切换。
    - 支持多种视图模式（列表/卡片）。
    - 自定义网站标题、Logo (Favicon)。

## 🚀 部署指南

本项目的部署依赖于 **腾讯云 EdgeOne Pages**。

### 前置要求

1.  腾讯云账号并开通 EdgeOne 服务（Makers / Pages）。
2.  无需开通 KV；本项目使用 EdgeOne Blob 存储，命名空间在首次访问时自动创建。

### 部署

1. 新建项目
2. 导入 Git 仓库

#### 构建设置

- 框架预设：`Vite`
- 根目录：`./`
- 输出目录：`./dist`
- 编译命令：`npm run build`
- 安装命令：`npm install`（已包含 `@edgeone/pages-blob` 依赖）

#### 环境变量

- `PASSWORD`：前端登录密码（管理员登录用）。

### 存储说明（Blob 存储）

本项目使用 EdgeOne Blob 存储（`@edgeone/pages-blob`），**无需在控制台手动开通或绑定 KV 命名空间**。首次触发 Functions 请求时，平台会自动创建名为 `cloudnav` 的 Blob 命名空间，所有配置、分类、链接与图标缓存都持久化在其中。

3. 重新部署

## ⚙️ 使用说明

1.  **首次访问**：点击页面右上角（或菜单中）的设置图标。
2.  **登录**：输入在环境变量中设置的 `PASSWORD`。
3.  **导入书签**：支持从浏览器导出的 `.html` 文件导入，系统会自动解析目录结构。
4.  **配置组件**：在设置面板中，你可以配置天气 API Key、Mastodon 实例地址等。

## 💡 灵感来源

本项目的灵感来源于以下优秀的开源项目，特此致谢：

- [sese972010/CloudNav-](https://github.com/sese972010/CloudNav-)
- [aabacada/CloudNav-abcd](https://github.com/aabacada/CloudNav-abcd)

## 📄 License

本项目采用 [GLWT License](LICENSE) 开源。
