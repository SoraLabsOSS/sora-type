/** Chromium-only Local Font Access API — not yet part of TS's lib.dom.d.ts. */
export {};

declare global {
  interface FontData {
    blob(): Promise<Blob>;
    readonly family: string;
    readonly fullName: string;
    readonly postscriptName: string;
    readonly style: string;
  }

  interface QueryLocalFontsOptions {
    postscriptNames?: string[];
  }

  interface Window {
    queryLocalFonts?: (options?: QueryLocalFontsOptions) => Promise<FontData[]>;
  }
}
