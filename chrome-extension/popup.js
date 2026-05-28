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

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await init();
    setupEventListeners();
});

// 初始化函数
async function init() {
    showLoading(true);

    try {
        // 显示版本信息
        const manifest = chrome.runtime.getManifest();
        document.getElementById('versionInfo').textContent = `版本: ${manifest.version}`;

        // 获取 cookies
        await getCookies();

        // 获取当前页面信息
        await getCurrentPageInfo();

        // 更新 UI
        document.getElementById('countryCode').textContent = countryCode || '未获取到';
        document.getElementById('sellerId').textContent = (oecSellerId || sellerId || '未获取到').substring(0, 20) + '...';

        // 检查是否获取到必要信息
        if (!countryCode || (!oecSellerId && !sellerId)) {
            console.log('警告: 未能获取到所有必要信息');
            console.log('countryCode:', countryCode);
            console.log('oecSellerId:', oecSellerId);
            console.log('sellerId:', sellerId);
        }

    } catch (error) {
        console.error('初始化失败:', error);
    }

    showLoading(false);
}

// 获取 cookies
async function getCookies() {
    return new Promise((resolve) => {
        // 尝试从多个域名获取 cookies（包括 tokopedia）
        const domains = ['.tiktok.com', '.tokopedia.com', 'seller-mx.tiktok.com', 'seller-us.tiktok.com'];
        let collectedCookies = [];

        let completed = 0;

        domains.forEach(domain => {
            chrome.cookies.getAll({ domain: domain }, (cookieArray) => {
                completed++;

                if (cookieArray && cookieArray.length > 0) {
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
}

// 处理 cookies
function processCookies(cookieArray) {
    console.log('获取到的 cookies 数量:', cookieArray.length);

    if (cookieArray.length > 0) {
        cookies = cookieArray.map(c => c.name + '=' + c.value).join('; ');

        // 提取 seller_id - 尝试多种可能的 cookie 名称
        const cookieObj = {};
        cookieArray.forEach(c => {
            cookieObj[c.name] = c.value;
            console.log('Cookie:', c.name);
        });

        // 尝试多种可能的 seller_id cookie 名称
        const possibleSellerIds = [
            'oec_seller_id_unified_seller_env',
            'global_seller_id_unified_seller_env',
            'SELLER_ID',
            'seller_id',
            'oec_seller_id'
        ];

        possibleSellerIds.forEach(key => {
            if (cookieObj[key] && !oecSellerId) {
                oecSellerId = cookieObj[key];
                console.log('找到 seller_id:', key, oecSellerId);
            }
            if (cookieObj[key] && !sellerId) {
                sellerId = cookieObj[key];
            }
        });

        // 也检查 SHOP_ID
        if (cookieObj['SHOP_ID'] && !sellerId) {
            sellerId = cookieObj['SHOP_ID'];
            console.log('找到 SHOP_ID:', sellerId);
        }
    }
}

// 获取当前页面信息
async function getCurrentPageInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
                const currentUrl = tabs[0].url;
                console.log('当前页面 URL:', currentUrl);

                // 从 URL 提取国家代码
                if (currentUrl) {
                    // 先尝试 tiktok.com 域名
                    const tiktokMatch = currentUrl.match(/seller-([a-z]{2})\.tiktok\.com/i);
                    if (tiktokMatch) {
                        countryCode = tiktokMatch[1].toUpperCase();
                        console.log('从 TikTok 域名提取国家代码:', countryCode);
                    }
                    // 再尝试 tokopedia.com 域名
                    else {
                        const tokopediaMatch = currentUrl.match(/seller-([a-z]{2})\.tokopedia\.com/i);
                        if (tokopediaMatch) {
                            countryCode = tokopediaMatch[1].toUpperCase();
                            console.log('从 Tokopedia 域名提取国家代码:', countryCode);
                        }
                        // 从 URL 参数提取 shop_region
                        else {
                            const params = new URLSearchParams(currentUrl.split('?')[1] || '');
                            const shopRegion = params.get('shop_region');
                            if (shopRegion) {
                                countryCode = shopRegion.toUpperCase();
                                console.log('从参数提取国家代码:', countryCode);
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
        console.error('检查更新失败:', error);
        alert('检查更新失败: ' + error.message);
    }

    btn.disabled = false;
    btn.textContent = '检查更新';
}

// 查询促销活动
async function queryPromotions() {
    if (!countryCode || (!oecSellerId && !sellerId)) {
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

        // 根据是否是 Tokopedia 使用不同的参数
        const locale = isTokopedia ? 'en-GB' : 'en';
        const language = isTokopedia ? 'en-GB' : 'en';
        const timezone = isTokopedia ? 'Asia%2FJakarta' : 'Asia%2FShanghai';

        const commonParams = '?locale=' + locale + '&language=' + language + '&oec_seller_id=' + effectiveSellerId +
            '&seller_id=' + effectiveSellerId + '&aid=4068&app_name=i18n_ecom_shop&fp=verify_mpkwurf6_N8rsXglq_2X88_4Tt8_93Qx_Gp2kBFbZQ5r9&device_platform=web&cookie_enabled=true&screen_width=2560&screen_height=1440&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F148.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=' + timezone;

        allPromotions = [];

        for (const tab of tabs) {
            const headers = {
                'accept': '*/*',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,th;q=0.7',
                'content-type': 'application/json',
                'origin': 'https://' + baseDomain,
                'referer': 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + tab + '&shop_region=' + countryCode + '&promotion_type=' + promotionType,
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
                const promotions = response.data.data?.promotions || [];
                promotions.forEach(p => {
                    p.fromTab = tab;
                    p.realPromotionType = p.promotion_type;
                });
                allPromotions = allPromotions.concat(promotions);
            }
        }

        // 更新列表显示
        updatePromotionList();

        // 启用删除按钮
        document.getElementById('deleteBtn').disabled = allPromotions.length === 0;

    } catch (error) {
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
    if (allPromotions.length === 0) return;

    if (!confirm(`确定要删除这 ${allPromotions.length} 个活动吗？`)) {
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

        const deleteResults = [];

        for (let i = 0; i < allPromotions.length; i++) {
            const promotion = allPromotions[i];
            const actualType = promotion.realPromotionType || promotionType;

            // 获取删除接口
            let destroyUrl = 'https://' + baseDomain + '/api/v1/promotion/destroy' + commonParams;
            let requestBody = { promotion_id: promotion.id };
            let destroyType = '活动';

            if (isVoucherType(actualType)) {
                destroyUrl = 'https://' + baseDomain + '/api/v1/promotion/voucher/destroy' + commonParams;
                requestBody = { voucher_type_id: promotion.id };
                destroyType = '券';
            } else if (isPromoCodeType(actualType)) {
                destroyUrl = 'https://' + baseDomain + '/api/v1/promotion/promo_code/delete' + commonParams;
                requestBody = { promo_code_id: promotion.id };
                destroyType = '促销码';
            }

            const headers = {
                'accept': '*/*',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,th;q=0.7',
                'content-type': 'application/json',
                'origin': 'https://' + baseDomain,
                'referer': 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + promotion.fromTab + '&shop_region=' + countryCode + '&promotion_type=' + promotionType,
                'x-tt-oec-region': countryCode,
                'cookie': cookies
            };

            const response = await chrome.runtime.sendMessage({
                action: 'deletePromotion',
                data: { url: destroyUrl, headers, requestBody }
            });

            const isSuccess = response.success && response.data.code === 0;

            deleteResults.push({
                id: promotion.id,
                name: promotion.name,
                type: destroyType,
                success: isSuccess,
                logId: response.logId || 'N/A',
                error: response.error
            });
        }

        // 显示结果
        showDeleteResult(deleteResults);

        // 清空列表
        allPromotions = [];
        updatePromotionList();
        document.getElementById('deleteBtn').disabled = true;

    } catch (error) {
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
