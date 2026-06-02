// 后台脚本 - 处理 API 请求和跨域问题

const laneHeaderNames = ['x-tt-env', 'x-use-ppe'];
const laneHeadersByTabId = {};

function getTabLaneStorageKey(tabId) {
    return 'laneHeaders:tab:' + tabId;
}

function normalizeHeaderName(name) {
    return String(name || '').toLowerCase();
}

function extractLaneHeaders(requestHeaders = []) {
    const laneHeaders = {};

    requestHeaders.forEach((header) => {
        const normalizedName = normalizeHeaderName(header.name);
        if (!laneHeaderNames.includes(normalizedName) || !header.value) {
            return;
        }

        if (normalizedName === 'x-tt-env') {
            laneHeaders['x-tt-env'] = header.value;
        } else if (normalizedName === 'x-use-ppe') {
            laneHeaders['x-use-ppe'] = header.value;
        }
    });

    return laneHeaders;
}

function cacheLaneHeaders(details) {
    const laneHeaders = extractLaneHeaders(details.requestHeaders);
    if (!Object.keys(laneHeaders).length) {
        return;
    }

    if (details.tabId >= 0) {
        laneHeadersByTabId[details.tabId] = {
            ...(laneHeadersByTabId[details.tabId] || {}),
            ...laneHeaders
        };
        chrome.storage.local.set({
            [getTabLaneStorageKey(details.tabId)]: laneHeadersByTabId[details.tabId]
        });
    }
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    cacheLaneHeaders,
    {
        urls: [
            'https://*.tiktok.com/*',
            'https://*.tiktok.net/*',
            'https://*.tokopedia.com/*',
            'https://*.tokopedia.net/*',
            'https://*.tiktokv.com/*'
        ]
    },
    ['requestHeaders', 'extraHeaders']
);

chrome.webRequest.onSendHeaders.addListener(
    cacheLaneHeaders,
    {
        urls: [
            'https://*.tiktok.com/*',
            'https://*.tiktok.net/*',
            'https://*.tokopedia.com/*',
            'https://*.tokopedia.net/*',
            'https://*.tiktokv.com/*'
        ]
    },
    ['requestHeaders', 'extraHeaders']
);

chrome.tabs.onRemoved.addListener((tabId) => {
    delete laneHeadersByTabId[tabId];
    chrome.storage.local.remove(getTabLaneStorageKey(tabId));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== 'loading' && !changeInfo.url) {
        return;
    }

    delete laneHeadersByTabId[tabId];
    chrome.storage.local.remove(getTabLaneStorageKey(tabId));
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchPromotions') {
        fetchPromotions(request.data).then(sendResponse);
        return true;
    } else if (request.action === 'deletePromotion') {
        deletePromotion(request.data).then(sendResponse);
        return true;
    } else if (request.action === 'getLaneHeaders') {
        getLaneHeaders(request.data).then(sendResponse);
        return true;
    }
});

async function parseJsonSafely(response) {
    const rawText = await response.text();

    if (!rawText) {
        return { data: null, rawText: '' };
    }

    try {
        return {
            data: JSON.parse(rawText),
            rawText
        };
    } catch (error) {
        return {
            data: null,
            rawText,
            parseError: error.message
        };
    }
}

async function postJson(url, headers, requestBody) {
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        credentials: 'include'
    });
    const logId = response.headers.get('x-tt-logid') || 'N/A';
    const parsed = await parseJsonSafely(response);

    if (parsed.parseError) {
        return {
            success: false,
            errorType: 'JSON_PARSE_ERROR',
            error: '响应不是合法 JSON: ' + parsed.parseError,
            status: response.status,
            statusText: response.statusText,
            logId,
            rawText: parsed.rawText.slice(0, 500)
        };
    }

    if (!response.ok) {
        return {
            success: false,
            errorType: 'HTTP_ERROR',
            error: 'HTTP 请求失败: ' + response.status + ' ' + response.statusText,
            status: response.status,
            statusText: response.statusText,
            data: parsed.data,
            logId
        };
    }

    return {
        success: true,
        data: parsed.data,
        status: response.status,
        statusText: response.statusText,
        apiCode: parsed.data?.code,
        apiMessage: parsed.data?.message || parsed.data?.msg,
        logId
    };
}

async function fetchPromotions(data) {
    const { baseDomain, commonParams, headers, requestBody } = data;

    try {
        const url = `https://${baseDomain}/api/v1/promotion/list${commonParams}`;
        return await postJson(url, headers, requestBody);
    } catch (error) {
        return {
            success: false,
            errorType: 'NETWORK_ERROR',
            error: error.message
        };
    }
}

async function deletePromotion(data) {
    const { url, headers, requestBody } = data;

    try {
        return await postJson(url, headers, requestBody);
    } catch (error) {
        return {
            success: false,
            errorType: 'NETWORK_ERROR',
            error: error.message
        };
    }
}

async function getLaneHeaders(data = {}) {
    const tabId = data.tabId;
    const cachedHeaders = tabId !== undefined ? laneHeadersByTabId[tabId] : null;
    if (cachedHeaders) {
        return {
            success: true,
            headers: cachedHeaders,
            source: 'tab'
        };
    }

    if (tabId === undefined) {
        return {
            success: true,
            headers: {},
            source: ''
        };
    }

    const storageKey = getTabLaneStorageKey(tabId);
    const stored = await chrome.storage.local.get([storageKey]);
    const headers = stored[storageKey] || {};

    return {
        success: true,
        headers,
        source: Object.keys(headers).length > 0 ? 'tab-storage' : ''
    };
}
