async function main({ page, context, log, case_var_map, axios }) {
    try {
        // 从 case_var_map 中读取参数
        const promotionType = case_var_map?.promotion_type;
        const tabs = case_var_map?.tabs || [2, 3]; // 默认查询 tab=2 和 tab=3
        const dryRun = case_var_map?.dryRun !== false; // 默认为 true，模拟模式

        // 活动类型说明
        const promotionTypeNames = {
            1: '平台券',
            2: '商家券',
            3: '运费折扣',
            4: '商品折扣',
            5: '限时闪购',
            6: '赠品活动',
            7: '多买多省',
            8: '套装优惠',
            9: '促销码'
        };

        // tab 说明
        const tabNames = {
            2: 'Ongoing (进行中)',
            3: 'Upcoming (即将开始)'
        };

        log(`当前查询的活动类型: ${promotionType ? `${promotionType} (${promotionTypeNames[promotionType] || '未知类型'})` : '所有类型'}`);
        log(`查询的 Tab: ${tabs.map(t => `${t} (${tabNames[t] || '未知'})`).join(', ')}`);

        const listUrl = 'https://seller-mx.tiktok.com/api/v1/promotion/list?locale=en&language=en&oec_seller_id=7494213735454640124&seller_id=7494213735454640124&aid=4068&app_name=i18n_ecom_shop&fp=verify_mpkwurf6_N8rsXglq_2X88_4Tt8_93Qx_Gp2kBFbZQ5r9&device_platform=web&cookie_enabled=true&screen_width=2560&screen_height=1440&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F148.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai';

        const destroyUrl = 'https://seller-mx.tiktok.com/api/v2/promotion/destroy?locale=en&language=en&oec_seller_id=7494213735454640124&seller_id=7494213735454640124&aid=4068&app_name=i18n_ecom_shop&fp=verify_mpkwurf6_N8rsXglq_2X88_4Tt8_93Qx_Gp2kBFbZQ5r9&device_platform=web&cookie_enabled=true&screen_width=2560&screen_height=1440&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F148.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai';

        // 动态设置 referer
        const refererUrl = (tab) => {
            if (promotionType) {
                return `https://seller-mx.tiktok.com/promotion/marketing-tools/management?tab=${tab}&shop_region=MX&promotion_type=${promotionType}`;
            }
            return `https://seller-mx.tiktok.com/promotion/marketing-tools/management?tab=${tab}&shop_region=MX`;
        };

        const headers = {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,th;q=0.7',
            'content-type': 'application/json',
            'origin': 'https://seller-mx.tiktok.com',
            'priority': 'u=1, i',
            'referer': refererUrl,
            'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'x-tt-oec-region': 'MX'
        };

        const cookies = 'FPID=FPID2.2.tu1BPj3ub5tlaerSH1HBteZniikxckWtZroAdVYCcO8%3D.1779438194; FPAU=1.2.1638884190.1779438194; _fbp=fb.1.1754300054577.1990762101; _ttp=3DiJKZgVOaMhgh6FMvwAVRcLI0z.tt.1; _gtmeec=e30%3D; _tt_enable_cookie=1; _m4b_theme_=new; tt_ticket_guard_client_web_domain=2; passport_csrf_token=68f5dbbfee14654da2d3835e712ed15e; passport_csrf_token_default=68f5dbbfee14654da2d3835e712ed15e; _ga=GA1.1.1435992999.1779438202; s_v_web_id=verify_mpkwurf6_N8rsXglq_2X88_4Tt8_93Qx_Gp2kBFbZQ5r9; _tt_ticket_crypt_doamin=2; gs_seller_type_for_report=pop; goofy_grayscale_uid=a21572efeefdea407a4f5e5ac734e849; test_flag=1; ATLAS_LANG=en; i18next=en; gd_random=eyJtYXRjaCI6ZmFsc2UsInBlcmNlbnQiOjAuOTc3MDAyNDY0NTEzNTk4Mn0=.T7Dywc/gxSKz1J415QW2FSuoU0XSzYpgbCilVqPDG/U=; app_id_unified_seller_env=4068; d_ticket_ads=5668b8f9dba9950c2ad203f05f54e064d1ab7; passport_auth_status_ads=4979bfa5fc06c150f1e3564e6dc5dd19%2Ce0f16939f12fb92dab56f46b2130ddf3; passport_auth_status_ss_ads=4979bfa5fc06c150f1e3564e6dc5dd19%2Ce0f16939f12fb92dab56f46b2130ddf3; sso_auth_status_ads=ed837d7024305e31142fc523f494916f; sso_auth_status_ss_ads=ed837d7024305e31142fc523f494916f; sso_uid_tt_ads=0cf7ac648d1c8428a53c1dd4c5ac90596c02022d0f5b0396ad49b44514314839; sso_uid_tt_ss_ads=0cf7ac648d1c8428a53c1dd4c5ac90596c02022d0f5b0396ad49b44514314839; sso_user_ads=9bee88368c688e630ffdbe248a4ba2e7; sso_user_ss_ads=9bee88368c688e630ffdbe248a4ba2e7; sid_ucp_sso_v1_ads=1.0.1-KDdkMGZlOGZjYjRhNDljMDVjMWQ3NjhkZTgzY2M3N2ZmMWFmMDQ0YmUKGgi4iJGqwP-h_GgQgsTb0AYY5B84AkDxB0gGEAMaAm15IiA5YmVlODgzNjhjNjg4ZTYzMGZmZGJlMjQ4YTRiYTJlNzJOCiCJsjUaSUryxkAVi_on-mOiWLSQSfqkk2Dja1Sbk1iAvBIg6akTcZcKPPsHVRTn4L38LA2ZNhpU_k1Kgr5nPc_jjO0YASIGdGlrdG9r; ssid_ucp_sso_v1_ads=1.0.1-KDdkMGZlOGZjYjRhNDljMDVjMWQ3NjhkZTgzY2M3N2ZmMWFmMDQ0YmUKGgi4iJGqwP-h_GgQgsTb0AYY5B84AkDxB0gGEAMaAm15IiA5YmVlODgzNjhjNjg4ZTYzMGZmZGJlMjQ4YTRiYTJlNzJOCiCJsjUaSUryxkAVi_on-mOiWLSQSfqkk2Dja1Sbk1iAvBIg6akTcZcKPPsHVRTn4L38LA2ZNhpU_k1Kgr5nPc_jjO0YASIGdGlrdG9r; FPLC=s2IFzJZHlkHt68kcRbg0pjg43ijng31dMUEVTEzmKajha9ExLqiaFg%2F%2Fnx1rNY%2FnZQgsb32iBHNE6F6mR%2FzNsXslsrJjYD3Oz9aDq%2BeE3nP%2FCl6Lxyavwr6WuzUHxQ%3D%3D; uid_tt_tiktokseller=6126ed6ae2a4af4dd55a770b87d34911418e0bc2e7f2bd8dcb143f68d246f303; uid_tt_ss_tiktokseller=6126ed6ae2a4af4dd55a770b87d34911418e0bc2e7f2bd8dcb143f68d246f303; sid_tt_tiktokseller=7c0347f71f0496f8b6e1dd835846c528; sessionid_tiktokseller=7c0347f71f0496f8b6e1dd835846c528; sessionid_ss_tiktokseller=7c0347f71f0496f8b6e1dd835846c528; global_seller_id_unified_seller_env=7494213735454640124; oec_seller_id_unified_seller_env=7494213735454640124; sid_guard_tiktokseller=7c0347f71f0496f8b6e1dd835846c528%7C1779884550%7C259196%7CSat%2C+30-May-2026+12%3A22%3A26+GMT; tt_session_tlb_tag_tiktokseller=sttt%7C4%7CfANH9x8Elvi24d2DWEbFKP________-_ZEDs2UxMGVVKDgZluAlm8L8FD3wU0IqJ8a8_fnOeztk%3D; sid_ucp_v1_tiktokseller=1.0.1-KDg1NzdiOGQ0NzkwM2E5OWE4MGQwZDEzNmJhY2VkZTc2ZGM1YTBmYWYKHAi4iJGqwP-h_GgQhsTb0AYY5B8gDDgCQPEHSAQQAxoCbXkiIDdjMDM0N2Y3MWYwNDk2ZjhiNmUxZGQ4MzU4NDZjNTI4Mk4KIHIatUuOoshN_42gDB4vC8Gee-D945XRStyh0lu1ZlbfEiBmZy8oaecUx7kWGQHi3bsnDp-vd9RlpITQCurJwvcT1hgEIgZ0aWt0b2s; ssid_ucp_v1_tiktokseller=1.0.1-KDg1NzdiOGQ0NzkwM2E5OWE4MGQwZDEzNmJhY2VkZTc2ZGM1YTBmYWYKHAi4iJGqwP-h_GgQhsTb0AYY5B8gDDgCQPEHSAQQAxoCbXkiIDdjMDM0N2Y3MWYwNDk2ZjhiNmUxZGQ4MzU4NDZjNTI4Mk4KIHIatUuOoshN_42gDB4vC8Gee-D945XRStyh0lu1ZlbfEiBmZy8oaecUx7kWGQHi3bsnDp-vd9RlpITQCurJwvcT1hgEIgZ0aWt0b2s; SELLER_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOjc1NjM5NDUwOTA2NTg2MTYzNzYsIk9lY1VpZCI6NzQ5NDIxMzczNTQ1NDY0MDEyNCwiT2VjU2hvcElkIjo3NDk0MjEzNzM1NDU0NjQwMTI0LCJTaG9wUmVnaW9uIjoiIiwiR2xvYmFsU2VsbGVySWQiOjc0OTQyMTM3MzU0NTQ2NDAxMjQsIlNlbGxlcklkIjo3NDk0MjEzNzM1NDU0NjQwMTI0LCJleHAiOjE3Nzk5NzA5NTEsIm5iZiI6MTc3OTg4MzU1MX0.aZg7dIvpkDKWR4EsGqzCNb5pAdgkFCavB3BCc_OKTcE; SHOP_ID=7563948720300115713; UNIFIED_SELLER_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOjc1NjM5NDUwOTA2NTg2MTYzNzYsIkdsb2JhbFNlbGxlck1hcCI6eyI3NDk0MjEzNzM1NDU0NjQwMTI0Ijp7IlNlbGxlcnMiOlt7IlNlbGxlcklEIjo3NDk0MjEzNzM1NDU0NjQwMTI0LCJJTVNob3BJRCI6NzU2Mzk0ODcyMDMwMDExNTcxMywiSU1DdXN0b21lclNlcnZpY2VJRCI6NzU2Mzk0ODcyOTEzNzQzMjMyMSwiU2hvcFJlZ2lvbiI6Ik1YIiwiSXNBY3Jvc3MiOmZhbHNlfV19fSwiZXhwIjoxNzc5OTcwOTUxLCJuYmYiOjE3Nzk4ODM1NTF9.ZJKa-mUtU6OiF61Mk1FBAdd4hh-DOXg8NB5LBxvwGuQ; oec_lucifer=AQEBAH0/3K65KYkeT4SPED5vXx/vNshHWFsKv+CDKt6SvFMJJGpGk0ORRJSVuhpvouset1eVm62jfwjEUOPqsvHGmAutS7R8YA==; passport_fe_beating_status=false; ttcsid_CMSS13RC77U1PJEFQUB0=1779948606778::4IA8sPQ3XpYsz-XftsX2.4.1779948687306.1; ttcsid=1779948606778::_OgCeet0jeMWQPhnv_YO.4.1779948687306.0::1.80408.27220::79314.16.1296.1731::80525.29.0; _ga_BZBQ2QHQSP=GS2.1.s1779948577$o6$g1$t1779948687$j10$l0$h1148160149; ttwid=1%7C13Id7nswe6irgMDow5bJP498JmEBaTwG8xgpa8glI-w%7C1779949847%7C3a28a60a04a2e2a4d2ce5a38cb79f7113e0cac8b7bc69f38d2f0f32c2083329e; tt_ticket_guard_client_data=eyJ0dC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwidHQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJ0dC10aWNrZXQtZ3VhcmQtcHVibGljLWtleSI6IkJJdnU3NnMyQjhqc045RWNsQ1Brc0FMMS9jeTdsL2x3VldhdVpEVHgwZlFJMWNMaG9WSzhqTGtoMzJHK3VjM0FEVjduQVVFdno4czZrS0R4cnYrWGtxUT0iLCJ0dC10aWNrZXQtZ3VhcmQtd2ViLXZlcnNpb24iOjF9; odin_tt=ef248273589312e04d9fc20f919fcc642645f8126297fb664e58419473e41feeae5d02becf95e11812e601fd3d13700855717506783287e0017958f82a2aef8d; msToken=j4tlYuYhMFvGVWaGDzaobIhCZoSAJ3c29ZehCMp-excUEUWHnIc3ud1UO5ecHkyDtvvvGJ-lH8l9SjDsFpQQURvLCP645aPsuoCr8OhQIom1paXuf28Tih-0-cy_nKcf80MmZwY=; msToken=j4tlYuYhMFvGVWaGDzaobIhCZoSAJ3c29ZehCMp-excUEUWHnIc3ud1UO5ecHkyDtvvvGJ-lH8l9SjDsFpQQURvLCP645aPsuoCr8OhQIom1paXuf28Tih-0-cy_nKcf80MmZwY=; user_oec_info=0a534864a7ecdd7c3bab9d0972ec9b676ae439c407a15d8e4187b105fb183b164f3f1bcb2d3b46c16c690cd9815f0db2d1b60eefb3e49ad8951840b054bef7344efdde38350ea2159cb3cdd812b105bae7f6c472091a490a3c0000000000000000000050798c2bd52040043adf62825d5a41738a5f4e23fc7c21584029a4b4d01e07b92ed537ddb2a6b75038ed214f13c3b473475310add2920e1886d2f6f20d220104224c2d1f';

        headers['cookie'] = cookies;

        log('=== 步骤1: 获取促销活动列表 ===');

        // 存储所有 tab 的促销活动
        let allPromotions = [];

        // 为每个 tab 查询
        for (const tab of tabs) {
            log(`\n--- 查询 Tab ${tab} (${tabNames[tab] || '未知'}) ---`);

            // 更新 referer
            headers['referer'] = refererUrl(tab);

            // 构建请求体 - 根据 tab 设置不同的参数
            const requestBody = {
                index: 0,
                size: 50,
                display_type: 5,
                diagnosis_type: 1
            };

            // 如果指定了 promotion_type，则添加到请求体
            if (promotionType) {
                requestBody.promotion_type = promotionType;
            }

            // 根据 tab 设置 status 参数
            if (tab === 2) {
                // tab=2 (Ongoing - 进行中)
                requestBody.status = 2;
            } else if (tab === 3) {
                // tab=3 (Upcoming - 即将开始)
                requestBody.status = 3;
            }

            const listResponse = await axios.post(listUrl, requestBody, { headers });

            log(`列表请求状态: ${listResponse.status}`);
            log(`x-tt-logid: ${listResponse.headers['x-tt-logid'] || 'N/A'}`);
            const promotions = listResponse.data.data?.promotions || [];
            log(`Tab ${tab} 找到 ${promotions.length} 个促销活动:`);

            promotions.forEach((p, idx) => {
                // 为每个活动添加来源 tab 信息
                p.fromTab = tab;
                allPromotions.push(p);
                log(`  ${idx + 1}. ID: ${p.id}, 名称: ${p.name || 'N/A'}, 状态: ${p.status || 'N/A'}, 类型: ${p.promotion_type || 'N/A'}, Tab: ${tab}`);
            });
        }

        log(`\n=== 共找到 ${allPromotions.length} 个促销活动 (Tab ${tabs.join(', ')}) ===`);

        // 步骤2: 收集所有活动的ID到数组
        const promotionIds = allPromotions.map(p => p.id);
        log(`\n=== 步骤2: 收集到 ${promotionIds.length} 个活动ID，开始删除...`);
        if (dryRun) {
            log(`  [DRY RUN 模式] 不会真的删除活动`);
        }

        // 步骤3: 依次删除活动
        const deleteResults = [];
        for (let i = 0; i < allPromotions.length; i++) {
            const promotion = allPromotions[i];

            if (dryRun) {
                // 模拟删除
                deleteResults.push({
                    id: promotion.id,
                    name: promotion.name,
                    success: true,
                    dryRun: true
                });
                log(`  [${i + 1}/${allPromotions.length}] [模拟] 删除活动 ID: ${promotion.id}, 名称: ${promotion.name} - 成功`);
            } else {
                // 真的删除
                try {
                    const destroyRequestBody = {
                        promotion_id: promotion.id
                    };

                    // 设置正确的 referer
                    headers['referer'] = refererUrl(promotion.fromTab);

                    const deleteResponse = await axios.post(destroyUrl, destroyRequestBody, { headers });

                    const isSuccess = deleteResponse.data.code === 0;
                    const logId = deleteResponse.headers['x-tt-logid'] || 'N/A';

                    deleteResults.push({
                        id: promotion.id,
                        name: promotion.name,
                        success: isSuccess,
                        status: deleteResponse.data,
                        logId: logId
                    });

                    log(`  [${i + 1}/${allPromotions.length}] 删除活动 ID: ${promotion.id}, 名称: ${promotion.name} - ${isSuccess ? '成功' : '失败'}, logid: ${logId}`);

                } catch (deleteError) {
                    deleteResults.push({
                        id: promotion.id,
                        name: promotion.name,
                        success: false,
                        error: deleteError.message
                    });
                    log(`  [${i + 1}/${allPromotions.length}] 删除活动 ID: ${promotion.id}, 名称: ${promotion.name} - 失败: ${deleteError.message}`);
                }
            }
        }

        // 统计删除结果
        const successCount = deleteResults.filter(r => r.success).length;
        const failCount = deleteResults.length - successCount;

        log(`\n=== 删除完成 ===`);
        log(`成功: ${successCount}, 失败: ${failCount}`);

        return {
            success: true,
            message: `删除操作完成`,
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
        log(`Error: ${error.message}`);
        return {
            success: false,
            message: error.message
        };
    }
}

module.exports = { main };