# 🚨 安全警告：API密钥泄露

## ⚠️ 发现的问题

在检查环境变量时，我发现你的智谱AI API密钥已经暴露在配置文件中：
```
a75d46768b0f45dc90a5969077ffc8d9.dT0t2tku3hZGfYkk
```

## 🔧 已采取的修复措施

1. **删除了包含真实密钥的文件**：
   - 删除 `.env.production`
   - 清理 `.env.vercel` 中的真实密钥

2. **更新了环境变量模板**：
   - 所有配置文件现在只包含占位符
   - 添加了完整的变量列表

## 🚨 立即需要做的事情

### 1. 重新生成API密钥
- 访问 https://open.bigmodel.cn/
- 登录你的账号
- 删除当前的API密钥
- 生成新的API密钥

### 2. 更新Vercel环境变量
- 在Vercel Dashboard中更新 `ZHIPU_API_KEY`
- 使用新生成的密钥

### 3. 检查GitHub历史
- 当前密钥可能已经在Git历史中
- 考虑清理Git历史或创建新仓库

## 📋 完整的Vercel环境变量列表

基于代码分析，你需要在Vercel中配置以下环境变量：

### 必需变量
- `ZHIPU_API_KEY` - 智谱AI主密钥
- `API_KEY` - 备用密钥（通常与ZHIPU_API_KEY相同）

### 应用配置变量
- `NODE_ENV=production`
- `REACT_APP_ENV=production`
- `VITE_APP_TITLE=SmartGuide AI`
- `VITE_APP_VERSION=1.0.0`
- `VITE_ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4`

### 系统变量（Vercel自动提供）
- `VERCEL_URL` - 自动生成，无需手动设置

## 🔒 安全最佳实践

1. **永远不要**将API密钥提交到Git仓库
2. **只在**生产环境变量中配置真实密钥
3. **定期轮换**API密钥
4. **使用**环境变量而不是硬编码
5. **监控**API密钥使用情况

---

**请立即重新生成API密钥并更新Vercel配置！**