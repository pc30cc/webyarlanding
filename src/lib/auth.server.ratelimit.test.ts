// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

type Filter = [op: string, column: string, value: unknown];
interface Query {
  table: string;
  action: string;
  filters: Filter[];
  values?: Record<string, unknown>;
}

const state = vi.hoisted(() => ({
  queries: [] as Query[],
  count: (_q: Query): number => 0,
  cookie: undefined as string | undefined,
  ip: "81.12.3.4",
}));

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: () => state.cookie,
  setCookie: () => {},
  deleteCookie: () => {},
  getRequestHeader: () => "test-agent",
}));
vi.mock("./request-ip.server", () => ({ requestClientIp: () => state.ip }));
vi.mock("./db.server", () => {
  const from = (table: string) => {
    const q: Query = { table, action: "select", filters: [] };
    state.queries.push(q);
    const filter = (op: string) => (c: string, v: unknown) => {
      q.filters.push([op, c, v]);
      return b;
    };
    const b = {
      select: () => b,
      delete: () => {
        q.action = "delete";
        return b;
      },
      insert: (values: Record<string, unknown>) => {
        q.action = "insert";
        q.values = values;
        return b;
      },
      eq: filter("eq"),
      neq: filter("neq"),
      gte: filter("gte"),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve({ count: state.count(q), data: null }).then(res, rej),
    };
    return b;
  };
  return {
    db: { from },
    newId: () => "id",
    nowIso: () => new Date().toISOString(),
    toBool: Boolean,
  };
});

import * as auth from "./auth.server";

const has = (q: Query, op: string, column: string, value?: unknown) =>
  q.filters.some((f) => f[0] === op && f[1] === column && (value === undefined || f[2] === value));
const byPair = (q: Query) => has(q, "eq", "email") && has(q, "eq", "ip_address");
const byIp = (q: Query) => !has(q, "eq", "email") && has(q, "eq", "ip_address");
const byEmail = (q: Query) => has(q, "eq", "email") && !has(q, "eq", "ip_address");

beforeEach(() => {
  state.queries = [];
  state.count = () => 0;
  state.cookie = undefined;
});

describe("admin login limits", () => {
  it("locks an email from one IP after 8 failures, not from everywhere", async () => {
    state.count = (q) => (byPair(q) ? auth.LOGIN_RATE_LIMIT_MAX_PER_EMAIL_IP : 0);
    expect(await auth.isLoginRateLimited("a@b.c")).toBe(true);
    state.count = (q) => (byPair(q) ? auth.LOGIN_RATE_LIMIT_MAX_PER_EMAIL_IP - 1 : 0);
    expect(await auth.isLoginRateLimited("a@b.c")).toBe(false);
  });

  it("caps one IP across emails and one email across IPs", async () => {
    state.count = (q) => (byIp(q) ? auth.LOGIN_RATE_LIMIT_MAX_PER_IP : 0);
    expect(await auth.isLoginRateLimited("a@b.c")).toBe(true);
    state.count = (q) => (byEmail(q) ? auth.LOGIN_RATE_LIMIT_MAX_PER_EMAIL - 1 : 0);
    expect(await auth.isLoginRateLimited("a@b.c")).toBe(false);
    state.count = (q) => (byEmail(q) ? auth.LOGIN_RATE_LIMIT_MAX_PER_EMAIL : 0);
    expect(await auth.isLoginRateLimited("a@b.c")).toBe(true);
  });

  it("does not count attempts refused by the limit", async () => {
    await auth.isLoginRateLimited("a@b.c");
    expect(state.queries.length).toBeGreaterThan(0);
    for (const q of state.queries) {
      expect(has(q, "eq", "success", 0)).toBe(true);
      expect(has(q, "neq", "reason", auth.LOGIN_RATE_LIMITED_REASON)).toBe(true);
    }
  });

  it("gives every failure a reason", async () => {
    await auth.logLoginAttempt("a@b.c", false);
    await auth.logLoginAttempt("a@b.c", true);
    expect(state.queries[0]!.values!["reason"]).toBeTruthy();
    expect(state.queries[1]!.values!["reason"]).toBeNull();
    expect(state.queries[1]!.values!["ip_address"]).toBe("81.12.3.4");
  });

  it("ends the user's other sessions and keeps this one", async () => {
    state.cookie = "current-token";
    await auth.endOtherSessions("user-1");
    const q = state.queries[0]!;
    expect(q.action).toBe("delete");
    expect(has(q, "eq", "user_id", "user-1")).toBe(true);
    expect(has(q, "neq", "token_hash", await auth.sha256Hex("current-token"))).toBe(true);
  });
});
