import { promotionTypeNames, tabNames } from './config.js';

export const dom = {};

export function cacheDom() {
    dom.versionInfo = document.getElementById('versionInfo');
    dom.shopName = document.getElementById('shopName');
    dom.shopCode = document.getElementById('shopCode');
    dom.countryCode = document.getElementById('countryCode');
    dom.sellerId = document.getElementById('sellerId');
    dom.queryBtn = document.getElementById('queryBtn');
    dom.deleteBtn = document.getElementById('deleteBtn');
    dom.checkUpdateBtn = document.getElementById('checkUpdateBtn');
    dom.toggleRightPanelBtn = document.getElementById('toggleRightPanelBtn');
    dom.rightColumn = document.getElementById('rightColumn');
    dom.leftColumn = document.querySelector('.left-column');
    dom.resultSection = document.getElementById('resultSection');
    dom.deleteResult = document.getElementById('deleteResult');
    dom.promotionList = document.getElementById('promotionList');
    dom.loading = document.getElementById('loading');
    dom.promotionType = document.getElementById('promotionType');
}

export function hideLogPanel() {
    dom.rightColumn.classList.add('hidden');
}

export function renderVersion(version) {
    dom.versionInfo.textContent = `版本: ${version}`;
}

export function renderCurrentVersion(version) {
    dom.versionInfo.textContent = `当前版本: ${version}`;
}

export function renderShopInfo(state) {
    dom.shopName.textContent = state.shopName || '未获取到';
    dom.shopCode.textContent = state.shopCode || '未获取到';
    dom.countryCode.textContent = state.countryCode || '未获取到';
    dom.sellerId.textContent = state.oecSellerId || state.sellerId || '未获取到';
}

export function setupEventListeners(handlers) {
    dom.queryBtn.addEventListener('click', handlers.onQuery);
    dom.deleteBtn.addEventListener('click', handlers.onDelete);
    dom.checkUpdateBtn.addEventListener('click', handlers.onCheckUpdate);
    dom.toggleRightPanelBtn.addEventListener('click', toggleRightPanel);
}

export function toggleRightPanel() {
    if (dom.rightColumn.classList.contains('hidden')) {
        dom.rightColumn.classList.remove('hidden');
        dom.leftColumn.classList.add('shrink');
        document.body.classList.add('expanded');
        dom.toggleRightPanelBtn.textContent = '📜 隐藏日志';
    } else {
        dom.rightColumn.classList.add('hidden');
        dom.leftColumn.classList.remove('shrink');
        document.body.classList.remove('expanded');
        dom.toggleRightPanelBtn.textContent = '📜 显示日志';
    }
}

export function showLoading(show) {
    dom.loading.style.display = show ? 'flex' : 'none';
}

export function hideResult() {
    dom.resultSection.style.display = 'none';
}

export function setDeleteButtonEnabled(enabled) {
    dom.deleteBtn.disabled = !enabled;
}

export function getSelectedPromotionType() {
    return parseInt(dom.promotionType.value, 10);
}

export function getSelectedTabs() {
    const tabsCheckboxes = document.querySelectorAll('#tabsGroup input[type="checkbox"]:checked');
    return Array.from(tabsCheckboxes).map((option) => parseInt(option.value, 10));
}

export function setUpdateButtonLoading(isLoading) {
    dom.checkUpdateBtn.disabled = isLoading;
    dom.checkUpdateBtn.textContent = isLoading ? '检查中...' : '检查更新';
}

function appendTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    parent.appendChild(element);
    return element;
}

export function renderPromotionList(promotions) {
    dom.promotionList.replaceChildren();

    if (!promotions.length) {
        appendTextElement(dom.promotionList, 'p', 'empty-text', '没有找到促销活动');
        return;
    }

    const summary = appendTextElement(dom.promotionList, 'p', 'empty-text', `共找到 ${promotions.length} 个活动`);
    summary.style.color = '#666';

    promotions.forEach((promotion) => {
        const typeName = promotionTypeNames[promotion.promotion_type] || '未知';
        const tabName = tabNames[promotion.fromTab] || '未知';

        const item = document.createElement('div');
        item.className = 'promotion-item';

        const info = document.createElement('div');
        info.className = 'info';

        appendTextElement(info, 'span', 'name', promotion.name || '未命名活动');
        appendTextElement(info, 'span', 'meta', `ID: ${promotion.id} | 类型: ${typeName} | ${tabName}`);

        item.appendChild(info);
        dom.promotionList.appendChild(item);
    });
}

export function showDeleteResult(results) {
    const successCount = results.filter((result) => result.success).length;
    const failCount = results.length - successCount;

    dom.deleteResult.replaceChildren();

    const summary = document.createElement('p');
    summary.append('删除完成: ');
    appendTextElement(summary, 'span', 'success', `成功 ${successCount}`);
    summary.append(' | ');
    appendTextElement(summary, 'span', 'fail', `失败 ${failCount}`);
    dom.deleteResult.appendChild(summary);

    if (failCount > 0) {
        const failureList = document.createElement('div');
        failureList.style.marginTop = '12px';

        results.forEach((result) => {
            if (!result.success) {
                appendTextElement(failureList, 'div', 'item', `ID: ${result.id} | 名称: ${result.name || 'N/A'} | 错误: ${result.error || '未知错误'}`);
            }
        });

        dom.deleteResult.appendChild(failureList);
    }

    dom.resultSection.style.display = 'block';
}
