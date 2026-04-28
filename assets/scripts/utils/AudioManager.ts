/**
 * Audio Manager Utility
 *
 * Provides public functions for playing BGM and SFX that respect user settings.
 * All audio playback should go through these utilities to ensure consistency.
 */

// GM is attached to window after initialization
declare const GM: any;

/**
 * Play background music if BGM is enabled in user settings
 *
 * @param path - Path relative to audio folder (no extension), e.g., 'oneWaybgm.audioclip'
 * @param options - Optional volume and loop settings
 * @returns Promise that resolves when BGM starts playing or is skipped due to setting
 */
export async function playBGM(
  path: string,
  options?: { volume?: number; loop?: boolean }
): Promise<void> {
  const bgmEnabled = window.GM?.data?.getState<boolean>('bgm');
  if (bgmEnabled === false) {
    return;
  }
  GM.audio.setBgmVolume(options?.volume ?? 1);
  await GM.audio.playBgm(path, options).catch(() => {});
}

/**
 * Play sound effect if SFX is enabled in user settings
 *
 * @param path - Path relative to audio folder (no extension), e.g., '点击', '解环'
 * @param options - Optional volume setting
 * @returns Promise that resolves when SFX plays or is skipped due to setting
 */
export async function playSFX(
  path: string,
  options?: { volume?: number }
): Promise<void> {
  const sfxEnabled = window.GM?.data?.getState<boolean>('sfx');
  if (sfxEnabled === false) {
    return;
  }
  await GM.audio.playSfx(path, options).catch(() => {});
}

/**
 * Stop background music playback
 */
export function stopBGM(): void {
  GM.audio.stopBgm();
}

/**
 * Set BGM volume (0-1)
 * @param volume - Volume level from 0 to 1
 */
export function setBGMVolume(volume: number): void {
  GM.audio.setBgmVolume(volume);
}

/**
 * Set SFX volume (0-1)
 * @param volume - Volume level from 0 to 1
 */
export function setSFXVolume(volume: number): void {
  GM.audio.setSfxVolume(volume);
}