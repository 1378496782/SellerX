async function main({ page, context, log, case_var_map, axios }) {
    try {
        log('========================================');
        log('  测试获取页面和 Cookie 信息');
        log('========================================\n');

        let cookies = '';
        let countryCode = '';
        let oecSellerId = '';
        let sellerId = '';

        // 1. 从 context 获取 cookies
        try {
            log('1. 尝试从 context 获取 cookies...');
            const cookieArray = await context?.cookies?.();
            
            if (cookieArray && Array.isArray(cookieArray)) {
                cookies = cookieArray.map(c => c.name + '=' + c.value).join('; ');
                log('✓ 成功获取到 ' + cookieArray.length + ' 个 cookies');

                log('\n--- Cookie 列表 ---');
                const cookieObj = {};
                cookieArray.forEach(c => {
                    cookieObj[c.name] = c.value;
                    log('  ' + c.name + ': ' + (c.value.length > 50 ? c.value.substring(0, 50) + '...' : c.value));
                });

                // 提取 seller_id
                if (cookieObj['oec_seller_id_unified_seller_env']) {
                    oecSellerId = cookieObj['oec_seller_id_unified_seller_env'];
                    log('\n✓ 找到 oec_seller_id: ' + oecSellerId);
                }
                if (cookieObj['global_seller_id_unified_seller_env']) {
                    sellerId = cookieObj['global_seller_id_unified_seller_env'];
                    log('✓ 找到 seller_id: ' + sellerId);
                }
            } else {
                log('✗ 没有获取到 cookies');
            }
        } catch (cookieError) {
            log('✗ 获取 cookies 出错: ' + cookieError.message);
        }

        // 2. 从页面获取 URL 信息
        try {
            log('\n2. 尝试获取页面 URL...');
            const currentUrl = page?.url() || '';
            log('当前页面 URL: ' + currentUrl);

            // 提取国家代码
            if (currentUrl) {
                const urlMatch = currentUrl.match(/seller-([a-z]{2})\.tiktok\.com/i);
                if (urlMatch) {
                    countryCode = urlMatch[1].toUpperCase();
                    log('✓ 从域名提取国家代码: ' + countryCode);
                }

                // 从 URL 参数提取
                const urlParams = new URLSearchParams(currentUrl.split('?')[1] || '');
                const shopRegion = urlParams.get('shop_region');
                if (shopRegion) {
                    countryCode = shopRegion.toUpperCase();
                    log('✓ 从 shop_region 参数提取: ' + countryCode);
                }
            }
        } catch (pageError) {
            log('✗ 获取页面 URL 出错: ' + pageError.message);
        }

        // 3. 显示实际获取到的值（不设置默认值）
        log('\n========================================');
        log('  实际获取的配置信息（无默认值）');
        log('========================================');
        log('国家代码 (countryCode): ' + (countryCode || '(未获取到)'));
        log('oec_seller_id: ' + (oecSellerId || '(未获取到)'));
        log('seller_id: ' + (sellerId || '(未获取到)'));
        
        if (countryCode) {
            const baseDomain = 'seller-' + countryCode.toLowerCase() + '.tiktok.com';
            log('基础域名 (baseDomain): ' + baseDomain);
        }
        log('========================================');

        return {
            success: true,
            data: {
                countryCode,
                oecSellerId,
                sellerId,
                hasCookies: !!cookies,
                hasCountryCode: !!countryCode,
                hasSellerId: !!(oecSellerId || sellerId)
            }
        };

    } catch (error) {
        log('Error: ' + error.message);
        log('Stack: ' + error.stack);
        return {
            success: false,
            message: error.message
        };
    }
}

module.exports = { main };
