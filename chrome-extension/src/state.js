export const appState = {
    cookies: '',
    countryCode: '',
    oecSellerId: '',
    sellerId: '',
    shopName: '',
    shopCode: '',
    allPromotions: []
};

export function getEffectiveSellerId() {
    return appState.oecSellerId || appState.sellerId;
}

export function setSellerInfo(info = {}) {
    if (info.oecSellerId) {
        appState.oecSellerId = info.oecSellerId;
        appState.sellerId = info.oecSellerId;
    }

    if (info.sellerId) {
        appState.sellerId = info.sellerId;
    }

    if (info.countryCode) {
        appState.countryCode = info.countryCode.toUpperCase();
    }

    if (info.shopName) {
        appState.shopName = info.shopName;
    }

    if (info.shopCode) {
        appState.shopCode = info.shopCode;
    }
}

export function setCookies(cookieHeader) {
    appState.cookies = cookieHeader || '';
}

export function setPromotions(promotions) {
    appState.allPromotions = Array.isArray(promotions) ? promotions : [];
}

export function clearPromotions() {
    appState.allPromotions = [];
}
