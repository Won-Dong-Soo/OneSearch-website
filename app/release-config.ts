import releaseManifest from "../public/release-manifest.json";

export type Platform = keyof typeof releaseManifest.releases;

export type ReleaseConfig = {
  id: Platform;
  name: string;
  accent: "teal" | "magenta";
  detail: string;
  requirement: string;
  filename: string;
  bytes: number;
  sha256: string;
  verification: string;
  key: string;
  contentType: string;
};

export const releaseVersion = releaseManifest.version;

export const releaseConfig: Record<Platform, ReleaseConfig> = {
  mac: {
    id: "mac",
    name: "macOS",
    accent: "teal",
    detail: "Apple Silicon · DMG",
    requirement: "macOS 11 이상",
    ...releaseManifest.releases.mac,
    key: `releases/${releaseManifest.releases.mac.filename}`,
    contentType: "application/x-apple-diskimage",
  },
  windows: {
    id: "windows",
    name: "Windows",
    accent: "magenta",
    detail: "64-bit · EXE",
    requirement: "Windows 10/11",
    ...releaseManifest.releases.windows,
    key: `releases/${releaseManifest.releases.windows.filename}`,
    contentType: "application/vnd.microsoft.portable-executable",
  },
};

export const releaseList = [releaseConfig.mac, releaseConfig.windows];

export function getReleaseConfig(value: string): ReleaseConfig | null {
  return value === "mac" || value === "windows" ? releaseConfig[value] : null;
}

export function formatFileSize(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}
