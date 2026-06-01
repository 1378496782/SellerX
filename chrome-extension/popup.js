import { cacheDom, canDeleteSelectedStatus, getSelectedPromotionFilter, getSelectedTabs, hideLogPanel, hideResult, renderCurrentVersion, renderPromotionList, renderShopInfo, renderVersion, setDeleteButtonEnabled, setUpdateButtonLoading, setupEventListeners, showDeleteResult, showLoading } from './src/dom.js';
import { log } from './src/logger.js';
import { getCookies, getCurrentPageInfo, getSellerInfoFromApi } from './src/seller-service.js';
import { appState } from './src/state.js';
import { canRunPromotionAction, deletePromotions as deletePromotionRecords, queryPromotions as queryPromotionRecords } from './src/promotion-service.js';

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

        alert(`当前版本: ${currentVersion}\n\n如需更新，请访问 GitHub Releases 页面。\n\n注意：Chrome 扩展的自动更新需要：\n1. 将扩展打包并签名\n2. 配置正确的 update_url\n3. 发布到 GitHub Releases`);
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

        renderPromotionList(promotions);
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
        onFilterChange: handleFilterChange
    });
});
