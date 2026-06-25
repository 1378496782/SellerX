import { cacheDom, canDeleteSelectedStatus, getLaneHeaderInputValues, getSelectedPromotionFilter, getSelectedTabs, hideLogPanel, hideResult, renderCurrentVersion, renderLaneHeaders, renderPromotionList, renderShopInfo, renderVersion, setDeleteButtonEnabled, setUpdateButtonLoading, setupEventListeners, showDeleteResult, showLoading } from './src/dom.js';
import { log } from './src/logger.js';
import { clearManualLaneHeaders, getCookies, getCurrentPageInfo, getLaneHeaders, getSellerInfoFromApi, saveManualLaneHeaders } from './src/seller-service.js';
import { appState, setPromotions } from './src/state.js';
import { canRunPromotionAction, deletePromotions as deletePromotionRecords, deleteSinglePromotion as deleteSinglePromotionRecord, queryPromotions as queryPromotionRecords } from './src/promotion-service.js';
import { CHROME_WEB_STORE_URL } from './src/config.js';

async function init() {
    showLoading(true);

    try {
        hideLogPanel();

        const manifest = chrome.runtime.getManifest();
        renderVersion(manifest.version);

        log('--- 尝试通过 API 获取 ---', 'info');
        await getSellerInfoFromApi(log);

        log('--- 获取 Cookie（用于后续请求） ---', 'info');
        await getCookies(log);

        log('--- 获取泳道 Header（用于后续请求） ---', 'info');
        const laneResult = await getLaneHeaders(log);
        renderLaneHeaders(laneResult.rows || laneResult.headers, laneResult.source);

        if (!appState.oecSellerId || !appState.countryCode) {
            log('--- 补充获取信息（API 未完全获取） ---', 'info');
            await getCurrentPageInfo(log);
        }

        renderShopInfo(appState);

        if (!canRunPromotionAction()) {
            log('警告: 未能获取到所有必要信息', 'warning');
            log('countryCode: ' + appState.countryCode, 'warning');
            log('oecSellerId: ' + appState.oecSellerId, 'warning');
            log('sellerId: ' + appState.sellerId, 'warning');
        } else {
            log('初始化完成', 'success');
        }
    } catch (error) {
        log('初始化失败: ' + error.message, 'error');
        console.error('初始化失败:', error);
    }

    showLoading(false);
}

async function checkForUpdates() {
    setUpdateButtonLoading(true);

    try {
        const manifest = chrome.runtime.getManifest();
        const currentVersion = manifest.version;
        renderCurrentVersion(currentVersion);

        const shouldOpenStore = confirm(
            `当前版本: ${currentVersion}\n\n` +
            '如果你是通过 Chrome Web Store 安装的 SellerX，后续版本会由 Chrome 自动更新，不需要手动下载新包。\n\n' +
            'Chrome 自动更新不是实时触发，可能会有一定延迟。也可以打开 Chrome Web Store 页面确认当前商店版本。\n\n' +
            '是否现在打开 SellerX 的 Chrome Web Store 页面？'
        );

        if (shouldOpenStore) {
            chrome.tabs.create({ url: CHROME_WEB_STORE_URL });
        }
    } catch (error) {
        log('检查更新失败: ' + error.message, 'error');
        console.error('检查更新失败:', error);
        alert('检查更新失败: ' + error.message);
    }

    setUpdateButtonLoading(false);
}

async function queryPromotions() {
    if (!canRunPromotionAction()) {
        log('错误: 请确保已登录 TikTok Seller 并在促销活动页面', 'error');
        alert('请确保已登录 TikTok Seller 并在促销活动页面');
        return;
    }

    showLoading(true);
    hideResult();

    try {
        const promotions = await queryPromotionRecords({
            promotionFilter: getSelectedPromotionFilter(),
            tabs: getSelectedTabs(),
            log
        });

        renderPromotionList(promotions, {
            onDeletePromotion: deleteSinglePromotion
        });
        setDeleteButtonEnabled(promotions.length > 0 && canDeleteSelectedStatus());
    } catch (error) {
        log('查询失败: ' + error.message, 'error');
        console.error('查询失败:', error);
        alert('查询失败: ' + error.message);
    }

    showLoading(false);
}

async function deletePromotions() {
    if (!canDeleteSelectedStatus()) {
        log('当前状态不支持删除，请切换到 Ongoing 或 Upcoming 后重新查询', 'warning');
        return;
    }

    if (appState.allPromotions.length === 0) {
        log('没有可删除的活动', 'warning');
        return;
    }

    showLoading(true);

    try {
        const results = await deletePromotionRecords({
            promotionFilter: getSelectedPromotionFilter(),
            log
        });

        showDeleteResult(results);
        renderPromotionList(appState.allPromotions);
        setDeleteButtonEnabled(false);
    } catch (error) {
        log('删除失败: ' + error.message, 'error');
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
    }

    showLoading(false);
}

async function deleteSinglePromotion(promotion, button) {
    const originalText = button?.textContent || '删除';

    if (button) {
        button.disabled = true;
        button.textContent = '删除中';
    }

    try {
        const result = await deleteSinglePromotionRecord({
            promotion,
            promotionFilter: getSelectedPromotionFilter(),
            log
        });

        showDeleteResult([result]);

        if (result.success) {
            setPromotions(appState.allPromotions.filter((item) => item.id !== promotion.id));
            renderPromotionList(appState.allPromotions, {
                onDeletePromotion: deleteSinglePromotion
            });
            setDeleteButtonEnabled(appState.allPromotions.length > 0 && canDeleteSelectedStatus());
        } else if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    } catch (error) {
        log('单条删除失败: ' + error.message, 'error');
        console.error('单条删除失败:', error);
        alert('单条删除失败: ' + error.message);

        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

async function saveLaneHeaders() {
    const result = await saveManualLaneHeaders(getLaneHeaderInputValues(), log);
    renderLaneHeaders(result.rows || result.headers, '手动');
}

async function clearLaneHeaders() {
    await clearManualLaneHeaders(log);
    renderLaneHeaders({}, '');
}

function handleFilterChange() {
    setDeleteButtonEnabled(false);
}

document.addEventListener('DOMContentLoaded', async () => {
    cacheDom();
    await init();
    setupEventListeners({
        onQuery: queryPromotions,
        onDelete: deletePromotions,
        onCheckUpdate: checkForUpdates,
        onFilterChange: handleFilterChange,
        onSaveLaneHeaders: saveLaneHeaders,
        onClearLaneHeaders: clearLaneHeaders
    });
});
