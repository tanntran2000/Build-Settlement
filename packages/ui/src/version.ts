export const RELEASE_STAGE = 'Alpha';
export function versionLabel(version: string, stage: string): string { return `v${version} ${stage}`; }
export const APP_VERSION = typeof __APP_VERSION__ === 'undefined' ? 'unknown' : __APP_VERSION__;
export const BUILD_SHA = typeof __BUILD_SHA__ === 'undefined' ? 'unknown' : __BUILD_SHA__;
