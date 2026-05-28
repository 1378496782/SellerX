# 部署和自动更新指南

## 1. GitHub 仓库设置

### 1.1 创建 GitHub 仓库

1. 在 GitHub 上创建一个新的仓库
2. 将项目代码推送到仓库

### 1.2 配置文件中的占位符

在以下文件中替换占位符：

#### manifest.json:
```json
"update_url": "https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/chrome-extension/update.xml"
```

#### update.xml:
```xml
<app appid='YOUR_EXTENSION_ID'>
  <updatecheck codebase='https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/releases/download/v1.0.0/tiktok-seller-extension.crx' version='1.0.0'/>
</app>
```

## 2. 获取扩展 ID

1. 在 Chrome 中加载扩展（开发模式）
2. 访问 `chrome://extensions/`
3. 找到你的扩展，复制显示的 ID

## 3. 打包扩展

### 3.1 首次打包

1. 访问 `chrome://extensions/`
2. 点击「打包扩展程序」
3. 选择 `chrome-extension` 文件夹
4. 保存生成的 `.pem` 密钥文件（**重要：妥善保管，丢失后无法更新！）

### 3.2 更新时打包

使用相同的 `.pem` 文件重新打包扩展

## 4. 发布版本

### 4.1 手动发布

1. 更新 manifest.json 中的版本号
2. 打包扩展生成 `.crx` 文件
3. 更新 update.xml 中的版本号和下载链接
4. 在 GitHub 创建新的 Release
5. 上传 `.crx` 文件和更新后的 `update.xml`

### 4.2 使用 GitHub Actions（推荐）

1. 推送 `v*` 标签会触发自动构建和发布

## 5. 用户更新流程

```bash
# 1. 修改代码
git add .
git commit -m "更新说明"

# 2. 增加版本号（修改 manifest.json）

# 3. 创建标签
git tag -a v1.0.1 -m "版本 1.0.1"

# 4. 推送代码和标签
git push origin main
git push origin v1.0.1
```

## 6. Chrome 自动更新机制

- Chrome 会定期检查 update_url
- 发现新版本时自动下载更新
- 用户下次启动浏览器时会应用更新
