import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getDisplayableFileUrlCandidates,
  toDisplayableFileUrl,
} from "@/lib/api/file-url";

describe("toDisplayableFileUrl / getDisplayableFileUrlCandidates", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns empty for blank values", () => {
    expect(toDisplayableFileUrl("")).toBe("");
    expect(toDisplayableFileUrl(null)).toBe("");
    expect(getDisplayableFileUrlCandidates(undefined)).toEqual([]);
  });

  it("prefers /api when page origin differs from API even if proxy mode is off", () => {
    vi.stubEnv("NEXT_PUBLIC_USE_PROXY", "false");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.fadaid.com");

    // jsdom origin is http://localhost:3000 — not the API host
    expect(
      toDisplayableFileUrl(
        "https://api.fadaid.com/uploads/1787304300283-872733348.png",
      ),
    ).toBe("/api/uploads/1787304300283-872733348.png");

    expect(
      getDisplayableFileUrlCandidates(
        "https://api.fadaid.com/uploads/1787304300283-872733348.png",
      ),
    ).toEqual([
      "/api/uploads/1787304300283-872733348.png",
      "https://api.fadaid.com/uploads/1787304300283-872733348.png",
    ]);
  });

  it("rewrites API-hosted URLs to /api when proxy mode is on", () => {
    vi.stubEnv("NEXT_PUBLIC_USE_PROXY", "true");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.fadaid.com");

    expect(
      toDisplayableFileUrl(
        "https://api.fadaid.com/uploads/1787304300283-872733348.png",
      ),
    ).toBe("/api/uploads/1787304300283-872733348.png");
  });

  it("preserves query and hash when rewriting", () => {
    vi.stubEnv("NEXT_PUBLIC_USE_PROXY", "true");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.fadaid.com");

    expect(
      toDisplayableFileUrl("https://api.fadaid.com/uploads/pic.png?v=1#top"),
    ).toBe("/api/uploads/pic.png?v=1#top");
  });

  it("leaves already-proxied and non-API URLs alone", () => {
    vi.stubEnv("NEXT_PUBLIC_USE_PROXY", "true");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.fadaid.com");

    expect(toDisplayableFileUrl("/api/uploads/pic.png")).toBe(
      "/api/uploads/pic.png",
    );
    expect(toDisplayableFileUrl("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png",
    );
    expect(toDisplayableFileUrl("blob:http://localhost/abc")).toBe(
      "blob:http://localhost/abc",
    );
  });
});
