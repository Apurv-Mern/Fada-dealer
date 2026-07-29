import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAsyncResource } from "@/lib/hooks/use-async-resource";

describe("useAsyncResource", () => {
  it("loads data for a key", async () => {
    const loader = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useAsyncResource({ key: "a", loader }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.error).toBeNull();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("cancels stale responses when key changes", async () => {
    let resolveFirst!: (value: string) => void;
    const first = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const loader = vi
      .fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValueOnce("second");

    const { result, rerender } = renderHook(
      ({ key }) => useAsyncResource({ key, loader }),
      { initialProps: { key: "1" } },
    );

    rerender({ key: "2" });
    await waitFor(() => expect(result.current.data).toBe("second"));

    await act(async () => {
      resolveFirst("first");
    });

    expect(result.current.data).toBe("second");
  });

  it("retry reloads", async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok");

    const { result } = renderHook(() =>
      useAsyncResource({ key: "r", loader }),
    );

    await waitFor(() => expect(result.current.error).toBeTruthy());
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.data).toBe("ok"));
  });
});
