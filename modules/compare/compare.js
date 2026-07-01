/**
 * 產品對比模塊 compare.js
 * 依賴：DataSync 同步模塊
 * 路徑：modules/compare/compare.js
 * 功能：標籤篩選、多產品橫向對比、週年IRR計算、圖表數據拼接
 */
const ProductCompare = (function () {
    let cacheProducts = [];
    let cacheTagRules = [];

    // 初始化緩存數據
    async function initData() {
        const res = await DataSync.loadAllData();
        if (!res) return false;
        cacheProducts = res.products;
        cacheTagRules = res.tagRules;
        return true;
    }

    // 單產品自動匹配標籤（filter_logic執行）
    function getAutoTags(item) {
        const autoTags = [];
        cacheTagRules.forEach(rule => {
            try {
                // 動態執行標籤判斷表達式
                const judge = new Function("item", `return ${rule.filter_logic}`);
                if (judge(item)) {
                    autoTags.push(rule.tag_name);
                }
            } catch (e) {
                console.warn(`標籤${rule.tag_name}判斷異常：`, e);
            }
        });
        return autoTags;
    }

    // 合併自動標籤 + 手動tag_list，去重
    function getAllTags(item) {
        const auto = getAutoTags(item);
        const manual = item.tag_list || [];
        return [...new Set([...auto, ...manual])];
    }

    // 根據標籤篩選產品清單
    function filterByTag(tagName) {
        return cacheProducts.filter(p => getAllTags(p).includes(tagName));
    }

    // 獲取全部可用標籤列表（前端篩選下拉用）
    function getAllTagList() {
        return cacheTagRules.map(r => r.tag_name);
    }

    // 提取指定週年IRR數據
    function getYearIRR(product, year) {
        if (year === 15) return product.irr_15;
        if (year === 20) return product.irr_20;
        return null;
    }

    // 生成圖表所需橫向對比數據
    function buildChartData(selectedProds, targetYear) {
        const labels = selectedProds.map(p => p.prod_name);
        const irrData = selectedProds.map(p => getYearIRR(p, targetYear));
        const breakData = selectedProds.map(p => p.break_year ?? "-");
        return {
            labels,
            irrData,
            breakData
        };
    }

    // 取得產品多幣最低保費顯示文字
    function getMinPremText(product) {
        const map = product.min_prem_currency;
        const arr = [];
        if (map.USD) arr.push(`USD${map.USD}`);
        if (map.HKD) arr.push(`HKD${map.HKD}`);
        if (map.CNY) arr.push(`CNY${map.CNY}`);
        return arr.join("/");
    }

    return {
        initData,
        getAllTags,
        filterByTag,
        getAllTagList,
        getYearIRR,
        buildChartData,
        getMinPremText
    };
})();

window.ProductCompare = ProductCompare;
