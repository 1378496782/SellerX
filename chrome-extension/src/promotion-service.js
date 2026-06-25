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

const QUERY_PAGE_SIZE = 50;
const MAX_QUERY_PAGES = 20;
const DELETE_CONCURRENCY = 5;

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

function buildQueryRequestBody(tab, filterConfig, pageIndex = 0) {
    const requestBody = {
        index: pageIndex * QUERY_PAGE_SIZE,
        size: QUERY_PAGE_SIZE,
        diagnosis_type: 1
    };

    const promotionType = filterConfig?.promotionType;
    if (promotionType) {
        requestBody.promotion_type = promotionType;
    }

    if ([2, 3, 4, 5].includes(tab)) {
        requestBody.status = tab;
    }

    if (filterConfig?.displayType && !filterConfig?.promotionTypeDetail && !filterConfig?.promotionTypeDetails) {
        requestBody.display_type = filterConfig.displayType;
    }

    return requestBody;
}

function normalizeFilterValues(value, values) {
    if (Array.isArray(values)) {
        return values.map(Number);
    }

    return value ? [Number(value)] : [];
}

function filterPromotionsByConfig(promotions, filterConfig) {
    const displayTypes = normalizeFilterValues(filterConfig?.displayType, filterConfig?.displayTypes);
    const promotionTypeDetails = normalizeFilterValues(filterConfig?.promotionTypeDetail, filterConfig?.promotionTypeDetails);

    if (!displayTypes.length && !promotionTypeDetails.length) {
        return promotions;
    }

    return promotions.filter((promotion) => {
        const displayTypeMatched = displayTypes.includes(Number(promotion.display_type));
        const detailMatched = promotionTypeDetails.includes(Number(promotion.promotion_type_detail));

        return displayTypeMatched || detailMatched;
    });
}

function formatFilterValues(value, values) {
    const normalizedValues = normalizeFilterValues(value, values);
    return normalizedValues.length ? normalizedValues.join(', ') : '';
}

