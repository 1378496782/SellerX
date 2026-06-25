const persistentPanelSourceTabKey = 'persistentPanelSourceTab';

function isExtensionPage(tab) {
    return Boolean(tab?.url && tab.url.startsWith(chrome.runtime.getURL('')));
}

function getTabById(tabId) {
    return new Promise((resolve) => {
        if (!tabId) {
            resolve(null);
            return;
        }

        chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) {
                resolve(null);
                return;
            }
            resolve(tab || null);
        });
    });
}

export function getCurrentTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const currentTab = tabs && tabs[0] ? tabs[0] : null;
            if (currentTab && !isExtensionPage(currentTab)) {
                resolve(currentTab);
                return;
            }

            const stored = await getStorageValues([persistentPanelSourceTabKey]);
            const sourceTab = await getTabById(stored[persistentPanelSourceTabKey]?.tabId);
            resolve(sourceTab && !isExtensionPage(sourceTab) ? sourceTab : currentTab);
        });
    });
}

export async function setPersistentPanelSourceTab(tab) {
    if (!tab?.id || isExtensionPage(tab)) {
        return;
    }

    await setStorageValues({
        [persistentPanelSourceTabKey]: {
            tabId: tab.id,
            windowId: tab.windowId,
            url: tab.url || '',
            savedAt: Date.now()
        }
    });
}

export function getCookiesByDomain(domain) {
    return new Promise((resolve) => {
        chrome.cookies.getAll({ domain }, (cookies) => {
            resolve(cookies || []);
        });
    });
}

export async function sendRuntimeMessage(action, data) {
    return chrome.runtime.sendMessage({ action, data });
}

export function getStorageValues(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (values) => {
            resolve(values || {});
        });
    });
}

export function setStorageValues(values) {
    return new Promise((resolve) => {
        chrome.storage.local.set(values, () => {
            resolve();
        });
    });
}

export function removeStorageValues(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.remove(keys, () => {
            resolve();
        });
    });
}
