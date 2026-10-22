/*
 * 番茄钟纯函数与常量。
 * 不访问 DOM、不读写 localStorage,方便 test.html 和 node 直接测试。
 * 以普通脚本加载(不用 ES module,file:// 下 Chrome 会拦截 module)。
 */
(function (root) {
  'use strict';

  var FOCUS_MS = 25 * 60 * 1000;
  var STORAGE_PREFIX = 'zzfq.';

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /**
   * 把剩余毫秒数格式化为 "MM:SS"。
   * 倒计时按秒向上取整:还剩 999ms 显示 00:01,归零时才显示 00:00。
   * 负数和非法值按 0 处理。
   */
  function formatTime(ms) {
    var safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
    var totalSeconds = Math.ceil(safe / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return pad2(minutes) + ':' + pad2(seconds);
  }

  var Pomodoro = {
    FOCUS_MS: FOCUS_MS,
    STORAGE_PREFIX: STORAGE_PREFIX,
    formatTime: formatTime
  };

  root.Pomodoro = Pomodoro;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pomodoro;
  }
})(typeof window !== 'undefined' ? window : globalThis);
