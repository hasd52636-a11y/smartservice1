# SmartGuide AI - 智能客服系统

## 🚀 项目简介

SmartGuide AI 是一个基于智谱AI的智能客服系统，为商家提供完整的AI客服解决方案。

## ✨ 核心功能

- **🤖 智能对话**: 基于智谱GLM-4模型的智能客服
- **🎨 个性化界面**: 10种预设主题模板，支持实时预览
- **📊 数据分析**: 完整的用户行为和业务数据分析
- **🎬 视频生成**: 集成智谱CogVideoX-3视频AI生成
- **🖼️ 图片生成**: 智谱GLM-Image横幅广告生成
- **💾 对话记忆**: 5轮对话上下文记忆
- **📱 响应式设计**: 完美适配移动端和桌面端

## 🛠️ 技术栈

- **前端**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS 4.0
- **AI服务**: 智谱AI (GLM-4, GLM-4V, CogVideoX-3, GLM-Image)
- **部署**: Vercel + Serverless Functions
- **图表**: Recharts
- **图标**: Lucide React

## 📦 快速开始

### 环境要求
- Node.js 24.x
- npm 或 yarn

### 本地开发
```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入智谱AI API密钥

# 启动开发服务器
npm run dev
```

### 生产部署
```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 🔐 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 智谱AI API密钥（必需）
ZHIPU_API_KEY=your_zhipu_api_key_here

# 应用配置
VITE_APP_TITLE=SmartGuide AI
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://your-domain.vercel.app
VITE_ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```

## 🚀 Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量 `ZHIPU_API_KEY`
4. 自动部署完成

详细部署指南请参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 📁 项目结构

```
smart008-main -005/
├── api/                    # Vercel Serverless Functions
│   ├── zhipu/             # 智谱AI API代理
│   └── ocr.js             # OCR功能
├── components/            # React组件
│   ├── Analytics.tsx      # 数据分析
│   ├── ProjectDetail.tsx  # 项目详情
│   ├── UICustomizer.tsx   # 界面定制
│   └── UserPreview.tsx    # 用户预览
├── services/              # 业务服务
│   ├── aiService.ts       # AI服务
│   └── analyticsApiService.ts # 分析API
├── types.ts               # TypeScript类型定义
├── vercel.json           # Vercel配置
└── package.json          # 项目配置
```

## 🎨 UI主题模板

系统内置10种精美主题：
- 现代简约 (Modern)
- 深色模式 (Dark)
- 活力橙色 (Vibrant)
- 科幻未来 (Sci-Fi)
- 水晶透明 (Crystal)
- 喜庆红色 (Festive)
- 海滨蓝色 (Ocean)
- 梵高星空 (Van Gogh)
- 梦幻紫色 (Dream)
- 二次元 (Anime)

## 📊 数据分析功能

- 用户行为分析（停留时间、对话轮数、Token消耗）
- 设备统计（终端类型、手机型号、操作系统、浏览器）
- 地理位置分布
- 交互数据（人工转接、语音通话、文件上传）
- API数据导出（支持完整业务数据访问）

## 🔧 开发说明

### 主要组件
- `App.tsx`: 主应用入口
- `ProjectDetail.tsx`: 项目管理核心组件
- `UICustomizer.tsx`: 界面定制系统
- `Analytics.tsx`: 数据分析面板
- `UserPreview.tsx`: 客服界面预览

### API服务
- `aiService.ts`: 智谱AI接口封装
- `analyticsApiService.ts`: 数据分析API

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**SmartGuide AI** - 让AI客服更智能，让商家更成功！