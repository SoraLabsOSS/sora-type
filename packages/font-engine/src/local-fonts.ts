export interface LocalFontEntry {
  fontData: FontData;
  id: string;
  label: string;
}

export type LocalFontPermissionState = "denied" | "granted" | "prompt";

export function isLocalFontAccessSupported(): boolean {
  return typeof window !== "undefined" && "queryLocalFonts" in window;
}

/**
 * Reads the current `local-fonts` permission without triggering the browser
 * prompt. Returns `null` when the Local Font Access API is unavailable.
 */
export async function queryLocalFontPermission(): Promise<LocalFontPermissionState | null> {
  if (!isLocalFontAccessSupported()) {
    return null;
  }

  if (!navigator.permissions?.query) {
    return "prompt";
  }

  try {
    const status = await navigator.permissions.query({
      name: "local-fonts" as PermissionName,
    });
    return status.state as LocalFontPermissionState;
  } catch {
    return "prompt";
  }
}

/**
 * Subscribes to `local-fonts` permission changes (e.g. after the user updates
 * site settings and reloads). Invokes `callback` immediately with the current
 * state, then on every subsequent change.
 */
export async function subscribeLocalFontPermission(
  callback: (state: LocalFontPermissionState) => void
): Promise<() => void> {
  if (!isLocalFontAccessSupported()) {
    return () => {
      return;
    };
  }

  if (!navigator.permissions?.query) {
    callback("prompt");
    return () => {
      return;
    };
  }

  try {
    const status = await navigator.permissions.query({
      name: "local-fonts" as PermissionName,
    });
    callback(status.state as LocalFontPermissionState);

    const onChange = () => {
      callback(status.state as LocalFontPermissionState);
    };
    status.addEventListener("change", onChange);
    return () => {
      status.removeEventListener("change", onChange);
    };
  } catch {
    callback("prompt");
    return () => {
      return;
    };
  }
}

/**
 * Lists every font installed on the user's system, prompting for the
 * `local-fonts` permission on first call if needed. Rejects with
 * `NotAllowedError` if the user denies the prompt.
 */
export async function loadLocalFonts(): Promise<LocalFontEntry[]> {
  if (!window.queryLocalFonts) {
    throw new Error("Local Font Access API is not supported in this browser");
  }

  const fonts = await window.queryLocalFonts();
  return fonts
    .map((fontData) => ({
      fontData,
      id: fontData.postscriptName || fontData.fullName,
      label: fontData.fullName || fontData.postscriptName,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Reads a locally-installed font's raw bytes, same shape as `File#arrayBuffer()`. */
export async function readLocalFontBuffer(
  fontData: FontData
): Promise<ArrayBuffer> {
  const blob = await fontData.blob();
  return blob.arrayBuffer();
}
