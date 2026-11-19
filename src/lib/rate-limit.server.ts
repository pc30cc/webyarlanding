// شمارنده ساده پنجره لغزان در حافظه همین پروسه — فقط سمت سرور.
// برای محدودیت‌هایی که از دست رفتنشان با restart مهم نیست (مثل تعداد پیام فرم تماس از یک آی‌پی).

const MAX_KEYS = 50_000;

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();
  private lastPrune = 0;

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  private recent(key: string, now: number): number[] {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (list.length > 0) this.hits.set(key, list);
    else this.hits.delete(key);
    return list;
  }

  /** آیا این کلید به سقف رسیده است؟ */
  isLimited(key: string, now = Date.now()): boolean {
    return this.recent(key, now).length >= this.max;
  }

  /** یک رخداد برای این کلید ثبت می‌کند. */
  record(key: string, now = Date.now()): void {
    if (now - this.lastPrune > this.windowMs) {
      this.lastPrune = now;
      for (const k of [...this.hits.keys()]) this.recent(k, now);
    }
    while (this.hits.size >= MAX_KEYS && !this.hits.has(key)) {
      const oldest = this.hits.keys().next();
      if (oldest.done) break;
      this.hits.delete(oldest.value);
    }
    const list = this.recent(key, now);
    list.push(now);
    this.hits.set(key, list);
  }

  /** فقط برای تست */
  reset(): void {
    this.hits.clear();
    this.lastPrune = 0;
  }
}
