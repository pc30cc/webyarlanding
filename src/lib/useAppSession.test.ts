import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAppSession } from "./useAppSession";

const SESSION_URL = "https://app.webyar.app/api/auth/session";
const LOGOUT_URL = "https://app.webyar.app/api/auth/logout";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe("useAppSession", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("no sessionCheckUrl configured -> loggedOut immediately, never calls fetch", () => {
    const { result } = renderHook(() => useAppSession("", ""));
    expect(result.current.status).toBe("loggedOut");
    expect(result.current.user).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // 1) authenticated session response
  it("authenticated session response -> loggedIn with the user object, GET + credentials include", async () => {
    const user = { id: "u1", email: "ali@example.com", emailVerified: true, fullName: "علی محمدی" };
    mockFetch.mockResolvedValueOnce(jsonResponse({ user }));

    const { result } = renderHook(() => useAppSession(SESSION_URL, LOGOUT_URL));
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("loggedIn"));
    expect(result.current.user).toEqual(user);
    expect(mockFetch).toHaveBeenCalledWith(
      SESSION_URL,
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  // 2) {user:null} logged-out response
  it("{ user: null } with HTTP 200 -> loggedOut", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ user: null }));

    const { result } = renderHook(() => useAppSession(SESSION_URL, ""));
    await waitFor(() => expect(result.current.status).toBe("loggedOut"));
    expect(result.current.user).toBeNull();
  });

  // 3) logout success
  it("logout success -> POSTs to logoutUrl with credentials include and clears state immediately", async () => {
    const user = { id: "u1", email: "ali@example.com", emailVerified: true, fullName: "علی" };
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ user }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));

    const { result } = renderHook(() => useAppSession(SESSION_URL, LOGOUT_URL));
    await waitFor(() => expect(result.current.status).toBe("loggedIn"));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockFetch).toHaveBeenLastCalledWith(
      LOGOUT_URL,
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(result.current.status).toBe("loggedOut");
    expect(result.current.user).toBeNull();
  });

  it("logout network failure still clears local state (header never stays stuck as logged in)", async () => {
    const user = { id: "u1", email: "ali@example.com", emailVerified: true, fullName: "علی" };
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ user }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useAppSession(SESSION_URL, LOGOUT_URL));
    await waitFor(() => expect(result.current.status).toBe("loggedIn"));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.status).toBe("loggedOut");
    expect(result.current.user).toBeNull();
  });

  // 4) network/CORS failure fallback
  it("network/CORS failure (fetch rejects) -> falls back to loggedOut, never throws", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useAppSession(SESSION_URL, ""));
    await waitFor(() => expect(result.current.status).toBe("loggedOut"));
    expect(result.current.user).toBeNull();
  });

  it("non-2xx response (e.g. endpoint not built yet) -> falls back to loggedOut", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, false, 404));

    const { result } = renderHook(() => useAppSession(SESSION_URL, ""));
    await waitFor(() => expect(result.current.status).toBe("loggedOut"));
  });

  // 5) missing fullName
  it("empty fullName is preserved as-is on the user object (the header decides the greeting fallback)", async () => {
    const user = { id: "u1", email: "ali@example.com", emailVerified: false, fullName: "" };
    mockFetch.mockResolvedValueOnce(jsonResponse({ user }));

    const { result } = renderHook(() => useAppSession(SESSION_URL, ""));
    await waitFor(() => expect(result.current.status).toBe("loggedIn"));
    expect(result.current.user?.fullName).toBe("");
    expect(result.current.user?.email).toBe("ali@example.com");
  });

  it("does not refetch on re-render with the same sessionCheckUrl (no request loop)", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ user: null }));
    const { result, rerender } = renderHook(({ url }: { url: string }) => useAppSession(url, ""), {
      initialProps: { url: SESSION_URL },
    });
    await waitFor(() => expect(result.current.status).toBe("loggedOut"));
    const callsAfterFirstLoad = mockFetch.mock.calls.length;

    rerender({ url: SESSION_URL });
    rerender({ url: SESSION_URL });

    expect(mockFetch.mock.calls.length).toBe(callsAfterFirstLoad);
  });
});
