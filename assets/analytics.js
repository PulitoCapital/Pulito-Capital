/* 璞合资本 · 站点统计（条件加载，不阻塞渲染）
 * 2026-09-20 启用：来源归因（配合 UTM 规范）
 * - Microsoft Clarity：热图 + 会话录制
 * - 百度统计：中文搜索归因 / 百度收录效果
 *
 * 加载策略：requestIdleCallback 空闲加载，避免影响 LCP；
 * 两个 ID 均为真实 ID 后才加载；占位符未替换时自动跳过（零副作用）。
 */
(function () {
  'use strict';

  // ====== 配置（替换成真实 ID 后即生效）======
  var CLARITY_ID = 'CLARITY_PROJECT_ID';   // Clarity 项目 ID，如 'abcd1234ef'
  var BAIDU_ID = 'BAIDU_ANALYTICS_ID';     // 百度统计 hm.js 的 ID，如 'a1b2c3d4e5f6...'
  // =========================================

  function isValid(id) {
    return typeof id === 'string' && id.length > 4 && id.indexOf('PLACEHOLDER') === -1 &&
      id.indexOf('CLARITY_PROJECT_ID') === -1 && id.indexOf('BAIDU_ANALYTICS_ID') === -1;
  }

  function loadClarity() {
    if (!isValid(CLARITY_ID)) return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function loadBaidu() {
    if (!isValid(BAIDU_ID)) return;
    window._hmt = window._hmt || [];
    var hm = document.createElement('script');
    hm.async = true;
    hm.src = 'https://hm.baidu.com/hm.js?' + BAIDU_ID;
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(hm, s);
    // 记录 UTM 来源（便于报表区分）
    try {
      var q = new URLSearchParams(location.search);
      var src = q.get('utm_source');
      if (src && window._hmt) window._hmt.push(['_trackEvent', 'utm', 'source', src]);
    } catch (e) { /* noop */ }
  }

  function boot() { loadClarity(); loadBaidu(); }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(boot, { timeout: 3000 });
  } else {
    window.addEventListener('load', function () { setTimeout(boot, 1200); }, { once: true });
  }
})();
