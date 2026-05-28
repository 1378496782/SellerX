const axios = require('axios');
const { main } = require('./demo2');

// 从命令行参数中读取参数
// 使用方式: node test_demo1.js [promotion_type] [tabs] [dryRun]
// 比如: 
//   node test_demo1.js                          # 查询所有类型，tab=2和3，模拟删除
//   node test_demo1.js 2                        # 查询商家券，tab=2和3，模拟删除
//   node test_demo1.js 0 2                      # 查询所有类型，只tab 2，模拟删除
//   node test_demo1.js 0 2,3 false              # 查询所有类型，tab 2和3，真删除
const args = process.argv.slice(2);
const promotionTypeArg = args[0] ? parseInt(args[0], 10) : undefined;
const tabsArg = args[1];
const dryRunArg = args[2];

const caseVarMap = {};
if (promotionTypeArg && promotionTypeArg !== 0) {
    caseVarMap.promotion_type = promotionTypeArg;
}
if (tabsArg) {
    caseVarMap.tabs = tabsArg.split(',').map(t => parseInt(t.trim(), 10));
}
if (dryRunArg !== undefined) {
    caseVarMap.dryRun = dryRunArg !== 'false';
}

// 活动类型说明
const promotionTypeNames = {
    1: '平台券',
    2: '商家券',
    3: '运费折扣',
    4: '商品折扣',
    5: '限时闪购',
    6: '赠品活动',
    7: '多买多省',
    8: '套装优惠',
    9: '促销码'
};

// tab 说明
const tabNames = {
    2: 'Ongoing (进行中)',
    3: 'Upcoming (即将开始)'
};

console.log('========================================');
console.log('TikTok 促销活动查询工具');
console.log('========================================');
if (caseVarMap.promotion_type) {
    console.log(`查询类型: ${caseVarMap.promotion_type} - ${promotionTypeNames[caseVarMap.promotion_type] || '未知类型'}`);
} else {
    console.log('查询类型: 所有类型');
}
if (caseVarMap.tabs) {
    console.log(`查询 Tab: ${caseVarMap.tabs.map(t => `${t} (${tabNames[t] || '未知'})`).join(', ')}`);
} else {
    console.log('查询 Tab: 2 (Ongoing), 3 (Upcoming)');
}
console.log(`删除模式: ${caseVarMap.dryRun !== false ? 'DRY RUN (模拟)' : 'REAL (真实删除)'}`);
console.log('\n使用说明:');
console.log('  node test_demo1.js                          # 查询所有类型，tab 2和3，模拟删除');
console.log('  node test_demo1.js 2                        # 查询商家券，tab 2和3，模拟删除');
console.log('  node test_demo1.js 0 2                      # 查询所有类型，只查 tab 2，模拟删除');
console.log('  node test_demo1.js 0 2,3 false              # 查询所有类型，tab 2和3，真删除');
console.log('  node test_demo1.js 5 3 false                # 查询限时闪购，只查 tab 3，真删除');
console.log('\n类型编号说明:');
Object.entries(promotionTypeNames).forEach(([id, name]) => {
    console.log(`  ${id}: ${name}`);
});
console.log('\nTab 编号说明:');
Object.entries(tabNames).forEach(([id, name]) => {
    console.log(`  ${id}: ${name}`);
});
console.log('========================================\n');

main({
    page: null,
    context: null,
    log: console.log,
    case_var_map: caseVarMap,
    axios: axios
}).then(result => {
    console.log('\n=== 返回结果 ===');
    console.log(JSON.stringify(result, null, 2));
}).catch(err => {
    console.error('执行失败:', err);
});