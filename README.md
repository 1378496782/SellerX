# SellerX

SellerX 是一个 Chrome Extension，用于批量查询、管理和删除 TikTok Shop Seller Center 店铺中的促销活动。

当前版本：`v1.1.3`

## 主要功能

- 自动识别当前 Seller Center 页面中的店铺信息，包括 `Seller ID`、`Shop Name`、`Shop Code` 和 `Region`。
- 支持 TikTok 与 Tokopedia Seller Center 域名，覆盖 US、MX、ID 等多地区场景。
- 支持多种促销活动类型筛选，例如 Product Discount、Flash Sale、Live Flash Deal、Creator LIVE deal、Regular coupon、Promo Code、Buy X Get Y、Follow Voucher 等。
- 支持按状态查询活动：`All`、`Ongoing & Upcoming`、`Ongoing`、`Upcoming`、`Deactivated`、`Ended`。
- 支持自动捕获或手动配置泳道 Header，查询和删除可复用 `x-tt-env`、`x-use-ppe`。
- 支持批量删除 `Ongoing` 和 `Upcoming` 活动，并对不可删除状态进行保护。
- 支持列表内单条删除 `Ongoing` 和 `Upcoming` 活动。
- 提供执行日志、删除结果汇总、成功/失败明细和一键复制结果。
- 支持一键打开作者飞书聊天，便于反馈问题。
- 支持 GitHub Releases 自动发布，并可自动生成 `.zip`、`.crx` 和 `update.xml`。

## v1.1.3 更新重点

- 新增 `Ongoing & Upcoming` 查询状态，并作为默认查询状态，只查询当前支持删除的 `Ongoing` 与 `Upcoming`。
- 新增泳道 Header 管理：支持自动捕获或手动保存 `x-tt-env`、`x-use-ppe`，查询、批量删除和单条删除都会复用同一组 Header。
- 优化泳道状态展示：使用 `Prod（线上）` / `PPE（自动/手动）` 标识当前请求环境，并在日志中同步输出。
- 优化主界面布局：Shop Info 与 Configuration 合并为一个配置面板，中间使用分割线；日志展开后自动切换为上下布局。
- 优化操作按钮：`查询活动` 改为更高对比度的绿色按钮，批量删除按钮文案从 `删除活动` 改为 `全部删除`。
- 优化日志面板交互：日志开关固定在左上区域，日志面板标题右侧新增 `隐藏` 按钮。
- 新增联系作者入口：顶部新增飞书聊天按钮，点击可直接打开与作者的飞书聊天窗口。
- 删除结果中的类型展示为更详细的业务类型，例如 `Flash Sale`、`Creator LIVE deal`、`Shipping Discount`、`Buy More Save More`。
- 根据后端 IDL 校准活动展示枚举：修正 `Bundle Deal`、`Promo Code`、`Early Bird`、`SNS` 等 `display_type`，并补齐更多活动类型展示名称。
- 查询日志新增原始 `promotion_type`、`display_type`、`promotion_type_detail`，方便后续继续校准特殊活动类型。

## v1.1.2 更新重点

- 修复 Creator LIVE deal 查询逻辑，使用 `promotion_type=5` 搭配 `display_type=16` 区分 Flash Sale 与 Creator LIVE deal。
- 查询结果中会根据 `display_type` 正确展示 Flash Sale / Creator LIVE deal。
- 活动列表为 `Ongoing` 和 `Upcoming` 的单个活动/券新增独立删除按钮，支持逐条删除。

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

推荐使用 `sellerx-extension.zip` 安装。

1. 打开 [SellerX Releases](https://github.com/1378496782/SellerX/releases)。
2. 下载最新版本中的 `sellerx-extension.zip`。
3. 打开 Chrome，进入 `chrome://extensions/`。
4. 将 zip 拖动到「所有扩展程序」页面。

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
7. 确认活动列表后，在 `Ongoing & Upcoming`、`Ongoing` 或 `Upcoming` 状态下点击「全部删除」，也可以点击单条活动右侧的「删除」。
8. 在删除结果区域查看成功/失败明细，必要时点击「复制结果」进行问题反馈。

## 删除保护规则

- `All`：可查询多个状态，但不会启用批量删除按钮。
- `Ongoing & Upcoming`：默认查询状态，只查询可删除的进行中和未开始活动。
- `Ongoing`：查询到活动后允许删除。
- `Upcoming`：查询到活动后允许删除。
- `Deactivated`：仅查询，不允许删除。
- `Ended`：仅查询，不允许删除。
- 切换活动类型或状态后，删除按钮会自动禁用，需要重新查询后才能继续操作。

## 自动更新说明

SellerX 使用 `chrome-extension/update.xml` 配合 GitHub Releases 提供外部更新地址。

- 手动上传 ZIP 或通过「加载已解压的扩展程序」安装时，`manifest.json` 不能包含 `update_url`。
- 通过签名 `.crx` 成功安装并需要自动更新时，可在发布用 manifest 中加入 `update_url` 检查更新。
- 通过「加载已解压的扩展程序」安装的开发模式版本，通常需要手动替换文件夹或重新加载新版本。
- Chrome 自动更新不是实时触发，可能存在数小时延迟。

当前 `update.xml` 指向：

```text
https://github.com/1378496782/SellerX/releases/download/v1.1.3/sellerx-extension.crx
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
- 建议优先使用 `Ongoing & Upcoming` 查询并核对列表，再执行删除。
- 如果当前页面处于 PPE / 泳道环境，请确认环境卡片显示为 `PPE`；若未自动捕获，请手动填写 `x-tt-env` 和 `x-use-ppe`。
- 如果删除失败，请复制删除结果并提供给作者排查。
- 本项目主要用于内部效率工具场景，开发时间有限，可能仍存在边界问题。

## 联系作者

如遇到问题或发现 bug，欢迎联系：

- 邮箱：<zhangfuwei.666@bytedance.com>
- 微信：`xjtu915`

## 许可证

MIT License
