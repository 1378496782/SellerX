# Chrome 插件开发计划

## 项目概述

将 `demo3.js` 改造成一个 Chrome 浏览器插件，实现 TikTok Seller 促销活动批量删除功能。

## 原脚本功能分析

`demo3.js` 的核心功能：
1. 从 context 获取 cookies
2. 从页面 URL 提取国家代码（如 MX、US）
3. 从 cookies 提取 seller_id
4. 调用 TikTok API 获取促销活动列表
5. 根据活动类型调用不同的删除接口

## Chrome 插件架构

### 文件结构

```
smartQ/chrome-extension/
├── manifest.json          # 插件配置文件
├── popup.html             # 弹出窗口界面
├── popup.js               # 弹出窗口逻辑
├── background.js          # 后台脚本（处理 API 请求）
└── styles.css             # 样式文件
```

### 核心改造点

| 原功能 | Chrome 插件实现方式 |
|--------|-------------------|
| `context.cookies()` | `chrome.cookies.getAll()` |
| `page.url()` | `chrome.tabs.query()` |
| axios HTTP 请求 | `fetch()` API |
| 日志输出 | 控制台日志 + UI 显示 |

## 实现步骤

### 步骤 1: 创建 manifest.json

配置插件权限（cookies、tabs、activeTab、host_permissions）

### 步骤 2: 创建 popup.html

简单的 UI 界面：
- 显示当前店铺信息（国家、seller_id）
- 选择要删除的活动类型
- 显示查询到的活动列表
- 删除按钮和结果显示

### 步骤 3: 创建 popup.js

实现交互逻辑：
- 获取当前页面信息
- 查询促销活动
- 删除活动
- 更新 UI 显示

### 步骤 4: 创建 background.js（可选）

处理跨域请求和后台任务

### 步骤 5: 创建 styles.css

美化插件界面

## 注意事项

1. **权限声明**：需要在 manifest.json 中声明必要的权限
2. **CORS 问题**：使用 background script 处理 API 请求
3. **异步操作**：正确处理 Chrome API 的异步回调
4. **错误处理**：完善的错误捕获和提示

## 预期效果

用户在 TikTok Seller 页面点击插件图标后：
1. 插件自动获取当前店铺信息
2. 用户选择要删除的活动类型
3. 点击查询按钮显示活动列表
4. 点击删除按钮批量删除活动
5. 显示删除结果统计

---

**风险评估**：
- 中等风险：Chrome 插件的权限和 CORS 限制可能导致 API 请求失败
- 缓解方案：使用 background script 作为代理处理请求
