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
