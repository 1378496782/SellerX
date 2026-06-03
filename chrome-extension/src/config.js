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
    8: { promotionType: 8, displayType: 8, label: 'Bundle Deal' },
    9: { promotionType: 9, displayType: 17, label: 'Promo Code (Old)' },
    10: { promotionType: 10, displayType: 19, label: 'Early Bird' },
    11: { promotionType: 11, displayType: 20, label: 'SNS' },
    '5:16': { promotionType: 5, displayType: 16, label: 'Creator LIVE deal' },
    17: { promotionType: 17, displayType: 17, label: 'Promo Code' }
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
    8: 8,
    9: 17,
    10: 19,
    11: 20,
    17: 17
};

export const promotionDisplayTypeNames = {
    1: 'Regular coupon',
    2: 'Shipping Discount',
    3: 'Product Discount',
    4: 'Flash Sale',
    5: 'Gift with Purchase',
    6: 'Buy More Save More',
    7: 'IM Voucher',
    8: 'Bundle Deal',
    9: 'Live Voucher',
    10: 'Live Interactive Voucher',
    11: 'Shop New User Voucher',
    12: 'Creator Voucher',
    13: 'CRM Voucher',
    14: 'Repeat Customer Voucher',
    15: 'Live Flash Deal',
    16: 'Creator LIVE deal',
    17: 'Promo Code',
    18: 'Creator Live Giveaway',
    19: 'Early Bird Price',
    20: 'SNS Product Discount',
    21: 'Seller Follow Voucher',
    22: 'Store Wide Free Shipping',
    23: 'Creator Live Deal',
    24: 'Seller Review Voucher',
    25: 'Seller Buy X Get Y',
    26: 'Member Free Shipping'
};

export const promotionTypeDetailNames = {
    1: 'IM Voucher',
    2: 'CRM Voucher',
    3: 'Regular Voucher',
    4: 'Live Voucher',
    5: 'Live Interactive Voucher',
    6: 'Seller New User Voucher',
    7: 'Creator Voucher',
    8: 'Buy More Save More',
    9: 'Flash Sale',
    10: 'Live Flash Deal',
    11: 'Product Discount',
    12: 'Bundle Deal',
    13: 'Free Shipping',
    14: 'Creator LIVE deal',
    15: 'Creator LIVE deal Main',
    16: 'Creator LIVE deal Sub',
    17: 'Creator LIVE deal GS',
    18: 'Promo Code',
    19: 'Creator LIVE deal Campaign',
    20: 'Creator LIVE deal GS Normal',
    21: 'Creator LIVE Special Price GS Main',
    22: 'Creator LIVE Special Price GS Sub',
    23: 'Gift with Purchase',
    24: 'Early Bird Price',
    25: 'Creator Live Giveaway',
    26: 'SNS Product Discount',
    27: 'SNS Free Shipping',
    28: 'Shopping Center Voucher',
    29: 'Seller Follow Voucher',
    30: 'Agent GS Live Flash Deal',
    31: 'Agent Campaign Live Flash Deal',
    32: 'Creator Exclusive Price',
    33: 'Seller Review Voucher',
    34: 'Campaign Price',
    35: 'Seller Buy X Get Y',
    36: 'Early Bird Price Fixed Price',
    37: 'Product Discount Fixed Price',
    38: 'Member Free Shipping',
    50: 'Common Promotion'
};

export const sellerDomains = {
    tiktok: ['.tiktok.com', '.tiktok.net', '.tiktokv.com'],
    tokopedia: ['.tokopedia.com', '.tokopedia.net']
};

const countryCodeAliases = {
    UK: 'GB'
};

const sellerDomainRegionAliases = {
    GB: 'uk',
    UK: 'uk'
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

    const displayTypeName = promotionDisplayTypeNames[Number(promotion.display_type)];
    if (displayTypeName) {
        return displayTypeName;
    }

    const detailName = promotionTypeDetailNames[Number(promotion.promotion_type_detail)];
    if (detailName) {
        return detailName;
    }

    return promotionTypeNames[promotion.promotion_type] || '未知';
}

export function isTokopediaRegion(countryCode) {
    return normalizeCountryCode(countryCode) === 'ID';
}

export function normalizeCountryCode(countryCode) {
    const region = (countryCode || '').toUpperCase();
    return countryCodeAliases[region] || region;
}

export function getSellerDomainRegion(countryCode) {
    const region = (countryCode || '').toUpperCase();
    return sellerDomainRegionAliases[region] || normalizeCountryCode(region).toLowerCase();
}

export function getBaseDomain(countryCode) {
    const region = getSellerDomainRegion(countryCode);
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
        return normalizeCountryCode(hostMatch[1]);
    }

    const params = new URLSearchParams(urlText.split('?')[1] || '');
    const shopRegion = params.get('shop_region');
    return shopRegion ? normalizeCountryCode(shopRegion) : '';
}
