/**
 * PWA離線緩存服務工作線程
 * 路徑：pwa-config/service-worker.js
 */
const CACHE_NAME = "clc-system-cache-v1";
// 需要緩存的靜態資源清單
const CACHE_ASSETS = [
  "../app/index.html",
  "../app/compare.html",
  "../app/saving_plan.html",
  "../app/finance_leverage.html",
  "../app/report.html",
  "../assets/css/style.css",
  "../assets/charts/chartConfig.js",
  "../assets/charts/finConfig.js",
  "../modules/sync/sync.js",
  "../modules/compare/compare.js",
  "../modules/saving_calc/saving_calc.js",
  "../modules/finance_calc/finance_calc.js",
  "../modules/report_pdf/report_pdf.js"
];

// 安裝時預緩存靜態頁面與模塊
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活時清理舊緩存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截請求，優先讀本地緩存
self.addEventListener("fetch", (event) => {
  const req = event.request;
  // JSON遠端數據不走離線緩存，強制網路拉取最新
  if (req.url.includes("raw.githubusercontent.com")) {
    event.respondWith(fetch(req));
    return;
  }
  // 靜態資源使用緩存優先策略
  event.respondWith(
    caches.match(req)
      .then(cacheRes => {
        return cacheRes || fetch(req);
      })
  );
});
