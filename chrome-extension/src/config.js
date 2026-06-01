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

export const promotionFilterOptions = {
    1: { promotionType: 1, label: 'All Promotions' },
    2: { promotionType: 2, displayType: 1, label: 'Regular coupon' },
    3: { promotionType: 3, displayType: 2, label: 'Shipping Discount' },
    4: { promotionType: 4, displayType: 3, label: 'Product Discount' },
    5: { promotionType: 5, displayType: 4, label: 'Flash Sale' },
    6: { promotionType: 6, displayType: 5, label: 'Gift with Purchase' },
    7: { promotionType: 7, displayType: 6, label: 'Buy More Save More' },
    8: { promotionType: 8, displayType: 7, label: 'Bundle Deal' },
    9: { promotionType: 9, displayType: 8, label: 'Promo Code (Old)' },
    10: { promotionType: 10, label: 'Early Bird' },
    11: { promotionType: 11, label: 'SNS' },
    '5:16': { promotionType: 5, displayType: 16, label: 'Creator LIVE deal' },
    17: { promotionType: 17, displayType: 8, label: 'Promo Code' }
};

export const tabNames = {
    all: 'All',
    active: 'Ongoing & Upcoming',
    2: 'Ongoing',
    3: 'Upcoming',
    4: 'Deactivated',
    5: 'Ended'
};

export const queryStatusTabs = [2, 3, 4, 5];
export const deletableStatusTabs = [2, 3];

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

export const authorContact = {
    name: '张富伟',
    openId: 'ou_873d43281881570cdc0757ba3b977775',
    chatUrl: 'https://applink.feishu.cn/client/chat/open?openId=ou_873d43281881570cdc0757ba3b977775'
};

export function isVoucherType(type) {
    return type === 2;
}

export function isPromoCodeType(type) {
    return type === 9 || type === 17;
}

export function getDisplayType(type) {
    return displayTypeMap[type] || 1;
}

export function getPromotionFilterConfig(filterValue) {
    const option = promotionFilterOptions[String(filterValue)] || promotionFilterOptions[filterValue];
    if (option) {
        return option;
    }

    const promotionType = parseInt(filterValue, 10);
    return {
        promotionType,
        displayType: getDisplayType(promotionType),
        label: promotionTypeNames[promotionType] || '未知类型'
    };
}

export function getPromotionDisplayName(promotion) {
    if (!promotion) {
        return '未知';
    }

    if (Number(promotion.promotion_type) === 5) {
        if (Number(promotion.display_type) === 16) {
            return 'Creator LIVE deal';
        }

        if (Number(promotion.display_type) === 4) {
            return 'Flash Sale';
        }
    }

    return promotionTypeNames[promotion.promotion_type] || '未知';
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
