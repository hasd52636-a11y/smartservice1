# 🔧 Vercel环境变量配置步骤

## ⚠️ 重要说明
环境变量**不会**自动从代码文件嵌入到部署中！必须在Vercel平台手动配置。

## 📋 配置步骤

### 步骤1：访问Vercel项目设置
1. 打开 https://vercel.com/dashboard
2. 找到并点击项目 `smartservice1`
3. 点击顶部的 "Settings" 标签

### 步骤2：进入环境变量设置
1. 在左侧菜单中点击 "Environment Variables"
2. 你会看到当前已配置的环境变量列表

### 步骤3：添加/更新环境变量
点击 "Add New" 按钮，逐个添加以下变量：

#### 必需变量：
| Name | Value | Environment |
|------|-------|-------------|
| `ZHIPU_API_KEY` | `95e635b202714947a903104808ab6643.DmxvLwF1hQXYHYdi` | Production, Preview, Development |
| `API_KEY` | `95e635b202714947a903104808ab6643.DmxvLwF1hQXYHYdi` | Production, Preview, Development |

#### 可选变量：
| Name | Value | Environment |
|------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `VITE_APP_TITLE` | `SmartGuide AI` | Production, Preview, Development |
| `VITE_APP_VERSION` | `1.0.0` | Production, Preview, Development |

### 步骤4：保存并重新部署
1. 点击 "Save" 保存每个环境变量
2. 返回项目主页
3. 点击 "Deployments" 标签
4. 点击最新部署右侧的 "..." 菜单
5. 选择 "Redeploy"

### 步骤5：验证配置
部署完成后，访问以下URL验证：
```
https://your-domain.vercel.app/api/test-env
```

应该返回：
```json
{
  "hasZhipuApiKey": true,
  "zhipuKeyLength": 49,
  "zhipuKeyPrefix": "95e635b2...",
  "nodeEnv": "production"
}
```

## 🔍 常见问题

### Q: 为什么不能直接从代码文件读取？
A: 出于安全考虑，API密钥不能写在代码中推送到GitHub。

### Q: 每次部署都要重新设置吗？
A: 不需要！环境变量设置一次后，所有后续部署都会自动使用。

### Q: 如何批量导入环境变量？
A: 可以使用Vercel CLI：
```bash
vercel env pull .env.local
# 编辑 .env.local 文件
vercel env push .env.local
```

## ✅ 配置完成标志
- ✅ API测试返回正确的密钥信息
- ✅ 用户对话页面不再出现401错误
- ✅ AI功能正常工作（对话、语音、图片生成）

---

**记住**：环境变量是在Vercel平台配置的，不是在代码中！