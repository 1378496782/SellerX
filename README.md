# SellerX

SellerX 是一个 Chrome Extension，用于批量查询、管理和删除 TikTok Shop Seller Center 店铺中的促销活动。

当前版本：`v1.1.1`

## 主要功能

- 自动识别当前 Seller Center 页面中的店铺信息，包括 `Seller ID`、`Shop Name`、`Shop Code` 和 `Region`。
- 支持 TikTok 与 Tokopedia Seller Center 域名，覆盖 US、MX、ID 等多地区场景。
- 支持多种促销活动类型筛选，例如 Product Discount、Flash Sale、Regular coupon、Promo Code 等。
- 支持按状态查询活动：`All`、`Ongoing`、`Upcoming`、`Deactivated`、`Ended`。
- 支持批量删除 `Ongoing` 和 `Upcoming` 活动，并对不可删除状态进行保护。
- 提供执行日志、删除结果汇总、成功/失败明细和一键复制结果。
- 支持 GitHub Releases 自动发布，并可自动生成 `.zip`、`.crx` 和 `update.xml`。

## v1.1.1 更新重点

- 重构 `popup.js`，拆分为配置、状态、API、Seller 信息、Promotion 服务、DOM 渲染和日志模块。
- 将查询状态改为 5 个单选 tabs，降低误操作风险。
- 增强活动列表展示，新增状态标签、活动 ID、类型、开始时间和结束时间。
- 优化删除结果面板，支持成功/失败分组、失败原因展示、结果复制和滚动限制。
- 增强后台请求错误处理，区分网络错误、HTTP 错误和 JSON 解析错误。
- 修复 GitHub Actions 中 CRX 自动打包流程，已验证 `CHROME_EXTENSION_PRIVATE_KEY` Secret 生效。

## 界面预览

### 主界面

![SellerX 主界面](docs/screenshots/sellerx-main.svg)

### 活动列表

![SellerX 活动列表](docs/screenshots/sellerx-activity-list.svg)

### 删除结果与执行日志

![SellerX 删除结果与执行日志](docs/screenshots/sellerx-delete-result.svg)

## 安装方式

### 方法 1：从 GitHub Releases 下载

1. 打开 [SellerX Releases](https://github.com/1378496782/SellerX/releases)。
2. 下载最新版本中的 `sellerx-extension.zip` 或 `sellerx-extension.crx`。
3. 如果使用 `.zip`，先解压到本地文件夹。
4. 打开 Chrome，进入 `chrome://extensions/`。
5. 开启右上角「开发者模式」。
6. 点击「加载已解压的扩展程序」，选择解压后的 `chrome-extension` 文件夹。

说明：Chrome 对直接拖拽安装 `.crx` 有安全限制。如果 `.crx` 无法直接安装，推荐使用 `.zip` 解压后以开发者模式加载。

### 方法 2：从源码安装

适合需要查看或修改代码的场景：

```bash
git clone https://github.com/1378496782/SellerX.git
cd SellerX
```

然后在 Chrome 的 `chrome://extensions/` 中选择项目下的 `chrome-extension` 文件夹。

### 方法 3：使用作者提供的文件夹

如果你已经从作者处收到完整扩展文件夹：

1. 打开 `chrome://extensions/`。
2. 开启「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择作者提供的 `chrome-extension` 文件夹。

## 使用方法

1. 登录 TikTok Shop Seller Center 或 Tokopedia Seller Center。
2. 进入店铺后台页面，确保当前页面能正常访问促销活动相关接口。
3. 点击浏览器工具栏中的 SellerX 图标。
4. 确认顶部 Shop Info 已正确识别店铺信息。
5. 选择 Promotion Type 和查询状态。
6. 点击「查询活动」。
7. 确认活动列表后，在 `Ongoing` 或 `Upcoming` 状态下点击「删除活动」。
8. 在删除结果区域查看成功/失败明细，必要时点击「复制结果」进行问题反馈。

## 删除保护规则

- `All`：可查询多个状态，但不会启用删除按钮。
- `Ongoing`：查询到活动后允许删除。
- `Upcoming`：查询到活动后允许删除。
- `Deactivated`：仅查询，不允许删除。
- `Ended`：仅查询，不允许删除。
- 切换活动类型或状态后，删除按钮会自动禁用，需要重新查询后才能继续操作。

## 自动更新说明

SellerX 使用 `chrome-extension/update.xml` 配合 GitHub Releases 提供外部更新地址。

- 通过签名 `.crx` 成功安装的扩展，可使用 `update_url` 检查更新。
- 通过「加载已解压的扩展程序」安装的开发模式版本，通常需要手动替换文件夹或重新加载新版本。
- Chrome 自动更新不是实时触发，可能存在数小时延迟。

当前 `update.xml` 指向：

```text
https://github.com/1378496782/SellerX/releases/download/v1.1.1/sellerx-extension.crx
```

## 项目结构

```text
smartQ/
├── .github/workflows/
│   └── release.yml              # GitHub Actions 自动发布流程
├── chrome-extension/
│   ├── icons/                   # 扩展图标
│   ├── src/
│   │   ├── api-client.js        # Chrome API 和 runtime message 封装
│   │   ├── config.js            # 活动类型、状态、域名等配置
│   │   ├── dom.js               # DOM 渲染和 UI 状态管理
│   │   ├── logger.js            # 日志输出与 HTML 转义
│   │   ├── promotion-service.js # 活动查询和删除逻辑
│   │   ├── seller-service.js    # Seller 信息识别与 Cookie fallback
│   │   └── state.js             # 应用状态管理
│   ├── background.js            # 后台请求代理和错误处理
│   ├── manifest.json            # Chrome Extension 配置
│   ├── popup.html               # 插件主界面
│   ├── popup.js                 # 页面入口和流程编排
│   ├── styles.css               # 样式文件
│   └── update.xml               # Chrome 外部更新配置
├── utils/                       # 发布和图标处理辅助脚本
└── README.md
```

## 发布流程

当前发布通过 GitHub Actions 自动完成：

1. 更新 `chrome-extension/manifest.json` 中的版本号。
2. 更新 `popup.html` 中的版本展示。
3. 更新 `chrome-extension/update.xml` 中的版本和 CRX 下载地址。
4. 提交代码并推送到 `main`。
5. 创建并推送版本 tag，例如 `v1.1.1`。
6. GitHub Actions 自动构建并上传以下资产：
   - `sellerx-extension.zip`
   - `sellerx-extension.crx`
   - `update.xml`

CRX 自动构建依赖 GitHub Secret：

```text
CHROME_EXTENSION_PRIVATE_KEY
```

## 注意事项

- 本工具会直接删除促销活动，请在操作前确认当前店铺、活动类型和查询状态。
- 建议先使用 `All` 或具体状态查询并核对列表，再切换到可删除状态执行删除。
- 如果删除失败，请复制删除结果并提供给作者排查。
- 本项目主要用于内部效率工具场景，开发时间有限，可能仍存在边界问题。

## 联系作者

如遇到问题或发现 bug，欢迎联系：

- 邮箱：<zhangfuwei.666@bytedance.com>
- 微信：`xjtu915`

## 许可证

MIT License
