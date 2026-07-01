/**
 * CLC-Business-System 數據同步模塊
 * 負責拉取遠端 products_v2.json / tag_rules.json、本地緩存、版本校驗
 * 路徑：modules/sync/sync.js
 */
const DataSync = (function () {
    // 遠端raw數據固定鏈接
    const DATA_URLS = {
        product: "https://raw.githubusercontent.com/terrielau2011-design/CLC-Business-System/main/data/core/products_v2.json",
        tagRule: "https://raw.githubusercontent.com/terrielau2011-design/CLC-Business-System/main/data/core/tag_rules.json"
    };
    // 本地緩存key
    const STORAGE_KEYS = {
        productCache: "clc_product_cache",
        tagCache: "clc_tag_cache",
        cacheVersion: "clc_cache_version"
    };

    // 私有工具：通用fetch封裝
    async function fetchRemoteData(url) {
        try {
            const res = await fetch(url, {
                cache: "no-cache",
                headers: {
                    "Accept": "application/json"
                }
            });
            if (!res.ok) throw new Error(`資源載入失敗，狀態碼：${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("遠端數據拉取異常：", err);
            return null;
        }
    }

    // 私有：比對版本號，判斷是否需要更新緩存
    function isNeedUpdateCache(remoteVersion) {
        const localVer = localStorage.getItem(STORAGE_KEYS.cacheVersion);
        return localVer !== remoteVersion;
    }

    // 公開方法：一次性拉取產品+標籤完整數據
    async function loadAllData() {
        // 先嘗試讀取本地緩存
        const localProduct = localStorage.getItem(STORAGE_KEYS.productCache);
        const localTag = localStorage.getItem(STORAGE_KEYS.tagCache);
        let productData = localProduct ? JSON.parse(localProduct) : null;
        let tagData = localTag ? JSON.parse(localTag) : null;

        // 無緩存直接拉遠端
        if (!productData || !tagData) {
            return await refreshAllCache();
        }

        // 有緩存，校驗版本是否過期
        if (isNeedUpdateCache(productData.version)) {
            return await refreshAllCache();
        }

        // 緩存有效，直接返回本地數據
        return {
            products: productData.products,
            tagRules: tagData,
            fullProductJson: productData
        };
    }

    // 公開方法：強制刷新全部遠端數據，覆蓋本地緩存
    async function refreshAllCache() {
        const [productJson, tagJson] = await Promise.all([
            fetchRemoteData(DATA_URLS.product),
            fetchRemoteData(DATA_URLS.tagRule)
        ]);

        if (!productJson || !tagJson) {
            alert("數據載入失敗，請檢查網絡或倉庫檔案路徑");
            return null;
        }

        // 覆蓋存入localStorage緩存
        localStorage.setItem(STORAGE_KEYS.productCache, JSON.stringify(productJson));
        localStorage.setItem(STORAGE_KEYS.tagCache, JSON.stringify(tagJson));
        localStorage.setItem(STORAGE_KEYS.cacheVersion, productJson.version);

        return {
            products: productJson.products,
            tagRules: tagJson,
            fullProductJson: productJson
        };
    }

    // 公開方法：清除本地全部緩存
    function clearCache() {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        console.log("本地數據緩存已清空");
    }

    return {
        loadAllData,
        refreshAllCache,
        clearCache
    };
})();

// 全域掛載，頁面可直接調用 DataSync.loadAllData()
window.DataSync = DataSync;
