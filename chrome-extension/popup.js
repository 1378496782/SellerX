// 全局变量
let cookies = '';
let countryCode = '';
let oecSellerId = '';
let sellerId = '';
let allPromotions = [];

// 活动类型映射
const promotionTypeNames = {
    1: '全部活动/券',
    2: '商家券',
    3: '运费折扣',
    4: '商品折扣',
    5: '限时闪购',
    6: '赠品活动',
    7: '多买多省',
    8: '套装优惠',
    9: '促销码(旧)',
    10: '早鸟价',
    11: 'SNS商品折扣',
    12: '创作者专属',
    17: '促销码'
};

// tab 映射
const tabNames = {
    2: 'Ongoing',
    3: 'Upcoming'
};

// DisplayType 映射
const displayTypeMap = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 7,
    9: 8,
    17: 8
};

// 判断是否是优惠券类型
const isVoucherType = (type) => type === 2;

// 判断是否是促销码类型
const isPromoCodeType = (type) => type === 9 || type === 17;

// 获取 DisplayType
const getDisplayType = (pType) => displayTypeMap[pType] || 1;

// 日志函数
function log(message, type = 'info') {
    const container = document.getElementById('logContainer');

    // 移除初始的 "等待执行操作..." 提示
    const emptyText = container.querySelector('.empty-text');
    if (emptyText) {
        emptyText.remove();
    }

    const line = document.createElement('div');
    line.className = `log-line ${type}`;

    const timestamp = new Date().toLocaleTimeString();
    line.innerHTML = `<span class="timestamp">[${timestamp}]</span>${escapeHtml(message)}`;

    container.appendChild(line);
    container.scrollTop = container.scrollHeight;

    // 同时在控制台输出
    console.log(message);
}

// 转义 HTML 防止 XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await init();
    setupEventListeners();
});

// 初始化函数
async function init() {
    showLoading(true);

    try {
        // 默认隐藏右侧面板
        const rightColumn = document.getElementById('rightColumn');
        rightColumn.classList.add('hidden');

        // 显示版本信息
        const manifest = chrome.runtime.getManifest();
        document.getElementById('versionInfo').textContent = `版本: ${manifest.version}`;

        // 获取 cookies
        await getCookies();

        // 获取当前页面信息
        await getCurrentPageInfo();

        // 更新 UI
        document.getElementById('countryCode').textContent = countryCode || '未获取到';
        document.getElementById('sellerId').textContent = oecSellerId || sellerId || '未获取到';

        // 检查是否获取到必要信息
        if (!countryCode || (!oecSellerId && !sellerId)) {
            log('警告: 未能获取到所有必要信息', 'warning');
            log('countryCode: ' + countryCode, 'warning');
            log('oecSellerId: ' + oecSellerId, 'warning');
            log('sellerId: ' + sellerId, 'warning');
        } else {
            log('初始化完成', 'success');
        }

    } catch (error) {
        log('初始化失败: ' + error.message, 'error');
        console.error('初始化失败:', error);
    }

    showLoading(false);
}

// 获取 cookies - 只从当前页面域名获取
async function getCookies() {
    return new Promise((resolve) => {
        // 先获取当前页面信息
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let currentDomain = '';

            if (tabs && tabs[0] && tabs[0].url) {
                const url = new URL(tabs[0].url);
                currentDomain = url.hostname;
                log('当前页面域名: ' + currentDomain, 'info');
            }

            // 只使用当前页面域名
            let domains = [];
            if (currentDomain) {
                domains.push(currentDomain);
                // 添加可能的父域名作为后备
                if (currentDomain.includes('tiktok')) {
                    domains.push('.tiktok.com');
                } else if (currentDomain.includes('tokopedia')) {
                    domains.push('.tokopedia.com');
                }
            } else {
                // 没有当前域名时使用默认列表
                domains = ['.tiktok.com', '.tokopedia.com'];
            }

            log('Cookie 查询域名: ' + domains.join(', '), 'info');

            let collectedCookies = [];
            let completed = 0;

            domains.forEach(domain => {
                chrome.cookies.getAll({ domain: domain }, (cookieArray) => {
                    completed++;

                    if (cookieArray && cookieArray.length > 0) {
                        log(`从 ${domain} 获取到 ${cookieArray.length} 个 cookies`, 'info');
                        collectedCookies = collectedCookies.concat(cookieArray);
                    }

                    // 所有域名都查询完了
                    if (completed === domains.length) {
                        processCookies(collectedCookies);
                        resolve();
                    }
                });
            });

            // 如果没有域名匹配，直接返回
            if (domains.length === 0) {
                resolve();
            }
        });
    });
}

