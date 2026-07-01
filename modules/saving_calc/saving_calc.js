/**
 * 儲蓄險精算模塊 saving_calc.js
 * 依賴：DataSync、ProductCompare
 * 路徑：modules/saving_calc/saving_calc.js
 * 功能：保費計算、回本校驗、產品賣點/場景文案提取、跨資產對比數值演算
 */
const SavingCalc = (function () {
    let cacheProducts = [];

    // 載入產品緩存
    async function initData() {
        const res = await DataSync.loadAllData();
        if (!res) return false;
        cacheProducts = res.products;
        return true;
    }

    // 根據prod_id取得單一產品完整資訊
    function getProductById(prodId) {
        return cacheProducts.find(item => item.prod_id === prodId) || null;
    }

    // 計算產品全期原始總保費（未折扣）
    function calcTotalOriginalPrem(product, currency = "USD") {
        const singleYearPrem = product.min_prem_currency[currency];
        const maxPayYear = Math.max(...product.pay_term);
        return singleYearPrem * maxPayYear;
    }

    // 提取三個核心賣點陣列
    function getCorePoints(product) {
        return [
            product.core_point_1,
            product.core_point_2,
            product.core_point_3
        ].filter(text => text !== "");
    }

    // 回傳標準化場景描述
    function getSceneDesc(product) {
        return product.scene_desc;
    }

    // 判斷產品是否支援保費融資
    function hasFinanceSupport(product) {
        return product.finance_support === true;
    }

    // 取得產品對應幣種最低入場保費
    function getMinPremByCurrency(product, currency = "USD") {
        return product.min_prem_currency[currency] ?? null;
    }

    // 跨資產簡單收益對比演算
    function calcAssetBenchmark(totalPrem, irr, holdYear) {
        if (!irr || irr <= 0) return { finalValue: totalPrem, profit: 0 };
        const finalValue = totalPrem * Math.pow(1 + irr / 100, holdYear);
        const profit = finalValue - totalPrem;
        return {
            finalValue: Number(finalValue.toFixed(2)),
            profit: Number(profit.toFixed(2))
        };
    }

    return {
        initData,
        getProductById,
        calcTotalOriginalPrem,
        getCorePoints,
        getSceneDesc,
        hasFinanceSupport,
        getMinPremByCurrency,
        calcAssetBenchmark
    };
})();

window.SavingCalc = SavingCalc;
