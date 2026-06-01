import {
    getBaseDomain,
    getLocaleConfig,
    getPromotionDisplayName,
    getPromotionFilterConfig,
    isPromoCodeType,
    isVoucherType,
    tabNames
} from './config.js';
import { sendRuntimeMessage } from './api-client.js';
import { appState, clearPromotions, getEffectiveSellerId, setPromotions } from './state.js';

function buildCommonParams(countryCode, sellerId) {
    const { locale, language, timezone } = getLocaleConfig(countryCode);
    return '?locale=' + locale + '&language=' + language + '&oec_seller_id=' + sellerId +
        '&seller_id=' + sellerId + '&aid=4068&app_name=i18n_ecom_shop&fp=verify_mpkwurf6_N8rsXglq_2X88_4Tt8_93Qx_Gp2kBFbZQ5r9&device_platform=web&cookie_enabled=true&screen_width=2560&screen_height=1440&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F148.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=' + timezone;
}

function buildRefererUrl(baseDomain, countryCode, tab, promotionType) {
    if (promotionType) {
        return 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + tab + '&shop_region=' + countryCode + '&promotion_type=' + promotionType;
    }

    return 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + tab + '&shop_region=' + countryCode;
}

function buildHeaders(baseDomain, countryCode, refererUrl) {
    const headers = {
        accept: '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,th;q=0.7',
        'content-type': 'application/json',
        origin: 'https://' + baseDomain,
        referer: refererUrl,
        'x-tt-oec-region': countryCode,
        cookie: appState.cookies
    };

    Object.entries(appState.laneHeaders || {}).forEach(([key, value]) => {
        if (value) {
            headers[key] = value;
        }
    });

    return headers;
}

function buildQueryRequestBody(tab, filterConfig) {
    const requestBody = {
        index: 0,
        size: 50,
        diagnosis_type: 1
    };

    const promotionType = filterConfig?.promotionType;
    if (promotionType) {
        requestBody.promotion_type = promotionType;
    }

    if ([2, 3, 4, 5].includes(tab)) {
        requestBody.status = tab;
    }

    if (filterConfig?.displayType) {
        requestBody.display_type = filterConfig.displayType;
    }

    return requestBody;
}

function getDeleteRequestConfig(baseDomain, commonParams, promotion, actualType) {
    if (isVoucherType(actualType)) {
        return {
            url: 'https://' + baseDomain + '/api/v1/promotion/voucher/destroy' + commonParams,
            requestBody: { voucher_type_id: promotion.id },
            destroyType: '券'
        };
    }

    if (isPromoCodeType(actualType)) {
        return {
            url: 'https://' + baseDomain + '/api/v1/promotion/promo_code/delete' + commonParams,
            requestBody: { promo_code_id: promotion.id },
            destroyType: '促销码'
        };
    }

    return {
        url: 'https://' + baseDomain + '/api/v1/promotion/destroy' + commonParams,
        requestBody: { promotion_id: promotion.id },
        destroyType: '活动'
    };
}

function describeResponseError(response) {
    if (!response) {
        return '无响应';
    }

    const parts = [];
    if (response.errorType) {
        parts.push(response.errorType);
    }
    if (response.status) {
        parts.push('HTTP ' + response.status);
    }
    if (response.apiCode !== undefined && response.apiCode !== 0) {
        parts.push('API code ' + response.apiCode);
    }

    const message = response.error || response.apiMessage || response.data?.message || response.data?.msg || '未知错误';
    return parts.length ? parts.join(' / ') + ': ' + message : message;
}

function formatLaneHeadersForLog() {
    const laneHeaders = appState.laneHeaders || {};
    const entries = Object.entries(laneHeaders).filter(([, value]) => Boolean(value));
    return entries.length ? entries.map(([key, value]) => key + '=' + value).join(', ') : '';
}

