# 📱 EnglishVibe PWA 安装指南

## 什么是 PWA？

PWA（Progressive Web App）是一种可以像原生 APP 一样安装到手机的网页应用。它具有以下优点：

- ✅ 无需应用商店，直接安装
- ✅ 全屏运行，像原生APP一样
- ✅ 支持离线使用
- ✅ 体积小，不占空间
- ✅ 随时更新，无需重新安装

---

## 🚀 方式一：在线部署（推荐）

### 步骤 1：部署到 Vercel（免费）

1. 注册 [Vercel](https://vercel.com) 账号
2. 将项目文件夹上传到 [GitHub](https://github.com)
3. 在 Vercel 中点击 "New Project" → 导入 GitHub 仓库
4. 等待自动部署完成，获得一个 HTTPS 链接（如 `https://englishvibe.vercel.app`）

### 步骤 2：在安卓手机安装

1. 打开 **Chrome 浏览器**
2. 访问你的 Vercel 链接
3. 点击右上角菜单（三个点）
4. 选择 **"添加到主屏幕"** 或 **"安装应用"**
5. 确认安装
6. 完成！在桌面找到 EnglishVibe 图标即可使用

---

## 🖥️ 方式二：本地运行

### 前提条件

- 电脑和手机在同一 WiFi 网络下
- 电脑安装了 Node.js 或 Python

### 步骤 1：生成图标（首次需要）

```bash
# 方法 A：使用浏览器（推荐）
# 在浏览器中打开 generate-icons.html，点击"下载全部图标"

# 方法 B：使用 Node.js
npm install canvas
node scripts/generate-icons.js
```

### 步骤 2：启动本地服务器

```bash
# 方法 A：使用 npx（需要 Node.js）
npx serve .

# 方法 B：使用 Python
python -m http.server 8080

# 方法 C：使用 VS Code Live Server 插件
# 右键点击 index.html → Open with Live Server
```

### 步骤 3：获取电脑 IP 地址

```bash
# Windows
ipconfig

# Mac / Linux
ifconfig | grep inet
```

找到类似 `192.168.x.x` 的 IP 地址。

### 步骤 4：在手机访问

1. 打开安卓手机的 **Chrome 浏览器**
2. 输入地址：`http://你的电脑IP:端口号`
   - 例如：`http://192.168.1.100:8080`
3. 点击菜单 → **"添加到主屏幕"**

> ⚠️ 注意：本地运行时部分 PWA 功能可能受限（需要 HTTPS）

---

## 📱 iOS 设备安装

iPhone/iPad 使用 Safari 浏览器：

1. 用 **Safari** 打开网址
2. 点击底部的 **分享按钮** (⬆️)
3. 向下滚动找到 **"添加到主屏幕"**
4. 点击 **"添加"**

---

## ❓ 常见问题

### Q: 没有看到"安装应用"选项？

A: 确保满足以下条件：
- 使用 Chrome 浏览器（版本 72+）
- 网站通过 HTTPS 访问
- manifest.json 配置正确
- 有有效的 Service Worker

### Q: 安装后打开是空白页？

A: 清除浏览器缓存后重试：
1. 打开 Chrome 设置
2. 隐私设置 → 清除浏览数据
3. 重新访问并安装

### Q: 离线时无法使用？

A: 首次访问时需要联网加载词库。加载完成后支持离线使用基本功能。

---

## 🎉 安装成功！

现在你可以像使用普通 APP 一样使用 EnglishVibe 了：

- 📚 每天学习 20 个新单词
- 🔄 按艾宾浩斯曲线复习
- 📊 查看学习进度和统计
- 🏆 挑战连续学习天数

**开始你的英语学习之旅吧！** 💪

