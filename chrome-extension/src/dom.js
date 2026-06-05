import { USER_MANUAL_URL, authorContact, deletableStatusTabs, getPromotionDisplayName, queryStatusTabs, tabNames } from './config.js';

export const dom = {};

export function cacheDom() {
    dom.versionInfo = document.getElementById('versionInfo');
    dom.shopName = document.getElementById('shopName');
    dom.shopCode = document.getElementById('shopCode');
    dom.countryCode = document.getElementById('countryCode');
    dom.sellerId = document.getElementById('sellerId');
    dom.queryBtn = document.getElementById('queryBtn');
    dom.deleteBtn = document.getElementById('deleteBtn');
    dom.userManualBtn = document.getElementById('userManualBtn');
    dom.checkUpdateBtn = document.getElementById('checkUpdateBtn');
    dom.contactAuthorBtn = document.getElementById('contactAuthorBtn');
    dom.toggleRightPanelBtn = document.getElementById('toggleRightPanelBtn');
    dom.hideLogPanelBtn = document.getElementById('hideLogPanelBtn');
    dom.rightColumn = document.getElementById('rightColumn');
    dom.leftColumn = document.querySelector('.left-column');
    dom.resultSection = document.getElementById('resultSection');
    dom.deleteResult = document.getElementById('deleteResult');
    dom.promotionList = document.getElementById('promotionList');
    dom.loading = document.getElementById('loading');
    dom.promotionType = document.getElementById('promotionType');
    dom.laneEnvInput = document.getElementById('laneEnvInput');
    dom.laneUsePpeInput = document.getElementById('laneUsePpeInput');
    dom.saveLaneHeadersBtn = document.getElementById('saveLaneHeadersBtn');
    dom.clearLaneHeadersBtn = document.getElementById('clearLaneHeadersBtn');
    dom.laneHeadersStatus = document.getElementById('laneHeadersStatus');
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
    dom.userManualBtn.addEventListener('click', openUserManual);
    dom.checkUpdateBtn.addEventListener('click', handlers.onCheckUpdate);
    dom.contactAuthorBtn.addEventListener('click', openAuthorChat);
    dom.toggleRightPanelBtn.addEventListener('click', toggleRightPanel);
    dom.hideLogPanelBtn.addEventListener('click', toggleRightPanel);
    dom.promotionType.addEventListener('change', handlers.onFilterChange);
    dom.saveLaneHeadersBtn.addEventListener('click', handlers.onSaveLaneHeaders);
    dom.clearLaneHeadersBtn.addEventListener('click', handlers.onClearLaneHeaders);
    document.querySelectorAll('#tabsGroup input[name="tab"]').forEach((input) => {
        input.addEventListener('change', handlers.onFilterChange);
    });
}

function openAuthorChat() {
    chrome.tabs.create({
        url: authorContact.chatUrl
    });
}

