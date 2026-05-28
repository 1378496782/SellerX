// 后台脚本 - 处理 API 请求和跨域问题

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchPromotions') {
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
