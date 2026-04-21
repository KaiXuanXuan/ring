/**
 * SceneModule - Scene loading and switching with progress callbacks
 *
 * Provides scene configuration, preloading with progress tracking,
 * and scene transitions with event emission.
 */

import { director } from 'cc';
import type { SceneModule as ISceneModule, EventModule } from './types';

/**
 * SceneModule Implementation
 * Wraps Cocos Creator director API for scene management.
 */
export class SceneModule implements ISceneModule {
  private loadingScene?: string;
  private mainScene?: string;
  private event: EventModule;

  constructor(event: EventModule) {
    this.event = event;
  }

  /**
   * Configure scene names for loading and main scenes.
   * @param config - Configuration object with optional scene names
   */
  init(config: { loadingScene?: string; mainScene?: string }): void {
    this.loadingScene = config.loadingScene;
    this.mainScene = config.mainScene;
  }

  /**
   * Preload the main scene with optional progress reporting.
   * Progress callback receives values between 0 and 1.
   * @param onProgress - Optional callback for progress updates (0-1)
   * @returns Promise that resolves when preload completes
   */
  loadMain(onProgress?: (progress: number) => void): Promise<void> {
    if (!this.mainScene) {
      console.warn('[SceneModule] mainScene not configured. Call init() first.');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      director.preloadScene(
        this.mainScene!,
        (completedCount: number, totalCount: number) => {
          if (onProgress && totalCount > 0) {
            onProgress(completedCount / totalCount);
          }
        },
        (error: Error | null) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        }
      );
    });
  }

  /**
   * Switch to the preloaded main scene.
   * Should be called after loadMain() completes.
   * Emits 'sceneChange' event with { from, to } payload.
   */
  switchToMain(): void {
    if (!this.mainScene) {
      console.warn('[SceneModule] mainScene not configured. Call init() first.');
      return;
    }

    // Get current scene name before switching
    const from = director.getScene()?.name ?? '';

    // Switch to main scene
    director.loadScene(this.mainScene);

    // Get new scene name after switching
    const to = director.getScene()?.name ?? '';

    // Emit scene change event
    this.event.emit('sceneChange', { from, to });
  }

  /**
   * Get the current scene name.
   * Returns the name of the currently active scene.
   */
  get currentScene(): string {
    return director.getScene()?.name ?? '';
  }
}