# 📱 EnglishVibe PWA 安装指南

## 什么是 PWA？

PWA（Progressive Web App）是一种可以像原生 APP 一样安装到手机的网页应用。它具有以下优点：

- ✅ 无需应用商店，直接安装
- ✅ 全屏运行，像原生APP一样
- ✅ 支持离线使用
- ✅ 体积小，不占空间
- ✅ 随时更新，无需重新安装

---

## 🌐 在线访问地址

| 平台 | 地址 | 特点 |
|------|------|------|
| **Cloudflare Pages** | https://englishvibe.shentuyangguang1985.workers.dev | 🇨🇳 **国内访问推荐** |
| **Vercel** | https://english-vibe.vercel.app | 备用地址 |

> 💡 **强烈推荐使用 Cloudflare Pages 地址**，国内访问更快更稳定！

---

## 🚀 方式一：Cloudflare Pages 部署（推荐）

### 为什么选择 Cloudflare Pages？

- ✅ 国内访问速度快（比 Vercel 稳定）
- ✅ 自动部署（git push 即部署）
- ✅ 免费额度大（500次构建/月，无限流量）
- ✅ 支持自定义域名
- ✅ 全球 CDN 加速

### 部署步骤

1. 注册 [Cloudflare](https://dash.cloudflare.com) 账号
2. 进入 **Workers & Pages** → **Create**
3. 选择 **Pages** → **Connect to Git**
4. 选择你的 GitHub 仓库
5. 构建设置：
   - **Framework preset**: `None`
   - **Build command**: 留空
   - **Build output directory**: `/`
6. 点击 **Deploy**

> ⚠️ 如果构建失败，确保项目根目录有 `wrangler.jsonc` 文件

### wrangler.jsonc 配置

```json
{
  "name": "englishvibe",
  "compatibility_date": "2025-01-01",
  "assets": {
    "directory": "./"
  }
}
```

---

## 🔷 方式二：Vercel 部署

### 部署步骤

1. 注册 [Vercel](https://vercel.com) 账号
2. 点击 **New Project** → 导入 GitHub 仓库
3. 保持默认设置，点击 **Deploy**
4. 部署完成后获得 `xxx.vercel.app` 地址

> ⚠️ Vercel 服务器在国外，国内访问可能较慢或不稳定

---

## 📱 手机安装教程

### Android 手机（Chrome 浏览器）

1. 打开 **Chrome 浏览器**
2. 访问在线地址：`https://englishvibe.shentuyangguang1985.workers.dev`
3. 首页底部有 **"📲 安装到桌面"** 按钮，点击它
4. 如果弹出安装提示，点击 **"安装"**
5. 如果没有弹出提示，点击右上角菜单 **⋮** → **"添加到主屏幕"**
6. 桌面出现 EnglishVibe 图标 ✅

### Android 手机（其他浏览器）

如果使用其他浏览器（如 Edge、Firefox、小米浏览器等），步骤类似：
- 找到浏览器菜单
- 选择 "添加到主屏幕" 或 "添加到桌面" 相关选项

### iPhone / iPad（Safari 浏览器）

> ⚠️ **iOS 必须使用 Safari 浏览器！** 其他浏览器不支持 PWA 安装

1. 打开 **Safari 浏览器**
2. 访问在线地址
3. 点击底部的 **分享按钮** ⬆️ （方框+向上箭头）
4. 向下滚动找到 **"添加到主屏幕"**
5. 修改名称（可选），点击 **"添加"**
6. 主屏幕出现 EnglishVibe 图标 ✅

---

## 🖥️ 方式三：本地运行

### 前提条件

- 电脑和手机在同一 WiFi 网络下
- 电脑安装了 Node.js 或 Python

### 步骤 1：启动本地服务器

```bash
# 方法 A：使用 Python
python3 -m http.server 8080

# 方法 B：使用 npx（需要 Node.js）
npx serve . -p 8080

# 方法 C：使用 VS Code Live Server 插件
```

### 步骤 2：获取电脑 IP 地址

```bash
# Mac
ifconfig | grep "inet "

# Windows
ipconfig
```

找到类似 `192.168.x.x` 的 IP 地址。

### 步骤 3：在手机访问

1. 打开手机浏览器
2. 输入地址：`http://你的电脑IP:8080`
   - 例如：`http://192.168.1.100:8080`

> ⚠️ 本地运行（HTTP）时，PWA 安装功能受限，建议使用在线部署（HTTPS）

---

## ❓ 常见问题

### Q1: 没有看到"安装应用"选项？

**A:** 确保满足以下条件：
- ✅ 使用 Chrome 浏览器（Android）或 Safari（iOS）
- ✅ 网站通过 HTTPS 访问（不是 HTTP）
- ✅ 首页有"安装到桌面"按钮，点击后会显示安装提示或手动安装说明

### Q2: 安装后打开是空白页？

**A:** 清除浏览器缓存后重试：
1. 打开浏览器设置
2. 找到网站数据/缓存
3. 清除 englishvibe 相关数据
4. 卸载已安装的 PWA
5. 重新访问并安装

### Q3: 例句发音没有声音？

**A:** 例句发音使用讯飞 TTS API：
- 确保网络连接正常（需要联网）
- 首次使用可能需要几秒加载
- 如果持续无声，刷新页面重试
- 检查手机是否静音

### Q4: 手机端打不开/一直加载？

**A:** 可能的解决方案：
1. 切换到 **Cloudflare Pages 地址**（国内更稳定）
2. 清除浏览器缓存
3. 尝试使用无痕模式打开
4. 检查网络连接
5. 换一个浏览器尝试

### Q5: 离线时无法使用？

**A:** 首次访问时需要联网加载词库。加载完成后：
- ✅ 基本学习功能支持离线
- ❌ 发音功能需要网络

### Q6: 更新后还是旧版本？

**A:** 
1. 完全关闭浏览器（不只是关闭标签页）
2. 重新打开浏览器访问
3. 或者进入设置页面 → 清除所有数据 → 刷新页面

---

## 🔧 技术细节

### PWA 配置文件

本项目包含以下 PWA 相关文件：

| 文件 | 说明 |
|------|------|
| `manifest.json` | PWA 清单，定义应用名称、图标、主题色等 |
| `sw.js` | Service Worker，实现缓存和离线功能 |
| `wrangler.jsonc` | Cloudflare Pages 配置文件 |

### Service Worker 版本

每次更新代码时，需要递增 `sw.js` 中的版本号：
```javascript
const CACHE_NAME = 'englishvibe-v49';  // 递增此版本号
```

---

## 🎉 安装成功！

现在你可以像使用普通 APP 一样使用 EnglishVibe 了：

- 📚 每天学习 20-100 个新单词
- 🔄 按艾宾浩斯曲线复习
- 📊 查看学习进度和统计
- 🏆 挑战连续学习天数
- 🔊 享受高品质真人发音

**开始你的英语学习之旅吧！** 💪

---

## 📞 需要帮助？

- 📖 查看 [问题解决指南.md](问题解决指南.md)
- 🐛 提交 [GitHub Issue](https://github.com/shentuyangguang1985-oss/EnglishVibe/issues)

---

*最后更新：2025-01-01*
