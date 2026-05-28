async function main({ page, context, log, case_var_map, axios }) {
    try {
        // ========================================
        // 配置区域 - 请在此处修改要删除的活动类型
        // ========================================
        const promotionType = case_var_map?.promotion_type || 6;
        const tabs = case_var_map?.tabs || [2, 3];

        // 活动类型说明
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

        // tab 说明
        const tabNames = {
            2: 'Ongoing (进行中)',
            3: 'Upcoming (即将开始)'
        };

        // ========================================
        // 从页面和 context 自动获取信息
        // ========================================
        let cookies = '';
        let countryCode = case_var_map?.country_code || '';
        let oecSellerId = case_var_map?.oec_seller_id || '';
        let sellerId = case_var_map?.seller_id || '';

        try {
            // 1. 从 context 获取 cookies
            const cookieArray = await context?.cookies?.();
            if (cookieArray && Array.isArray(cookieArray)) {
                cookies = cookieArray.map(c => c.name + '=' + c.value).join('; ');
                log('✓ 成功从 context 获取到 ' + cookieArray.length + ' 个 cookies');

                // 2. 从 cookies 中提取信息
                const cookieObj = {};
                cookieArray.forEach(c => {
                    cookieObj[c.name] = c.value;
                });

                // 从 cookie 中获取 seller_id（如果没有通过 case_var_map 传入）
                if (cookieObj['oec_seller_id_unified_seller_env'] && !oecSellerId) {
                    oecSellerId = cookieObj['oec_seller_id_unified_seller_env'];
                    log('✓ 从 cookie 获取 oec_seller_id: ' + oecSellerId);
                }
                if (cookieObj['global_seller_id_unified_seller_env'] && !sellerId) {
                    sellerId = cookieObj['global_seller_id_unified_seller_env'];
                    log('✓ 从 cookie 获取 seller_id: ' + sellerId);
                }
            }
        } catch (cookieError) {
            log('获取 cookies 失败: ' + cookieError.message);
        }

        try {
            // 3. 从页面 URL 中提取信息
            const currentUrl = page?.url() || '';
            log('当前页面 URL: ' + currentUrl);

            // 从 URL 中提取国家代码（如果没有通过 case_var_map 传入）
            if (!countryCode && currentUrl) {
                const urlMatch = currentUrl.match(/seller-([a-z]{2})\.tiktok\.com/i);
                if (urlMatch) {
                    countryCode = urlMatch[1].toUpperCase();
                    log('✓ 从 URL 获取国家代码: ' + countryCode);
                }
            }
        } catch (pageError) {
            log('从页面获取信息失败: ' + pageError.message);
        }

        // 验证是否获取到必需信息
        if (!countryCode) {
            log('✗ 错误: 未能获取到国家代码 (countryCode)');
            return {
                success: false,
                message: '未能获取到国家代码，请确保在 TikTok Seller 页面上运行此脚本'
            };
        }
        if (!oecSellerId && !sellerId) {
            log('✗ 错误: 未能获取到 seller_id');
            return {
                success: false,
                message: '未能获取到店铺 ID，请确保已登录 TikTok Seller'
            };
        }
        if (!oecSellerId) oecSellerId = sellerId;
        if (!sellerId) sellerId = oecSellerId;

        const baseDomain = 'seller-' + countryCode.toLowerCase() + '.tiktok.com';
        log('最终配置 - 国家: ' + countryCode + ', oec_seller_id: ' + oecSellerId + ', seller_id: ' + sellerId);

        // ========================================
        // 辅助函数
        // ========================================
        // 判断是否是优惠券类型
        const isVoucherType = (type) => type === 2;

        // 判断是否是促销码类型
        const isPromoCodeType = (type) => type === 9 || type === 17;

        // 根据活动类型获取 DisplayType
        const getDisplayType = (pType) => {
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
            return displayTypeMap[pType] || 1;
        };

        // 构建通用参数
        const commonParams = '?locale=en&language=en&oec_seller_id=' + oecSellerId + '&seller_id=' + sellerId + '&aid=4068&app_name=i18n_ecom_shop&fp=verify_mpkwurf6_N8rsXglq_2X88_4Tt8_93Qx_Gp2kBFbZQ5r9&device_platform=web&cookie_enabled=true&screen_width=2560&screen_height=1440&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F148.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai';

        // 获取删除接口URL
        const getDestroyUrl = (type) => {
            const baseUrl = 'https://' + baseDomain;

            if (isVoucherType(type)) {
                return baseUrl + '/api/v1/promotion/voucher/destroy' + commonParams;
            } else if (isPromoCodeType(type)) {
                return baseUrl + '/api/v1/promotion/promo_code/delete' + commonParams;
            }
            return baseUrl + '/api/v1/promotion/destroy' + commonParams;
        };

        // 获取删除请求体
        const getDestroyRequestBody = (type, id) => {
            if (isVoucherType(type)) {
                return { voucher_type_id: id };
            } else if (isPromoCodeType(type)) {
                return { promo_code_id: id };
            }
            return { promotion_id: id };
        };

        // ========================================
        // 执行逻辑
        // ========================================
        log('当前查询的活动类型: ' + (promotionType ? promotionType + ' (' + (promotionTypeNames[promotionType] || '未知类型') + ')' : '所有类型'));
        log('查询的 Tab: ' + tabs.map(t => t + ' (' + (tabNames[t] || '未知') + ')').join(', '));
        log('是否为券类型: ' + (isVoucherType(promotionType) ? '是' : '否'));
        log('是否为促销码类型: ' + (isPromoCodeType(promotionType) ? '是' : '否'));
        log('当前国家: ' + countryCode);

        const listUrl = 'https://' + baseDomain + '/api/v1/promotion/list' + commonParams;

        // 动态设置 referer
        const refererUrl = (tab) => {
            if (promotionType) {
                return 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + tab + '&shop_region=' + countryCode + '&promotion_type=' + promotionType;
            }
            return 'https://' + baseDomain + '/promotion/marketing-tools/management?tab=' + tab + '&shop_region=' + countryCode;
        };

        const headers = {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,th;q=0.7',
            'content-type': 'application/json',
            'origin': 'https://' + baseDomain,
            'priority': 'u=1, i',
            'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'x-tt-oec-region': countryCode
        };

        headers['cookie'] = cookies;

        log('========================================');
        log('  步骤1: 获取促销活动列表');
        log('========================================');

        // 存储所有 tab 的促销活动
        let allPromotions = [];

        // 为每个 tab 查询
        for (const tab of tabs) {
            log('\n--- 查询 Tab ' + tab + ' (' + (tabNames[tab] || '未知') + ') ---');

            // 更新 referer
            headers['referer'] = refererUrl(tab);

            // 构建请求体
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

            const listResponse = await axios.post(listUrl, requestBody, { headers });

            log('列表请求状态: ' + listResponse.status);
            log('x-tt-logid: ' + (listResponse.headers['x-tt-logid'] || 'N/A'));
            const promotions = listResponse.data.data?.promotions || [];
            log('Tab ' + tab + ' 找到 ' + promotions.length + ' 个促销活动:');

            promotions.forEach((p, idx) => {
                p.fromTab = tab;
                p.realPromotionType = p.promotion_type;
                allPromotions.push(p);
                log('  ' + (idx + 1) + '. ID: ' + p.id + ', 名称: ' + (p.name || 'N/A') + ', 状态: ' + (p.status || 'N/A') + ', 类型: ' + (p.promotion_type || 'N/A') + '(' + (promotionTypeNames[p.promotion_type] || '未知') + '), Tab: ' + tab);
            });
        }

        log('\n========================================');
        log('  共找到 ' + allPromotions.length + ' 个促销活动 (Tab ' + tabs.join(', ') + ')');
        log('========================================');

        if (allPromotions.length === 0) {
            return {
                success: true,
                message: '没有找到任何促销活动',
                totalCount: 0,
                promotions: [],
                deleteResults: [],
                successCount: 0,
                failCount: 0
            };
        }

        // 步骤2: 开始删除
        log('\n========================================');
        log('  步骤2: 开始删除');
        log('========================================');

        const deleteResults = [];
        for (let i = 0; i < allPromotions.length; i++) {
            const promotion = allPromotions[i];
            const actualType = promotion.realPromotionType || promotionType;

            try {
                const destroyUrl = getDestroyUrl(actualType);
                const destroyRequestBody = getDestroyRequestBody(actualType, promotion.id);
                let destroyType = '活动';
                if (isVoucherType(actualType)) {
                    destroyType = '券';
                } else if (isPromoCodeType(actualType)) {
                    destroyType = '促销码';
                }

                headers['referer'] = refererUrl(promotion.fromTab);

                const deleteResponse = await axios.post(destroyUrl, destroyRequestBody, { headers });

                const isSuccess = deleteResponse.data.code === 0;
                const logId = deleteResponse.headers['x-tt-logid'] || 'N/A';

                deleteResults.push({
                    id: promotion.id,
                    name: promotion.name,
                    type: destroyType,
                    success: isSuccess,
                    status: deleteResponse.data,
                    logId: logId
                });

                log('  [' + (i + 1) + '/' + allPromotions.length + '] 删除' + destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - ' + (isSuccess ? '成功' : '失败') + ', logid: ' + logId);

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
                log('  [' + (i + 1) + '/' + allPromotions.length + '] 删除' + destroyType + ' ID: ' + promotion.id + ', 名称: ' + promotion.name + ' - 失败: ' + deleteError.message);
            }
        }

        const successCount = deleteResults.filter(r => r.success).length;
        const failCount = deleteResults.length - successCount;

        log('\n========================================');
        log('  删除完成');
        log('========================================');
        log('成功: ' + successCount + ', 失败: ' + failCount);

        return {
            success: true,
            message: '删除操作完成',
            totalCount: allPromotions.length,
            promotions: allPromotions.map(p => ({
                id: p.id,
                name: p.name,
                status: p.status,
                promotion_type: p.promotion_type,
                fromTab: p.fromTab
            })),
            deleteResults: deleteResults,
            successCount: successCount,
            failCount: failCount
        };

    } catch (error) {
        log('Error: ' + error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

module.exports = { main };