async function deletePromotionRecord({ promotion, promotionType, baseDomain, countryCode, commonParams }) {
    const actualType = promotion.realPromotionType || promotion.promotion_type || promotionType;
    const deleteConfig = getDeleteRequestConfig(baseDomain, commonParams, promotion, actualType);
    const refererUrl = buildRefererUrl(baseDomain, countryCode, promotion.fromTab || promotion.status, promotionType);
    const headers = buildHeaders(baseDomain, countryCode, refererUrl);

    const response = await sendRuntimeMessage('deletePromotion', {
        url: deleteConfig.url,
        headers,
        requestBody: deleteConfig.requestBody
    });

    const isSuccess = response.success && response.data && response.data.code === 0;
    const logId = response.logId || 'N/A';
    const errorMessage = isSuccess ? '' : describeResponseError(response);

    return {
        id: promotion.id,
        name: promotion.name,
        type: getPromotionDisplayName(promotion),
        destroyType: deleteConfig.destroyType,
        success: isSuccess,
        status: response.data,
        logId,
        error: errorMessage
    };
}

export function canRunPromotionAction() {
    return Boolean(appState.countryCode && getEffectiveSellerId());
}

export async function queryPromotions({ promotionFilter, tabs, log }) {
    const countryCode = appState.countryCode;
    const effectiveSellerId = getEffectiveSellerId();
    const baseDomain = getBaseDomain(countryCode);
    const commonParams = buildCommonParams(countryCode, effectiveSellerId);
    const filterConfig = getPromotionFilterConfig(promotionFilter);
    const promotionType = filterConfig.promotionType;
    const collectedPromotions = [];

    log('========================================');
    log('步骤1: 获取促销活动列表');
    log('========================================');
    log('当前查询的活动类型: ' + (promotionType ? promotionType + ' (' + filterConfig.label + ')' : '所有类型'));
    if (filterConfig.displayType) {
        log('当前查询的 Display Type: ' + filterConfig.displayType);
    }
    log('查询的 Tab: ' + tabs.map((tab) => tab + ' (' + (tabNames[tab] || '未知') + ')').join(', '));
    log('是否为券类型: ' + (isVoucherType(promotionType) ? '是' : '否'));
    log('是否为促销码类型: ' + (isPromoCodeType(promotionType) ? '是' : '否'));
    log('泳道 Header: ' + (formatLaneHeadersForLog() || '未使用'));
    log('当前国家: ' + countryCode);
    log('最终配置 - 国家: ' + countryCode + ', 域名: ' + baseDomain + ', oec_seller_id: ' + effectiveSellerId + ', seller_id: ' + effectiveSellerId);

    for (const tab of tabs) {
        log('');
        log('--- 查询 Tab ' + tab + ' (' + (tabNames[tab] || '未知') + ') ---');

        const refererUrl = buildRefererUrl(baseDomain, countryCode, tab, promotionType);
        const headers = buildHeaders(baseDomain, countryCode, refererUrl);
        const requestBody = buildQueryRequestBody(tab, filterConfig);

        const response = await sendRuntimeMessage('fetchPromotions', {
            baseDomain,
            commonParams,
            headers,
            requestBody
        });

        if (response.success && (!response.apiCode || response.apiCode === 0)) {
            log('列表请求状态: 成功', 'success');
            log('x-tt-logid: ' + (response.logId || 'N/A'));

            const promotions = response.data.data?.promotions || [];
            log('Tab ' + tab + ' 找到 ' + promotions.length + ' 个促销活动:');

            promotions.forEach((promotion, index) => {
                promotion.fromTab = tab;
                promotion.realPromotionType = promotion.promotion_type;
                collectedPromotions.push(promotion);
                log('  ' + (index + 1) + '. ID: ' + promotion.id + ', 名称: ' + (promotion.name || 'N/A') + ', 状态: ' + (promotion.status || 'N/A') + ', 类型: ' + (promotion.promotion_type || 'N/A') + '(' + getPromotionDisplayName(promotion) + '), Tab: ' + tab);
            });
        } else {
            log('列表请求失败: ' + describeResponseError(response), 'error');
            log('x-tt-logid: ' + (response?.logId || 'N/A'), 'error');
        }
    }

    setPromotions(collectedPromotions);

    log('');
    log('========================================');
    log('共找到 ' + appState.allPromotions.length + ' 个促销活动 (Tab ' + tabs.join(', ') + ')');
    log('========================================');

    return appState.allPromotions;
}

