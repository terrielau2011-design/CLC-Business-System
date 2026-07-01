/**
 * 保費融資槓桿精算模塊 finance_calc.js
 * 依賴：DataSync、SavingCalc
 * 路徑：modules/finance_calc/finance_calc.js
 * 功能：融資全流程演算、T+2回本判斷、T+10教育基金估值、圖表曲線數據生成
 */
const FinanceCalc = (function () {
    let cacheProducts = [];

    // 載入產品數據緩存
    async function initData() {
        const res = await DataSync.loadAllData();
        if (!res) return false;
        cacheProducts = res.products;
        return true;
    }

    // 透過prod_id取得產品
    function getProductById(prodId) {
        return cacheProducts.find(p => p.prod_id === prodId) || null;
    }

    // 計算最長繳費年期 T
    function getMaxPayTerm(product) {
        return Math.max(...product.pay_term);
    }

    // 校驗是否符合「短期儲蓄」T+2回本規則
    function isShortSavingBreak(product) {
        const T = getMaxPayTerm(product);
        return product.break_year !== null && (T + 2 === product.break_year);
    }

    // 教育基金判斷：T+10週年總價值 ≥ 原始總保費 × 1.8
    function checkEducationFundRule(product, currency = "USD") {
        const T = getMaxPayTerm(product);
        const totalPrem = SavingCalc.calcTotalOriginalPrem(product, currency);
        const threshold = totalPrem * 1.8;
        return product.value_t_plus_10 >= threshold;
    }

    // 標準融資槓桿演算
    function calcFinanceLeverage(product, currency, loanRate, holdYear) {
        const singlePrem = SavingCalc.getMinPremByCurrency(product, currency);
        const T = getMaxPayTerm(product);
        const totalOriginalPrem = singlePrem * T;
        // 假設融資比例70%，自付30%
        const loanAmount = totalOriginalPrem * 0.7;
        const selfPay = totalOriginalPrem * 0.3;
        // 持有期總利息簡化演算
        const totalInterest = loanAmount * (loanRate / 100) * holdYear;
        // 模擬持有年度IRR收益
        const irr = holdYear === 15 ? product.irr_15 : product.irr_20;
        const assetFinal = totalOriginalPrem * Math.pow(1 + irr / 100, holdYear);
        // 淨資產 = 保單期末價值 - 貸款本金 - 利息
        const netAsset = assetFinal - loanAmount - totalInterest;
        const netROI = selfPay > 0 ? ((netAsset / selfPay) - 1) * 100 : 0;

        return {
            totalOriginalPrem,
            loanAmount: Number(loanAmount.toFixed(2)),
            selfPay: Number(selfPay.toFixed(2)),
            totalInterest: Number(totalInterest.toFixed(2)),
            assetFinal: Number(assetFinal.toFixed(2)),
            netAsset: Number(netAsset.toFixed(2)),
            netROI: Number(netROI.toFixed(2))
        };
    }

    // 生成融資雙極限圖表年份數據
    function buildFinChartData(product, currency, loanRate) {
        const yearList = [];
        const baseLine = [];
        const stressLine = [];
        const T = getMaxPayTerm(product);
        const totalPrem = SavingCalc.calcTotalOriginalPrem(product, currency);

        // 模擬1至30年數據
        for (let y = 1; y <= 30; y++) {
            yearList.push(y);
            // 基準情景IRR
            const baseIrr = y <= 15 ? product.irr_15 : product.irr_20;
            const baseVal = totalPrem * Math.pow(1 + baseIrr / 100, y);
            baseLine.push(Number(baseVal.toFixed(0)));
            // 壓測情景IRR下調0.8%
            const stressIrr = (baseIrr ?? 0) - 0.8;
            const stressVal = totalPrem * Math.pow(1 + stressIrr / 100, y);
            stressLine.push(Number(stressVal.toFixed(0)));
        }

        return {
            years: yearList,
            baseSeries: baseLine,
            stressSeries: stressLine,
            breakPoint: product.break_year
        };
    }

    return {
        initData,
        getProductById,
        getMaxPayTerm,
        isShortSavingBreak,
        checkEducationFundRule,
        calcFinanceLeverage,
        buildFinChartData
    };
})();

window.FinanceCalc = FinanceCalc;