function logPromotionTypeDistribution(promotions, log) {
    if (!promotions.length) {
        return;
    }

    const distribution = new Map();
    promotions.forEach((promotion) => {
        const promotionType = promotion.promotion_type || 'N/A';
        const displayType = promotion.display_type || 'N/A';
        const detail = promotion.promotion_type_detail || 'N/A';
        const displayName = getPromotionDisplayName(promotion);
        const key = 'promotion_type=' + promotionType +
            ', display_type=' + displayType +
            ', promotion_type_detail=' + detail +
            ', 类型=' + displayName;
        distribution.set(key, (distribution.get(key) || 0) + 1);
    });

    log('未命中过滤条件，服务端返回的类型分布如下，可用于校准枚举：', 'warning');
    Array.from(distribution.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .forEach(([key, count]) => {
            log('  ' + count + ' 个：' + key, 'warning');
        });
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
    if (!entries.length) {
        return 'Prod（未使用自定义请求头）';
    }

    const hasPpeHeaders = entries.some(([key]) => ['x-tt-env', 'x-use-ppe'].includes(key.toLowerCase()));
    const prefix = hasPpeHeaders ? 'PPE · ' : '自定义 Header · ';
    return prefix + entries.map(([key, value]) => key + '=' + value).join(', ');
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
    const displayTypesForLog = formatFilterValues(filterConfig.displayType, filterConfig.displayTypes);
    const promotionTypeDetailsForLog = formatFilterValues(filterConfig.promotionTypeDetail, filterConfig.promotionTypeDetails);
    if (displayTypesForLog) {
        log('当前查询的 Display Type: ' + displayTypesForLog);
    }
    if (promotionTypeDetailsForLog) {
        log('当前查询的 Promotion Type Detail: ' + promotionTypeDetailsForLog);
    }
    log('查询的 Tab: ' + tabs.map((tab) => tab + ' (' + (tabNames[tab] || '未知') + ')').join(', '));
    log('是否为券类型: ' + (isVoucherType(promotionType) ? '是' : '否'));
    log('是否为促销码类型: ' + (isPromoCodeType(promotionType) ? '是' : '否'));
    log('请求 Header: ' + formatLaneHeadersForLog());
    log('当前国家: ' + countryCode);
    log('最终配置 - 国家: ' + countryCode + ', 域名: ' + baseDomain + ', oec_seller_id: ' + effectiveSellerId + ', seller_id: ' + effectiveSellerId);
    log('查询 Tab 并发数: ' + tabs.length);

    async function queryTabPromotions(tab) {
        const tabLogs = [];
        const tabLog = (message, type) => {
            tabLogs.push({ message, type });
        };

        tabLog('');
        tabLog('--- 查询 Tab ' + tab + ' (' + (tabNames[tab] || '未知') + ') ---');

        const refererUrl = buildRefererUrl(baseDomain, countryCode, tab, promotionType);
        const headers = buildHeaders(baseDomain, countryCode, refererUrl);

        const serverPromotions = [];
        let pageCount = 0;
        for (let pageIndex = 0; pageIndex < MAX_QUERY_PAGES; pageIndex++) {
            const requestBody = buildQueryRequestBody(tab, filterConfig, pageIndex);
            const response = await sendRuntimeMessage('fetchPromotions', {
                baseDomain,
                commonParams,
                headers,
                requestBody
            });

            if (!response.success || (response.apiCode && response.apiCode !== 0)) {
                tabLog('列表请求失败: ' + describeResponseError(response), 'error');
                tabLog('x-tt-logid: ' + (response?.logId || 'N/A'), 'error');
                break;
            }

            const pagePromotions = response.data.data?.promotions || [];
            pageCount++;
            tabLog('第 ' + (pageIndex + 1) + ' 页请求成功，返回 ' + pagePromotions.length + ' 个，x-tt-logid: ' + (response.logId || 'N/A'), 'success');
            serverPromotions.push(...pagePromotions);

            if (pagePromotions.length < QUERY_PAGE_SIZE) {
                break;
            }
        }

        const promotions = filterPromotionsByConfig(serverPromotions, filterConfig);
        const displayTypesDescription = formatFilterValues(filterConfig.displayType, filterConfig.displayTypes);
        const promotionTypeDetailsDescription = formatFilterValues(filterConfig.promotionTypeDetail, filterConfig.promotionTypeDetails);
        if (displayTypesDescription || promotionTypeDetailsDescription) {
            const filterDescription = [
                displayTypesDescription ? 'display_type in [' + displayTypesDescription + ']' : '',
                promotionTypeDetailsDescription ? 'promotion_type_detail in [' + promotionTypeDetailsDescription + ']' : ''
            ].filter(Boolean).join(' 或 ');
            tabLog('Tab ' + tab + ' 共查询 ' + pageCount + ' 页，服务端返回 ' + serverPromotions.length + ' 个，按 ' + filterDescription + ' 过滤后 ' + promotions.length + ' 个促销活动:');
            if (promotions.length === 0) {
                logPromotionTypeDistribution(serverPromotions, tabLog);
            }
        } else {
            tabLog('Tab ' + tab + ' 共查询 ' + pageCount + ' 页，找到 ' + promotions.length + ' 个促销活动:');
        }

        promotions.forEach((promotion, index) => {
            promotion.fromTab = tab;
            promotion.realPromotionType = promotion.promotion_type;
            tabLog('  ' + (index + 1) + '. ID: ' + promotion.id +
                ', 名称: ' + (promotion.name || 'N/A') +
                ', 状态: ' + (promotion.status || 'N/A') +
                ', 类型: ' + getPromotionDisplayName(promotion) +
                ', promotion_type: ' + (promotion.promotion_type || 'N/A') +
                ', display_type: ' + (promotion.display_type || 'N/A') +
                ', promotion_type_detail: ' + (promotion.promotion_type_detail || 'N/A') +
                ', Tab: ' + tab);
        });

        return {
            tab,
            promotions,
            logs: tabLogs
        };
    }

    const tabResults = await Promise.all(tabs.map((tab) => queryTabPromotions(tab)));
    tabResults.forEach((result) => {
        result.logs.forEach(({ message, type }) => {
            log(message, type);
        });
        collectedPromotions.push(...result.promotions);
    });

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
    const deleteResults = new Array(appState.allPromotions.length);

    log('');
    log('========================================');
    log('步骤2: 开始删除');
    log('========================================');
    log('待删除活动数: ' + appState.allPromotions.length);
    log('删除并发数: ' + Math.min(DELETE_CONCURRENCY, appState.allPromotions.length));
    log('请求 Header: ' + formatLaneHeadersForLog());

    let nextIndex = 0;

    async function deleteNextPromotion() {
        while (nextIndex < appState.allPromotions.length) {
            const index = nextIndex;
            nextIndex++;

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
                deleteResults[index] = result;

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

                deleteResults[index] = {
                    id: promotion.id,
                    name: promotion.name,
                    type: getPromotionDisplayName(promotion),
                    destroyType,
                    success: false,
                    error: deleteError.message
                };
                log('  [' + (index + 1) + '/' + appState.allPromotions.length + '] 删除' + destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - 失败: ' + deleteError.message, 'error');
            }
        }
    }

    const workers = Array.from(
        { length: Math.min(DELETE_CONCURRENCY, appState.allPromotions.length) },
        () => deleteNextPromotion()
    );
    await Promise.all(workers);

    const orderedResults = deleteResults.filter(Boolean);
    const successCount = orderedResults.filter((result) => result.success).length;
    const failCount = orderedResults.length - successCount;

    log('');
    log('========================================');
    log('删除完成');
    log('========================================');
    log('成功: ' + successCount + ', 失败: ' + failCount);

    if (failCount > 0) {
        const failedIds = orderedResults
            .filter((result) => !result.success)
            .map((result) => result.id || 'N/A')
            .join(', ');
        log('失败活动 ID: ' + failedIds, 'error');
    }

    clearPromotions();
    return orderedResults;
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
    log('请求 Header: ' + formatLaneHeadersForLog());

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