function openUserManual() {
    chrome.tabs.create({
        url: USER_MANUAL_URL
    });
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

export function getSelectedPromotionFilter() {
    return dom.promotionType.value;
}

export function getLaneHeaderInputValues() {
    return {
        'x-tt-env': dom.laneEnvInput.value.trim(),
        'x-use-ppe': dom.laneUsePpeInput.value.trim()
    };
}

export function renderLaneHeaders(headers = {}, source = '') {
    const env = headers['x-tt-env'] || '';
    const usePpe = headers['x-use-ppe'] || '';
    dom.laneEnvInput.value = env;
    dom.laneUsePpeInput.value = usePpe;
    dom.laneHeadersStatus.classList.toggle('ppe', Boolean(env || usePpe));

    if (env || usePpe) {
        const sourceLabel = source ? source : '泳道';
        const detail = [env, usePpe].filter(Boolean).join(' / ');
        dom.laneHeadersStatus.textContent = 'PPE（' + sourceLabel + '）';
        dom.laneHeadersStatus.title = detail;
    } else {
        dom.laneHeadersStatus.textContent = 'Prod（线上）';
        dom.laneHeadersStatus.title = '未使用泳道 Header';
    }
}

export function getSelectedTabs() {
    const selected = document.querySelector('#tabsGroup input[name="tab"]:checked')?.value || 'all';
    if (selected === 'all') {
        return queryStatusTabs;
    }

    if (selected === 'active') {
        return deletableStatusTabs;
    }

    return [parseInt(selected, 10)];
}

export function getSelectedStatusValue() {
    return document.querySelector('#tabsGroup input[name="tab"]:checked')?.value || 'all';
}

export function canDeleteSelectedStatus() {
    const selected = getSelectedStatusValue();
    if (selected === 'all') {
        return false;
    }

    if (selected === 'active') {
        return true;
    }

    return deletableStatusTabs.includes(parseInt(selected, 10));
}

export function setUpdateButtonLoading(isLoading) {
    dom.checkUpdateBtn.disabled = isLoading;
    dom.checkUpdateBtn.classList.toggle('is-loading', isLoading);
    dom.checkUpdateBtn.dataset.tooltip = isLoading ? '检查中...' : '检查更新';
    dom.checkUpdateBtn.setAttribute('aria-label', isLoading ? '检查中...' : '检查更新');
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

function getPromotionStatusName(promotion) {
    return tabNames[promotion.fromTab] || tabNames[promotion.status] || '未知';
}

function canDeletePromotionItem(promotion) {
    const status = Number(promotion.fromTab || promotion.status);
    return deletableStatusTabs.includes(status);
}

function getPromotionTime(promotion, keys) {
    for (const key of keys) {
        const value = promotion[key];
        if (value !== undefined && value !== null && value !== '') {
            return formatPromotionTime(value);
        }
    }

    return '-';
}

function formatPromotionTime(value) {
    if (typeof value === 'number') {
        const timestamp = value > 1000000000000 ? value : value * 1000;
        return new Date(timestamp).toLocaleString();
    }

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue) && numericValue > 0) {
        const timestamp = numericValue > 1000000000000 ? numericValue : numericValue * 1000;
        return new Date(timestamp).toLocaleString();
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function renderPromotionList(promotions, handlers = {}) {
    dom.promotionList.replaceChildren();

    if (!promotions.length) {
        appendTextElement(dom.promotionList, 'p', 'empty-text', '没有找到促销活动');
        return;
    }

    const summary = appendTextElement(dom.promotionList, 'p', 'empty-text', `共找到 ${promotions.length} 个活动`);
    summary.style.color = '#666';

    promotions.forEach((promotion) => {
        const typeName = getPromotionDisplayName(promotion);
        const statusName = getPromotionStatusName(promotion);
        const startTime = getPromotionTime(promotion, ['start_time', 'start_time_ms', 'begin_time', 'begin_time_ms', 'startTime']);
        const endTime = getPromotionTime(promotion, ['end_time', 'end_time_ms', 'finish_time', 'finish_time_ms', 'endTime']);

        const item = document.createElement('div');
        item.className = 'promotion-item';

        const info = document.createElement('div');
        info.className = 'info';

        const titleRow = document.createElement('div');
        titleRow.className = 'promotion-title-row';
        const nameText = promotion.name || '未命名活动';
        const nameElement = appendTextElement(titleRow, 'span', 'name', nameText);
        nameElement.title = nameText;
        appendTextElement(titleRow, 'span', `status-pill status-${String(statusName).toLowerCase()}`, statusName);

        const metaGrid = document.createElement('div');
        metaGrid.className = 'promotion-meta-grid';
        [
            `ID: ${promotion.id || 'N/A'}`,
            `类型: ${typeName}`,
            `开始: ${startTime}`,
            `结束: ${endTime}`
        ].forEach((metaText) => {
            const metaElement = appendTextElement(metaGrid, 'span', 'meta', metaText);
            metaElement.title = metaText;
        });

        info.appendChild(titleRow);
        info.appendChild(metaGrid);
        item.appendChild(info);

        if (canDeletePromotionItem(promotion) && handlers.onDeletePromotion) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'single-delete-btn';
            deleteButton.textContent = '删除';
            deleteButton.title = '删除当前活动';
            deleteButton.addEventListener('click', () => handlers.onDeletePromotion(promotion, deleteButton));
            item.appendChild(deleteButton);
        }

        dom.promotionList.appendChild(item);
    });
}

function buildDeleteResultText(results) {
    const successCount = results.filter((result) => result.success).length;
    const failCount = results.length - successCount;
    const lines = [
        `删除结果：成功 ${successCount}，失败 ${failCount}`,
        ''
    ];

    results.forEach((result, index) => {
        lines.push([
            `${index + 1}. ${result.success ? '成功' : '失败'}`,
            `ID: ${result.id || 'N/A'}`,
            `名称: ${result.name || 'N/A'}`,
            `类型: ${result.type || 'N/A'}`,
            `logId: ${result.logId || 'N/A'}`,
            result.success ? '' : `错误: ${result.error || '未知错误'}`
        ].filter(Boolean).join(' | '));
    });

    return lines.join('\n');
}

async function copyTextToClipboard(text, button) {
    const originalText = button.textContent;

    try {
        await navigator.clipboard.writeText(text);
        button.textContent = '已复制';
    } catch (error) {
        button.textContent = '复制失败';
        console.error('复制删除结果失败:', error);
    }

    window.setTimeout(() => {
        button.textContent = originalText;
    }, 1500);
}

function renderResultGroup(title, results, className) {
    const group = document.createElement('div');
    group.className = 'result-group';

    appendTextElement(group, 'div', `result-group-title ${className}`, `${title} (${results.length})`);

    const groupBody = document.createElement('div');
    groupBody.className = 'result-group-body';

    results.forEach((result) => {
        const item = document.createElement('div');
        item.className = 'item';

        appendTextElement(item, 'div', 'result-item-title', `${result.name || 'N/A'}`);
        appendTextElement(item, 'div', 'result-item-meta', `ID: ${result.id || 'N/A'} | 类型: ${result.type || 'N/A'} | logId: ${result.logId || 'N/A'}`);

        if (!result.success) {
            appendTextElement(item, 'div', 'result-item-error', `错误: ${result.error || '未知错误'}`);
        }

        groupBody.appendChild(item);
    });

    group.appendChild(groupBody);
    return group;
}

export function showDeleteResult(results) {
    const successCount = results.filter((result) => result.success).length;
    const failCount = results.length - successCount;
    const successResults = results.filter((result) => result.success);
    const failureResults = results.filter((result) => !result.success);
    const resultText = buildDeleteResultText(results);

    dom.deleteResult.replaceChildren();

    const header = document.createElement('div');
    header.className = 'result-header';

    const summary = document.createElement('p');
    summary.className = 'result-summary';
    summary.append('删除完成: ');
    appendTextElement(summary, 'span', 'success', `成功 ${successCount}`);
    summary.append(' | ');
    appendTextElement(summary, 'span', 'fail', `失败 ${failCount}`);

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'copy-result-btn';
    copyButton.textContent = '复制结果';
    copyButton.addEventListener('click', () => copyTextToClipboard(resultText, copyButton));

    header.appendChild(summary);
    header.appendChild(copyButton);
    dom.deleteResult.appendChild(header);

    if (failureResults.length > 0) {
        dom.deleteResult.appendChild(renderResultGroup('失败明细', failureResults, 'fail'));
    }

    if (successResults.length > 0) {
        dom.deleteResult.appendChild(renderResultGroup('成功明细', successResults, 'success'));
    }

    dom.resultSection.style.display = 'block';
}