// 处理 cookies
function processCookies(cookieArray) {
    log('获取到 ' + cookieArray.length + ' 个 cookies');

    if (cookieArray.length > 0) {
        cookies = cookieArray.map(c => c.name + '=' + c.value).join('; ');

        // 提取 seller_id - 尝试多种可能的 cookie 名称
        const cookieObj = {};
        cookieArray.forEach(c => {
            cookieObj[c.name] = c.value;
        });

        // 输出所有找到的 cookie 名称（用于调试）
        const cookieNames = Object.keys(cookieObj).filter(name =>
            name.toLowerCase().includes('seller') || name.toLowerCase().includes('shop') || name.toLowerCase().includes('id')
        );
        if (cookieNames.length > 0) {
            log('找到相关 Cookie: ' + cookieNames.join(', '), 'info');
            // 输出具体值
            cookieNames.forEach(name => {
                log(`  ${name}: ${cookieObj[name]}`, 'info');
            });
        }

        // Seller ID 就是 oec_seller_id（按优先级）
        const possibleSellerIds = [
            'oec_seller_id_unified_seller_env',
            'global_seller_id_unified_seller_env',
            'oec_seller_id',
            'SELLER_ID',
            'seller_id'
        ];

        // 按优先级设置 oec_sellerId 和 sellerId
        possibleSellerIds.forEach(key => {
            if (cookieObj[key] && !oecSellerId) {
                oecSellerId = cookieObj[key];
                sellerId = oecSellerId; // sellerId 就是 oec_sellerId
                log('✓ 从 cookie 获取 Seller ID (' + key + '): ' + oecSellerId, 'success');
            }
        });
    }
}

// 获取当前页面信息
async function getCurrentPageInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
                const currentUrl = tabs[0].url;
                log('当前页面 URL: ' + currentUrl);

                // 从 URL 提取国家代码
                if (currentUrl) {
                    // 先尝试 tiktok.com 域名
                    const tiktokMatch = currentUrl.match(/seller-([a-z]{2})\.tiktok\.com/i);
                    if (tiktokMatch) {
                        countryCode = tiktokMatch[1].toUpperCase();
                        log('✓ 从 TikTok 域名获取国家代码: ' + countryCode, 'success');
                    }
                    // 再尝试 tokopedia.com 域名
                    else {
                        const tokopediaMatch = currentUrl.match(/seller-([a-z]{2})\.tokopedia\.com/i);
                        if (tokopediaMatch) {
                            countryCode = tokopediaMatch[1].toUpperCase();
                            log('✓ 从 Tokopedia 域名获取国家代码: ' + countryCode, 'success');
                        }
                        // 从 URL 参数提取 shop_region
                        else {
                            const params = new URLSearchParams(currentUrl.split('?')[1] || '');
                            const shopRegion = params.get('shop_region');
                            if (shopRegion) {
                                countryCode = shopRegion.toUpperCase();
                                log('✓ 从 URL 参数获取国家代码: ' + countryCode, 'success');
                            }
                        }
                    }
                }
            }
            resolve();
        });
    });
}

// 设置事件监听
function setupEventListeners() {
    document.getElementById('queryBtn').addEventListener('click', queryPromotions);
    document.getElementById('deleteBtn').addEventListener('click', deletePromotions);
    document.getElementById('checkUpdateBtn').addEventListener('click', checkForUpdates);
    document.getElementById('toggleRightPanelBtn').addEventListener('click', toggleRightPanel);
}

// 切换右侧面板显示/隐藏
function toggleRightPanel() {
    const rightColumn = document.getElementById('rightColumn');
    const leftColumn = document.querySelector('.left-column');
    const btn = document.getElementById('toggleRightPanelBtn');
    const body = document.body;

    if (rightColumn.classList.contains('hidden')) {
        // 显示面板
        rightColumn.classList.remove('hidden');
        leftColumn.classList.add('shrink');
        body.classList.add('expanded');
        btn.textContent = '📜 隐藏日志';
    } else {
        // 隐藏面板
        rightColumn.classList.add('hidden');
        leftColumn.classList.remove('shrink');
        body.classList.remove('expanded');
        btn.textContent = '📜 显示日志';
    }
}

