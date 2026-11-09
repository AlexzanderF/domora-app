import { describe, expect, it } from "vitest";
import { sniffImageType } from "./sniff";

const bytes = (...values: number[]) => Uint8Array.from(values);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

describe("sniffImageType", () => {
  it("recognises a JPEG by its magic bytes", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe(
      "image/jpeg",
    );
  });

  it("recognises a PNG by its magic bytes", () => {
    expect(
      sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)),
    ).toBe("image/png");
  });

  it("recognises a WebP by its RIFF/WEBP container", () => {
    const webp = bytes(
      ...ascii("RIFF"),
      0x10,
      0,
      0,
      0,
      ...ascii("WEBP"),
      ...ascii("VP8 "),
    );
    expect(sniffImageType(webp)).toBe("image/webp");
  });

  it("rejects a RIFF container that is not WebP", () => {
    const wav = bytes(...ascii("RIFF"), 0x10, 0, 0, 0, ...ascii("WAVE"));
    expect(sniffImageType(wav)).toBeNull();
  });

  it("rejects other image types and arbitrary bytes", () => {
    expect(sniffImageType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(sniffImageType(bytes(...ascii("<svg xmlns=")))).toBeNull();
    expect(sniffImageType(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});