export async function deletePromotions({ promotionFilter, log }) {
    const countryCode = appState.countryCode;
    const effectiveSellerId = getEffectiveSellerId();
    const baseDomain = getBaseDomain(countryCode);
    const commonParams = buildCommonParams(countryCode, effectiveSellerId);
    const filterConfig = getPromotionFilterConfig(promotionFilter);
    const promotionType = filterConfig.promotionType;
    const deleteResults = [];

    log('');
    log('========================================');
    log('步骤2: 开始删除');
    log('========================================');
    log('待删除活动数: ' + appState.allPromotions.length);
    log('泳道 Header: ' + (formatLaneHeadersForLog() || '未使用'));

    for (let index = 0; index < appState.allPromotions.length; index++) {
        const promotion = appState.allPromotions[index];
        const actualType = promotion.realPromotionType || promotionType;

        try {
            const result = await deletePromotionRecord({
                promotion,
                promotionType,
                baseDomain,
                countryCode,
                commonParams
            });
            deleteResults.push(result);

            if (result.success) {
                log('  [' + (index + 1) + '/' + appState.allPromotions.length + '] 删除' + result.destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - 成功' + ', logid: ' + result.logId, 'success');
            } else {
                log('  [' + (index + 1) + '/' + appState.allPromotions.length + '] 删除' + result.destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - 失败: ' + result.error + ', logid: ' + result.logId, 'error');
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
                type: getPromotionDisplayName(promotion),
                destroyType,
                success: false,
                error: deleteError.message
            });
            log('  [' + (index + 1) + '/' + appState.allPromotions.length + '] 删除' + destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - 失败: ' + deleteError.message, 'error');
        }
    }

    const successCount = deleteResults.filter((result) => result.success).length;
    const failCount = deleteResults.length - successCount;

    log('');
    log('========================================');
    log('删除完成');
    log('========================================');
    log('成功: ' + successCount + ', 失败: ' + failCount);

    if (failCount > 0) {
        const failedIds = deleteResults
            .filter((result) => !result.success)
            .map((result) => result.id || 'N/A')
            .join(', ');
        log('失败活动 ID: ' + failedIds, 'error');
    }

    clearPromotions();
    return deleteResults;
}

export async function deleteSinglePromotion({ promotion, promotionFilter, log }) {
    const countryCode = appState.countryCode;
    const effectiveSellerId = getEffectiveSellerId();
    const baseDomain = getBaseDomain(countryCode);
    const commonParams = buildCommonParams(countryCode, effectiveSellerId);
    const filterConfig = getPromotionFilterConfig(promotionFilter);
    const promotionType = filterConfig.promotionType;

    log('');
    log('========================================');
    log('单条删除');
    log('========================================');
    log('待删除 ID: ' + promotion.id + ', 名称: ' + (promotion.name || 'N/A'));
    log('泳道 Header: ' + (formatLaneHeadersForLog() || '未使用'));

    try {
        const result = await deletePromotionRecord({
            promotion,
            promotionType,
            baseDomain,
            countryCode,
            commonParams
        });

        if (result.success) {
            log('删除' + result.destroyType + ' ID: ' + promotion.id + ', 名称: ' + (promotion.name || 'N/A') + ' - 成功, logid: ' + result.logId, 'success');
        } else {
            log('删除' + result.destroyType + ' ID: ' + promotion.id + ', 名称: ' + (promotion.name || 'N/A') + ' - 失败: ' + result.error + ', logid: ' + result.logId, 'error');
        }

        return result;
    } catch (deleteError) {
        let destroyType = '活动';
        const actualType = promotion.realPromotionType || promotion.promotion_type || promotionType;
        if (isVoucherType(actualType)) {
            destroyType = '券';
        } else if (isPromoCodeType(actualType)) {
            destroyType = '促销码';
        }

        const result = {
            id: promotion.id,
            name: promotion.name,
            type: getPromotionDisplayName(promotion),
            destroyType,
            success: false,
            error: deleteError.message
        };
        log('删除' + destroyType + ' ID: ' + promotion.id + ', 名称: ' + (promotion.name || 'N/A') + ' - 失败: ' + deleteError.message, 'error');
        return result;
    }
}