// 检查更新
async function checkForUpdates() {
    const btn = document.getElementById('checkUpdateBtn');
    btn.disabled = true;
    btn.textContent = '检查中...';

    try {
        // 显示当前版本
        const manifest = chrome.runtime.getManifest();
        const currentVersion = manifest.version;
        document.getElementById('versionInfo').textContent = `当前版本: ${currentVersion}`;

        alert(`当前版本: ${currentVersion}\n\n如需更新，请访问 GitHub Releases 页面。\n\n注意：Chrome 扩展的自动更新需要：\n1. 将扩展打包并签名\n2. 配置正确的 update_url\n3. 发布到 GitHub Releases`);

    } catch (error) {
        log('检查更新失败: ' + error.message, 'error');
        console.error('检查更新失败:', error);
        alert('检查更新失败: ' + error.message);
    }

    btn.disabled = false;
    btn.textContent = '检查更新';
}

// 查询促销活动
async function queryPromotions() {
    if (!countryCode || (!oecSellerId && !sellerId)) {
        log('错误: 请确保已登录 TikTok Seller 并在促销活动页面', 'error');
        alert('请确保已登录 TikTok Seller 并在促销活动页面');
        return;
    }

    showLoading(true);
    document.getElementById('resultSection').style.display = 'none';

    try {
        const promotionType = parseInt(document.getElementById('promotionType').value);
        const tabsSelect = document.getElementById('tabs');
        const tabs = Array.from(tabsSelect.selectedOptions).map(o => parseInt(o.value));

        // 根据国家代码确定域名，ID 地区使用 tokopedia.com，其他地区使用 tiktok.com
        const isTokopedia = countryCode === 'ID';
        const baseDomain = isTokopedia
            ? 'seller-' + countryCode.toLowerCase() + '.tokopedia.com'
            : 'seller-' + countryCode.toLowerCase() + '.tiktok.com';
        const effectiveSellerId = oecSellerId || sellerId;

        // 输出配置信息
        log('========================================');
        log('步骤1: 获取促销活动列表');
        log('========================================');
        log('当前查询的活动类型: ' + (promotionType ? promotionType + ' (' + (promotionTypeNames[promotionType] || '未知类型') + ')' : '所有类型'));
        log('查询的 Tab: ' + tabs.map(t => t + ' (' + (tabNames[t] || '未知') + ')').join(', '));
        log('是否为券类型: ' + (isVoucherType(promotionType) ? '是' : '否'));
        log('是否为促销码类型: ' + (isPromoCodeType(promotionType) ? '是' : '否'));
        log('当前国家: ' + countryCode);
        log('最终配置 - 国家: ' + countryCode + ', 域名: ' + baseDomain + ', oec_seller_id: ' + effectiveSellerId + ', seller_id: ' + effectiveSellerId);

        // 根据是否是 Tokopedia 使用不同的参数
        const locale = isTokopedia ? 'en-GB' : 'en';
        const language = isTokopedia ? 'en-GB' : 'en';
        const timezone = isTokopedia ? 'Asia%2FJakarta' : 'Asia%2FShanghai';

        const commonParams = '?locale=' + locale + '&language=' + language + '&oec_seller_id=' + effectiveSellerId +
            '&seller_id=' + effectiveSellerId + '&aid=4068&app_name=i18n_ecom_shop&fp=verify_mpkwurf6_N8rsXglq_2X88_4Tt8_93Qx_Gp2kBFbZQ5r9&device_platform=web&cookie_enabled=true&screen_width=2560&screen_height=1440&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F148.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=' + timezone;

        allPromotions = [];

        // 为每个 tab 查询
        for (const tab of tabs) {
            log('');
            log('--- 查询 Tab ' + tab + ' (' + (tabNames[tab] || '未知') + ') ---');

            // 动态设置 referer
            const refererUrl = (function () {
                if (promotionType) {
                    return 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + tab + '&shop_region=' + countryCode + '&promotion_type=' + promotionType;
                }
                return 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + tab + '&shop_region=' + countryCode;
            })();

            const headers = {
                'accept': '*/*',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,th;q=0.7',
                'content-type': 'application/json',
                'origin': 'https://' + baseDomain,
                'referer': refererUrl,
                'x-tt-oec-region': countryCode,
                'cookie': cookies
            };

            const requestBody = {
                index: 0,
                size: 50,
                diagnosis_type: 1
            };

            if (promotionType) {
                requestBody.promotion_type = promotionType;
            }

            if (tab === 2) {
                requestBody.status = 2;
                if (promotionType) {
                    requestBody.display_type = getDisplayType(promotionType);
                }
            } else if (tab === 3) {
                requestBody.status = 3;
            }

            // 调用后台脚本发起请求
            const response = await chrome.runtime.sendMessage({
                action: 'fetchPromotions',
                data: { baseDomain, commonParams, headers, requestBody }
            });

            if (response.success) {
                log('列表请求状态: 成功', 'success');
                log('x-tt-logid: ' + (response.logId || 'N/A'));

                const promotions = response.data.data?.promotions || [];
                log('Tab ' + tab + ' 找到 ' + promotions.length + ' 个促销活动:');

                promotions.forEach((p, idx) => {
                    p.fromTab = tab;
                    p.realPromotionType = p.promotion_type;
                    allPromotions.push(p);
                    log('  ' + (idx + 1) + '. ID: ' + p.id + ', 名称: ' + (p.name || 'N/A') + ', 状态: ' + (p.status || 'N/A') + ', 类型: ' + (p.promotion_type || 'N/A') + '(' + (promotionTypeNames[p.promotion_type] || '未知') + '), Tab: ' + tab);
                });
            } else {
                log('列表请求失败: ' + (response.error || '未知错误'), 'error');
            }
        }

        log('');
        log('========================================');
        log('共找到 ' + allPromotions.length + ' 个促销活动 (Tab ' + tabs.join(', ') + ')');
        log('========================================');

        // 更新列表显示
        updatePromotionList();

        // 启用删除按钮
        document.getElementById('deleteBtn').disabled = allPromotions.length === 0;

    } catch (error) {
        log('查询失败: ' + error.message, 'error');
        console.error('查询失败:', error);
        alert('查询失败: ' + error.message);
    }

    showLoading(false);
}

