// 后台脚本 - 处理 API 请求和跨域问题

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchPromotions') {
        fetchPromotions(request.data).then(sendResponse);
        return true;
    } else if (request.action === 'deletePromotion') {
        deletePromotion(request.data).then(sendResponse);
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
