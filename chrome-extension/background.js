// 后台脚本 - 处理 API 请求和跨域问题
let currentTabId = null;

// 点击插件图标打开独立窗口
chrome.action.onClicked.addListener((tab) => {
    currentTabId = tab.id;
    chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 1500,
        height: 950
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCurrentTab') {
        if (currentTabId) {
            chrome.tabs.get(currentTabId, (tab) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    sendResponse({ success: true, tab: tab });
                }
            });
        } else {
            sendResponse({ success: false, error: 'No tab stored' });
        }
        return true;
    } else if (request.action === 'fetchPromotions') {
        fetchPromotions(request.data).then(result => {
            sendResponse(result);
        });
        return true;
    } else if (request.action === 'deletePromotion') {
        deletePromotion(request.data).then(result => {
            sendResponse(result);
        });
        return true;
    }
});

async function fetchPromotions(data) {
    const { baseDomain, commonParams, headers, requestBody } = data;

    try {
        const url = `https://${baseDomain}/api/v1/promotion/list${commonParams}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            credentials: 'include'
        });

        const result = await response.json();
        return {
            success: true,
            data: result,
            logId: response.headers.get('x-tt-logid') || 'N/A'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function deletePromotion(data) {
    const { url, headers, requestBody } = data;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            credentials: 'include'
        });

        const result = await response.json();
        return {
            success: true,
            data: result,
            logId: response.headers.get('x-tt-logid') || 'N/A'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
