import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../auth-store";

describe("useAuthStore Zustand Store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, hydrated: false });
  });

  it("sets auth token in state and localStorage", () => {
    useAuthStore.getState().setToken("mock-jwt-token");

    expect(useAuthStore.getState().token).toBe("mock-jwt-token");
    expect(localStorage.getItem("token")).toBe("mock-jwt-token");
  });

  it("clears auth token on logout from state and localStorage", () => {
    useAuthStore.getState().setToken("mock-jwt-token");
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("hydrates auth token from localStorage when available", () => {
    localStorage.setItem("token", "stored-token-123");
    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().token).toBe("stored-token-123");
    expect(useAuthStore.getState().hydrated).toBe(true);
  });
});
