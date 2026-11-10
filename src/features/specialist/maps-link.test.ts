import { describe, expect, it } from "vitest";
import { mapsSearchUrl } from "./maps-link";

describe("mapsSearchUrl", () => {
  it("builds a Google Maps search URL with the encoded address", () => {
    const url = new URL(mapsSearchUrl("ул. Витоша 5, София"));
    expect(url.origin + url.pathname).toBe(
      "https://www.google.com/maps/search/",
    );
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("ул. Витоша 5, София");
  });

  it("trims the address and escapes URL-significant characters", () => {
    expect(mapsSearchUrl("  A&B #1 ")).toBe(
      "https://www.google.com/maps/search/?api=1&query=A%26B%20%231",
    );
  });
});
