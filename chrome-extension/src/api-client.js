export function getCurrentTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs && tabs[0] ? tabs[0] : null);
        });
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
