# 🚀 Vercel快速配置指南

## 📋 使用新API密钥的环境变量

你的新智谱AI API密钥：`95e635b202714947a903104808ab6643.DmxvLwF1hQXYHYdi`

## ⚡ 快速配置步骤

### 方法1：在Vercel Dashboard中手动更新

1. **访问项目设置**
   - https://vercel.com/dashboard
   - 选择项目 `smartservice1`
   - Settings → Environment Variables

2. **更新以下变量**：
   ```
   ZHIPU_API_KEY = 95e635b202714947a903104808ab6643.DmxvLwF1hQXYHYdi
   API_KEY = 95e635b202714947a903104808ab6643.DmxvLwF1hQXYHYdi
   ```

3. **保留其他变量**：
   ```
   NODE_ENV = production
   VITE_APP_TITLE = SmartGuide AI
   VITE_APP_VERSION = 1.0.0
   VITE_ZHIPU_BASE_URL = https://open.bigmodel.cn/api/paas/v4
   ```

### 方法2：使用配置文件

使用项目中的 `vercel.env` 文件，已经包含了新的API密钥。

## 🗑️ 清理不需要的变量

可以删除这些多余的变量：
- `VITE_LINK_GENERATION_METHOD`
- `VITE_LINK_HASH_ALGORITHM`
- `VITE_ERROR_RETRY_COUNT`
- `VITE_ERROR_RETRY_DELAY`
- `VITE_CORS_ENABLED`
- `VITE_SECURITY_HEADERS`

## 🔄 重新部署

配置完成后：
1. 在Vercel Dashboard中点击 "Redeploy"
2. 或者推送代码触发自动部署：
   ```bash
   git add .
   git commit -m "Update API key configuration"
   git push origin main
   ```

## ✅ 验证部署

部署完成后测试以下功能：
- ✅ AI对话功能
- ✅ 语音生成
- ✅ 图片生成
- ✅ 视频生成
- ✅ 数据分析图表

---

**新API密钥已配置完成，可以开始部署了！**