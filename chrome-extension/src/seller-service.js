import { extractRegionFromUrl, getDomainFamily, sellerDomains, sellerIdCookieKeys } from './config.js';
import { getCookiesByDomain, getCurrentTab, getStorageValues, removeStorageValues, sendRuntimeMessage, setStorageValues } from './api-client.js';
import { appState, setCookies, setLaneHeaders, setSellerInfo } from './state.js';

const manualLaneHeadersStorageKey = 'manualLaneHeaders';
const defaultLaneHeaderRows = [
    { name: 'x-tt-env', value: '', enabled: true },
    { name: 'x-use-ppe', value: '', enabled: true }
];

function buildCookieDomains(currentDomain) {
    if (!currentDomain) {
        return ['.tiktok.com', '.tiktok.net', '.tokopedia.com', '.tokopedia.net'];
    }

    const family = getDomainFamily(currentDomain);
    const domains = [currentDomain];

    if (family && sellerDomains[family]) {
        domains.push(...sellerDomains[family]);
    }

    return [...new Set(domains)];
}

function getSellerApiContext(currentUrl) {
    const url = new URL(currentUrl);
    const family = getDomainFamily(url.hostname);

    if (!family) {
        return null;
    }

    return {
        apiDomain: url.hostname,
        defaultRegion: extractRegionFromUrl(currentUrl)
    };
}

function applySellerApiData(data, log) {
    if (!data || !data.data) {
        return;
    }

    const seller = data.data.seller || {};
    const globalSeller = data.data.global_seller || {};

    if (seller.seller_id) {
        setSellerInfo({ oecSellerId: seller.seller_id });
        log('✓ 从 API 获取 Seller ID: ' + seller.seller_id, 'success');
    }

    if (seller.region_code) {
        setSellerInfo({ countryCode: seller.region_code });
        log('✓ 从 API 获取国家代码 (region_code): ' + seller.region_code.toUpperCase(), 'success');
    } else if (seller.shop_region) {
        setSellerInfo({ countryCode: seller.shop_region });
        log('✓ 从 API 获取国家代码 (shop_region): ' + seller.shop_region.toUpperCase(), 'success');
    }

    if (seller.shop_name) {
        setSellerInfo({ shopName: seller.shop_name });
        log('✓ 从 API 获取店铺名称: ' + seller.shop_name, 'success');
    }

    if (seller.shop_code) {
        setSellerInfo({ shopCode: seller.shop_code });
        log('✓ 从 API 获取店铺代码: ' + seller.shop_code, 'success');
    }

    if (!appState.oecSellerId && globalSeller.global_seller_id) {
        setSellerInfo({ oecSellerId: globalSeller.global_seller_id });
        log('✓ 从 API 获取 Global Seller ID: ' + globalSeller.global_seller_id, 'success');
    }

    if (!appState.countryCode && data.data.base_region) {
        setSellerInfo({ countryCode: data.data.base_region });
        log('✓ 从 API 获取国家代码 (base_region): ' + data.data.base_region.toUpperCase(), 'success');
    }
}

function normalizeHeaderRows(rows) {
    if (Array.isArray(rows)) {
        return rows.map((row) => ({
            name: String(row?.name || '').trim(),
            value: String(row?.value || '').trim(),
            enabled: row?.enabled !== false
        })).filter((row) => row.name || row.value);
    }

    if (rows && typeof rows === 'object') {
        return Object.entries(rows).map(([name, value]) => ({
            name,
            value: String(value || '').trim(),
            enabled: true
        })).filter((row) => row.name || row.value);
    }

    return [];
}

function getActiveHeadersFromRows(rows) {
    return normalizeHeaderRows(rows).reduce((headers, row) => {
        if (row.enabled && row.name && row.value) {
            headers[row.name] = row.value;
        }
        return headers;
    }, {});
}

function upsertHeaderRow(rows, name, value) {
    if (!value) {
        return rows;
    }

    const normalizedName = name.toLowerCase();
    const index = rows.findIndex((row) => row.name.toLowerCase() === normalizedName);
    if (index >= 0) {
        rows[index] = {
            ...rows[index],
            name,
            value
        };
        return rows;
    }

    return [
        {
            name,
            value,
            enabled: true
        },
        ...rows
    ];
}

function mergeAutoAndManualHeaderRows(autoHeaders, manualRows) {
    let rows = normalizeHeaderRows(manualRows);
    if (!rows.length && Object.keys(autoHeaders).length > 0) {
        rows = defaultLaneHeaderRows.map((row) => ({ ...row }));
    }

    rows = upsertHeaderRow(rows, 'x-use-ppe', autoHeaders['x-use-ppe']);
    rows = upsertHeaderRow(rows, 'x-tt-env', autoHeaders['x-tt-env']);

    return rows.length ? rows : defaultLaneHeaderRows;
}

export async function getSellerInfoFromApi(log) {
    const tab = await getCurrentTab();
    if (!tab || !tab.url) {
        log('无法获取当前页面信息', 'warning');
        return;
    }

    const context = getSellerApiContext(tab.url);
    const currentDomain = new URL(tab.url).hostname;
    log('当前页面域名: ' + currentDomain, 'info');

    if (!context) {
        log('无法识别的域名，跳过 API 获取', 'warning');
        return;
    }

    const apiUrl = `https://${context.apiDomain}/api/v3/seller/common/get?need_verify_account=true&default_region=${context.defaultRegion}&version=3`;
    log('正在调用 API: ' + apiUrl, 'info');

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
                accept: '*/*',
                'accept-language': 'zh-CN,zh;q=0.9',
                referer: `https://${context.apiDomain}/homepage`,
                'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            log('API 请求失败，HTTP 状态码: ' + response.status, 'warning');
            return;
        }

        const data = await response.json();
        log('API 响应成功', 'success');
        applySellerApiData(data, log);

        if (!appState.oecSellerId) {
            log('未能从 API 响应中找到 Seller ID', 'warning');
        }
    } catch (error) {
        log('API 请求异常: ' + error.message, 'warning');
    }
}

