# SellerX

Chrome 扩展，用于批量管理和删除 TikTok Seller 店铺的促销活动。

## 功能特性

- 自动提取卖家 ID 和国家代码
- 支持多种促销活动类型筛选
- 批量删除促销活动
- 支持多区域（US、MX 等）
- 自动更新功能

## 安装

### 开发模式安装

1. 下载或克隆此仓库
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `chrome-extension` 文件夹

### 使用方法

1. 登录 TikTok Seller 后台并进入促销活动页面
2. 点击浏览器工具栏中的扩展图标
3. 选择活动类型和状态
4. 点击「查询活动」
5. 确认后点击「删除活动」

## 项目结构

```
chrome-extension/
├── icons/              # 图标文件
├── manifest.json       # 扩展配置
├── background.js       # 后台脚本
├── popup.html          # 弹窗页面
├── popup.js            # 弹窗脚本
├── styles.css          # 样式文件
├── update.xml          # 自动更新配置
└── README.md
```

## 自动更新

扩展通过 GitHub Releases 实现自动更新。当有新版本发布时，Chrome 会自动检测并提示更新。

## 许可证

MIT License
