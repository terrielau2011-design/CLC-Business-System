/**
 * PDF報告生成模塊 report_pdf.js
 * 依賴：DataSync、SavingCalc、FinanceCalc、ProductCompare
 * 路徑：modules/report_pdf/report_pdf.js
 * 功能：整合計算數據生成標準報告結構、WhatsApp簡報文字、匯出內容拼接
 */
const ReportPDF = (function () {
    // 載入產品基礎數據
    async function loadProductData(prodId) {
        await DataSync.loadAllData();
        return SavingCalc.getProductById(prodId);
    }

    // 生成單產品完整報告文本內容
    async function buildFullReport(prodId, currency = "USD", loanRate = 3.2, holdYear = 20) {
        const product = await loadProductData(prodId);
        if (!product) return null;

        // 基礎資訊
        const minPremText = ProductCompare.getMinPremText(product);
        const corePoints = SavingCalc.getCorePoints(product);
        const sceneText = SavingCalc.getSceneDesc(product);
        const maxT = FinanceCalc.getMaxPayTerm(product);
        const totalPrem = SavingCalc.calcTotalOriginalPrem(product, currency);
        const irr15 = product.irr_15 ?? "無數據";
        const irr20 = product.irr_20 ?? "無數據";
        const breakYear = product.break_year ?? "無短期回本點";
        const isShortSaving = FinanceCalc.isShortSavingBreak(product);
        const isEduFund = FinanceCalc.checkEducationFundRule(product, currency);

        // 融資演算數據
        let finData = null;
        if (product.finance_support) {
            finData = FinanceCalc.calcFinanceLeverage(product, currency, loanRate, holdYear);
        }

        // 圖表數據
        const chartData = FinanceCalc.buildFinChartData(product, currency, loanRate);

        return {
            basic: {
                prodId: product.prod_id,
                insName: product.ins_name,
                prodName: product.prod_name,
                currencyList: product.currency,
                minPremText,
                payTermList: product.pay_term,
                maxPayTerm: maxT,
                totalOriginalPrem: totalPrem,
                irr15,
                irr20,
                breakYear,
                guarantee: product.guarantee ? "全保證收益" : "含非保證分紅",
                transferAssured: product.transfer_life_assured ? "支援轉換受保人" : "不可轉換受保人",
                annualWithdraw: product.annual_div_withdraw ? "可每年提取分紅年金" : "不可每年提取"
            },
            sellingPoints: corePoints,
            sceneDesc: sceneText,
            tagMark: {
                isShortSaving,
                isEduFund
            },
            finance: finData,
            chart: chartData
        };
    }

    // 生成WhatsApp精簡分享文字
    async function buildWhatsAppText(prodId, currency = "USD") {
        const report = await buildFullReport(prodId, currency);
        if (!report) return "產品數據載入失敗";
        const basic = report.basic;
        const points = report.sellingPoints.join("｜");

        let text = `【${basic.prodName}】
承保公司：${basic.insName}
入場門檻：${basic.minPremText}
繳費年期：${basic.payTermList.join("/")}
IRR15：${basic.irr15}｜IRR20：${basic.irr20}
回本週年：${basic.breakYear}
核心賣點：${points}
場景定位：${report.sceneDesc}`;

        if (report.finance) {
            text += `
====融資槓桿參考====
原始總保費：${currency}${report.finance.totalOriginalPrem}
自付金額：${currency}${report.finance.selfPay}
期末淨資產：${currency}${report.finance.netAsset}
模擬淨回報：${report.finance.netROI}%`;
        }
        return text;
    }

    // 複製文字到剪貼簿
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error("複製失敗：", err);
            return false;
        }
    }

    return {
        buildFullReport,
        buildWhatsAppText,
        copyToClipboard
    };
})();

window.ReportPDF = ReportPDF;
