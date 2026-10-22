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

  /*
   * 计时状态:{ status, endAt, remainingMs }
   * - status:'idle' | 'running'
   * - endAt:running 时的结束时间戳(ms),其余为 null
   * - remainingMs:非 running 时显示的剩余毫秒
   * 形状与 README 中 zzfq.timerState 一致。
   */

  /** 未开始:显示完整的 25 分钟。 */
  function createIdleState() {
    return { status: 'idle', endAt: null, remainingMs: FOCUS_MS };
  }

  /** 从 now 开始一个固定 25 分钟的番茄。 */
  function startTimer(now) {
    return { status: 'running', endAt: now + FOCUS_MS, remainingMs: FOCUS_MS };
  }

  /** 走完后的状态:停在 00:00,再开始时从 25:00 重新计时。 */
  function finishTimer() {
    return { status: 'idle', endAt: null, remainingMs: 0 };
  }

  /** 剩余毫秒:running 时按 endAt - now 计算，永不为负。 */
  function getRemainingMs(state, now) {
    if (state.status !== 'running') return state.remainingMs;
    return Math.max(0, state.endAt - now);
  }

  /** running 且已到 endAt。 */
  function isFinished(state, now) {
    return state.status === 'running' && getRemainingMs(state, now) === 0;
  }

  var Pomodoro = {
    FOCUS_MS: FOCUS_MS,
    STORAGE_PREFIX: STORAGE_PREFIX,
    formatTime: formatTime,
    createIdleState: createIdleState,
    startTimer: startTimer,
    finishTimer: finishTimer,
    getRemainingMs: getRemainingMs,
    isFinished: isFinished
  };

  root.Pomodoro = Pomodoro;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pomodoro;
  }
})(typeof window !== 'undefined' ? window : globalThis);