// 更新活动列表显示
function updatePromotionList() {
    const listContainer = document.getElementById('promotionList');

    if (allPromotions.length === 0) {
        listContainer.innerHTML = '<p class="empty-text">没有找到促销活动</p>';
        return;
    }

    let html = `<p class="empty-text" style="color: #666;">共找到 ${allPromotions.length} 个活动</p>`;

    allPromotions.forEach((p, idx) => {
        const typeName = promotionTypeNames[p.promotion_type] || '未知';
        const tabName = tabNames[p.fromTab] || '未知';

        html += `
            <div class="promotion-item">
                <div class="info">
                    <span class="name">${p.name || '未命名活动'}</span>
                    <span class="meta">ID: ${p.id} | 类型: ${typeName} | ${tabName}</span>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// 删除促销活动
async function deletePromotions() {
    if (allPromotions.length === 0) {
        log('没有可删除的活动', 'warning');
        return;
    }

    if (!confirm(`确定要删除这 ${allPromotions.length} 个活动吗？`)) {
        log('用户取消删除操作', 'warning');
        return;
    }

    showLoading(true);

    try {
        const promotionType = parseInt(document.getElementById('promotionType').value);
        // 根据国家代码确定域名，ID 地区使用 tokopedia.com，其他地区使用 tiktok.com
        const isTokopedia = countryCode === 'ID';
        const baseDomain = isTokopedia
            ? 'seller-' + countryCode.toLowerCase() + '.tokopedia.com'
            : 'seller-' + countryCode.toLowerCase() + '.tiktok.com';
        const effectiveSellerId = oecSellerId || sellerId;

        // 根据是否是 Tokopedia 使用不同的参数
        const locale = isTokopedia ? 'en-GB' : 'en';
        const language = isTokopedia ? 'en-GB' : 'en';
        const timezone = isTokopedia ? 'Asia%2FJakarta' : 'Asia%2FShanghai';

        const commonParams = '?locale=' + locale + '&language=' + language + '&oec_seller_id=' + effectiveSellerId +
            '&seller_id=' + effectiveSellerId + '&aid=4068&app_name=i18n_ecom_shop&fp=verify_mpkwurf6_N8rsXglq_2X88_4Tt8_93Qx_Gp2kBFbZQ5r9&device_platform=web&cookie_enabled=true&screen_width=2560&screen_height=1440&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F148.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=' + timezone;

        log('');
        log('========================================');
        log('步骤2: 开始删除');
        log('========================================');

        const deleteResults = [];

        for (let i = 0; i < allPromotions.length; i++) {
            const promotion = allPromotions[i];
            const actualType = promotion.realPromotionType || promotionType;

            try {
                // 获取删除接口 URL
                let destroyUrl = 'https://' + baseDomain + '/api/v1/promotion/destroy' + commonParams;
                let destroyRequestBody = { promotion_id: promotion.id };
                let destroyType = '活动';

                if (isVoucherType(actualType)) {
                    destroyUrl = 'https://' + baseDomain + '/api/v1/promotion/voucher/destroy' + commonParams;
                    destroyRequestBody = { voucher_type_id: promotion.id };
                    destroyType = '券';
                } else if (isPromoCodeType(actualType)) {
                    destroyUrl = 'https://' + baseDomain + '/api/v1/promotion/promo_code/delete' + commonParams;
                    destroyRequestBody = { promo_code_id: promotion.id };
                    destroyType = '促销码';
                }

                // 动态设置 referer
                const refererUrl = (function () {
                    if (promotionType) {
                        return 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + promotion.fromTab + '&shop_region=' + countryCode + '&promotion_type=' + promotionType;
                    }
                    return 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + promotion.fromTab + '&shop_region=' + countryCode;
                })();

                const headers = {
                    'accept': '*/*',
                    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,th;q=0.7',
                    'content-type': 'application/json',
                    'origin': 'https://' + baseDomain,
                    'referer': refererUrl,
                    'x-tt-oec-region': countryCode,
                    'cookie': cookies
                };

                const response = await chrome.runtime.sendMessage({
                    action: 'deletePromotion',
                    data: { url: destroyUrl, headers, requestBody: destroyRequestBody }
                });

                const isSuccess = response.success && response.data && response.data.code === 0;
                const logId = response.logId || 'N/A';

                deleteResults.push({
                    id: promotion.id,
                    name: promotion.name,
                    type: destroyType,
                    success: isSuccess,
                    status: response.data,
                    logId: logId
                });

                if (isSuccess) {
                    log('  [' + (i + 1) + '/' + allPromotions.length + '] 删除' + destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - 成功' + ', logid: ' + logId, 'success');
                } else {
                    log('  [' + (i + 1) + '/' + allPromotions.length + '] 删除' + destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - 失败' + ', logid: ' + logId, 'error');
                }

            } catch (deleteError) {
                let destroyType = '活动';
                if (isVoucherType(actualType)) {
                    destroyType = '券';
                } else if (isPromoCodeType(actualType)) {
                    destroyType = '促销码';
                }
                deleteResults.push({
                    id: promotion.id,
                    name: promotion.name,
                    type: destroyType,
                    success: false,
                    error: deleteError.message
                });
                log('  [' + (i + 1) + '/' + allPromotions.length + '] 删除' + destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - 失败: ' + deleteError.message, 'error');
            }
        }

        const successCount = deleteResults.filter(r => r.success).length;
        const failCount = deleteResults.length - successCount;

        log('');
        log('========================================');
        log('删除完成');
        log('========================================');
        log('成功: ' + successCount + ', 失败: ' + failCount);

        // 显示结果
        showDeleteResult(deleteResults);

        // 清空列表
        allPromotions = [];
        updatePromotionList();
        document.getElementById('deleteBtn').disabled = true;

    } catch (error) {
        log('删除失败: ' + error.message, 'error');
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
    }

    showLoading(false);
}

// 显示删除结果
function showDeleteResult(results) {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    let html = `
        <p>删除完成: <span class="success">成功 ${successCount}</span> | <span class="fail">失败 ${failCount}</span></p>
    `;

    if (failCount > 0) {
        html += '<div style="margin-top: 12px;">';
        results.forEach(r => {
            if (!r.success) {
                html += `
                    <div class="item">
                        ID: ${r.id} | 名称: ${r.name || 'N/A'} | 错误: ${r.error || '未知错误'}
                    </div>
                `;
            }
        });
        html += '</div>';
    }

    document.getElementById('deleteResult').innerHTML = html;
    document.getElementById('resultSection').style.display = 'block';
}

// 显示/隐藏加载状态
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}