export async function getCookies(log) {
    const tab = await getCurrentTab();
    let currentDomain = '';

    if (tab && tab.url) {
        currentDomain = new URL(tab.url).hostname;
        log('当前页面域名: ' + currentDomain, 'info');
    }

    const domains = buildCookieDomains(currentDomain);
    log('Cookie 查询域名: ' + domains.join(', '), 'info');

    const cookieGroups = await Promise.all(domains.map(async (domain) => {
        const cookieArray = await getCookiesByDomain(domain);
        if (cookieArray.length > 0) {
            log(`从 ${domain} 获取到 ${cookieArray.length} 个 cookies`, 'info');
        }
        return cookieArray;
    }));

    processCookies(cookieGroups.flat(), log);
}

export async function getLaneHeaders(log) {
    const tab = await getCurrentTab();
    if (!tab || !tab.url) {
        log('无法获取当前页面信息，跳过泳道 Header 获取', 'warning');
        return;
    }

    const host = new URL(tab.url).hostname;
    const response = await sendRuntimeMessage('getLaneHeaders', {
        tabId: tab.id,
        host
    });
    const laneHeaders = response?.headers || {};
    const stored = await getStorageValues([manualLaneHeadersStorageKey]);
    const manualLaneHeaderRows = normalizeHeaderRows(stored[manualLaneHeadersStorageKey]);
    const effectiveRows = mergeAutoAndManualHeaderRows(laneHeaders, manualLaneHeaderRows);
    const effectiveLaneHeaders = getActiveHeadersFromRows(effectiveRows);

    setLaneHeaders(effectiveLaneHeaders);

    if (Object.keys(laneHeaders).length > 0) {
        const sourceLabel = response?.source ? '（' + response.source + '）' : '';
        const customCount = manualLaneHeaderRows.filter((row) => row.name && !['x-tt-env', 'x-use-ppe'].includes(row.name.toLowerCase())).length;
        log('✓ 已自动捕获泳道 Header' + sourceLabel + ': ' + Object.entries(laneHeaders).map(([key, value]) => key + '=' + value).join(', '), 'success');
        if (customCount > 0) {
            log('✓ 已合并手动配置的自定义请求头 ' + customCount + ' 个', 'success');
        }
    } else if (Object.keys(effectiveLaneHeaders).length > 0) {
        log('✓ 使用手动配置的请求头: ' + Object.entries(effectiveLaneHeaders).map(([key, value]) => key + '=' + value).join(', '), 'success');
    } else {
        log('未自动捕获到泳道 Header，将按 Prod 请求。若 DevTools 能看到 X-Tt-Env / X-Use-Ppe，说明可能是其他扩展在最终发送前注入，SellerX 无法稳定读取，请手动填写一次。', 'warning');
    }

    return {
        headers: effectiveLaneHeaders,
        rows: effectiveRows,
        source: Object.keys(laneHeaders).length > 0 ? '自动' : (Object.keys(effectiveLaneHeaders).length > 0 ? '手动' : '')
    };
}

export async function saveManualLaneHeaders(rows, log) {
    const normalizedRows = normalizeHeaderRows(rows);
    const activeHeaders = getActiveHeadersFromRows(normalizedRows);

    await setStorageValues({
        [manualLaneHeadersStorageKey]: normalizedRows
    });
    setLaneHeaders(activeHeaders);
    log('✓ 已保存手动请求头: ' + (Object.entries(activeHeaders).map(([key, value]) => key + '=' + value).join(', ') || '空'), 'success');
    return {
        headers: activeHeaders,
        rows: normalizedRows.length ? normalizedRows : defaultLaneHeaderRows
    };
}

export async function clearManualLaneHeaders(log) {
    await removeStorageValues([manualLaneHeadersStorageKey]);
    setLaneHeaders({});
    log('已清空手动泳道 Header', 'warning');
}

export function processCookies(cookieArray, log) {
    if (!cookieArray.length) {
        return;
    }

    setCookies(cookieArray.map((cookie) => cookie.name + '=' + cookie.value).join('; '));

    if (appState.oecSellerId) {
        return;
    }

    const cookieObj = {};
    cookieArray.forEach((cookie) => {
        cookieObj[cookie.name] = cookie.value;
    });

    for (const key of sellerIdCookieKeys) {
        if (cookieObj[key]) {
            setSellerInfo({ oecSellerId: cookieObj[key] });
            log('✓ 从 cookie 获取 Seller ID (' + key + '): ' + cookieObj[key], 'success');
            break;
        }
    }
}

export async function getCurrentPageInfo(log) {
    const tab = await getCurrentTab();
    if (!tab || !tab.url) {
        return;
    }

    log('当前页面 URL: ' + tab.url);

    const countryCode = extractRegionFromUrl(tab.url);
    if (countryCode) {
        setSellerInfo({ countryCode });
        log('✓ 从当前页面获取国家代码: ' + countryCode, 'success');
    }
}
