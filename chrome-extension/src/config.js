export const promotionTypeNames = {
    1: 'All Promotions',
    2: 'Regular coupon',
    3: 'Shipping Discount',
    4: 'Product Discount',
    5: 'Flash Sale',
    6: 'Gift with Purchase',
    7: 'Buy More Save More',
    8: 'Bundle Deal',
    9: 'Promo Code (Old)',
    10: 'Early Bird',
    11: 'SNS',
    12: 'Creator LIVE deal',
    17: 'Promo Code'
};

export const tabNames = {
    2: 'Ongoing',
    3: 'Upcoming'
};

export const displayTypeMap = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 7,
    9: 8,
    17: 8
};

export const sellerDomains = {
    tiktok: ['.tiktok.com', '.tiktok.net', '.tiktokv.com'],
    tokopedia: ['.tokopedia.com', '.tokopedia.net']
};

export const sellerIdCookieKeys = [
    'oec_seller_id_unified_seller_env',
    'global_seller_id_unified_seller_env',
    'oec_seller_id',
    'SHOP_ID',
    'UNIFIED_SELLER_TOKEN',
    'SELLER_TOKEN',
    'SELLER_ID',
    'seller_id'
];

export function isVoucherType(type) {
    return type === 2;
}

export function isPromoCodeType(type) {
    return type === 9 || type === 17;
}

export function getDisplayType(type) {
    return displayTypeMap[type] || 1;
}

export function isTokopediaRegion(countryCode) {
    return countryCode === 'ID';
}

export function getBaseDomain(countryCode) {
    const region = (countryCode || '').toLowerCase();
    return isTokopediaRegion(countryCode)
        ? `seller-${region}.tokopedia.com`
        : `seller-${region}.tiktok.com`;
}

export function getLocaleConfig(countryCode) {
    if (isTokopediaRegion(countryCode)) {
        return {
            locale: 'en-GB',
            language: 'en-GB',
            timezone: 'Asia%2FJakarta'
        };
    }

    return {
        locale: 'en',
        language: 'en',
        timezone: 'Asia%2FShanghai'
    };
}

export function getDomainFamily(hostname) {
    if (!hostname) {
        return '';
    }

    if (hostname.includes('tiktok')) {
        return 'tiktok';
    }

    if (hostname.includes('tokopedia')) {
        return 'tokopedia';
    }

    return '';
}

export function extractRegionFromUrl(urlText) {
    if (!urlText) {
        return '';
    }

    const hostMatch = urlText.match(/seller-([a-z]{2})\.(tiktok|tokopedia)\.(com|net)/i);
    if (hostMatch) {
        return hostMatch[1].toUpperCase();
    }

    const params = new URLSearchParams(urlText.split('?')[1] || '');
    const shopRegion = params.get('shop_region');
    return shopRegion ? shopRegion.toUpperCase() : '';
}
