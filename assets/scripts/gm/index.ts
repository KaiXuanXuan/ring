/**
 * GM Framework - Main Entry Point
 *
 * Provides global singleton access to game framework modules.
 *
 * Usage:
 *   import { initGM } from './gm';
 *   initGM();
 *
 *   // Then anywhere in your code:
 *   window.GM.event.on('sceneChange', callback);
 *   window.GM.data.setState({ level: 5 });
 */

import { EventModule } from './event';
import { DataModule } from './data';
import { SceneModule } from './scene';
import { PrefabModule } from './prefab';
import { DialogModule } from './dialog';
import { AudioModule } from './audio';
import type { GMInterface, GMInitConfig } from './types';
import './window.d.ts'; // Ensure Window interface is extended

/**
 * GM Framework Singleton Implementation
 */
class GM implements GMInterface {
  /** Event communication module */
  event: EventModule;

  /** State management module with persistence */
  data: DataModule;

  /** Scene loading and switching module */
  scene: SceneModule;

  /** Prefab instantiation and destruction module */
  prefab: PrefabModule;

  /** Dialog management module with auto-masking */
  dialog: DialogModule;

  /** Background music and sound effects */
  audio: AudioModule;

  /** Tracks whether init() has been called */
  private initialized: boolean = false;

  constructor() {
    this.event = new EventModule();
    this.data = new DataModule();
    this.scene = new SceneModule(this.event);
    this.prefab = new PrefabModule(this.event);
    this.dialog = new DialogModule(this.event, this.prefab);
    this.audio = new AudioModule();
  }

  /**
   * Initialize the GM framework.
   * Must be called before using any module.
   * @throws Error if called twice without destroy()
   */
  init(config?: GMInitConfig): void {
    if (this.initialized) {
      throw new Error('GM.init() called twice. Call GM.destroy() first.');
    }
    this.initialized = true;

    // Initialize data module if config provided
    if (config?.data?.defaults) {
      this.data.init({ defaults: config.data.defaults });
    }

    // Initialize scene module if config provided (empty object uses defaults)
    if (config?.scene !== undefined) {
      const sceneConfig = {
        loadingScene: config.scene?.loadingScene ?? 'Loading',
        mainScene: config.scene?.mainScene ?? 'Main'
      };
      this.scene.init(sceneConfig);
    }

    // Initialize audio module if config provided (empty object uses defaults)
    if (config?.audio !== undefined) {
      const audioConfig: { persistRoot: boolean; audio?: string } = {
        persistRoot: config.audio?.persistRoot ?? true,
        audio: config.audio?.audio ?? 'audio'
      };
      this.audio.init(audioConfig);
    }
  }

  /**
   * Clean up and remove GM from memory.
   * - Clears all event listeners
   * - Resets modules to fresh state
   * - Removes window.GM reference
   * - Does NOT clear localStorage (persisted state survives)
   * - Allows re-initialization after destroy
   */
  destroy(): void {
    // Clear all event listeners
    this.event.offAll();

    this.audio.dispose();

    // Reset modules to fresh state
    this.event = new EventModule();
    this.data = new DataModule();
    this.scene = new SceneModule(this.event);
    this.prefab = new PrefabModule(this.event);
    this.dialog = new DialogModule(this.event, this.prefab);
    this.audio = new AudioModule();

    // Reset initialization flag
    this.initialized = false;

    // Remove global reference
    if (typeof window !== 'undefined') {
      delete (window as any).GM;
    }

    // Clear module-level instance
    instance = null;
  }
}

/** Module-level singleton instance */
let instance: GMInterface | null = null;

/**
 * Initialize the GM framework and attach to window.
 * This is the recommended way to start using GM.
 *
 * @param config - Optional configuration for initializing data, scene, and audio modules
 *
 * @example
 *   import { initGM } from './gm';
 *
 *   // Basic initialization (no modules configured)
 *   initGM();
 *
 *   // Initialize all modules at once
 *   initGM({
 *     data: { defaults: { level: 1, score: 0 } },
 *     scene: { loadingScene: 'Loading', mainScene: 'Main' },
 *     audio: { audio: 'audio' }  // persistRoot defaults to true
 *   });
 *
 * @throws Error if GM already initialized
 */
export function initGM(config?: GMInitConfig): void {
  if (instance) {
    throw new Error('GM already initialized. Call GM.destroy() first.');
  }
  instance = new GM();
  instance.init(config);
  if (typeof window !== 'undefined') {
    window.GM = instance;
  }
}

/**
 * Get the GM instance without attaching to window.
 * Useful for testing or non-browser environments.
 *
 * @returns GM instance or null if not initialized
 */
export function getGM(): GMInterface | null {
  return instance;
}

// Re-export types for convenience
export type { GMInterface, GMInitConfig, EventModule as IEventModule, DataModule as IDataModule, SceneModule as ISceneModule, PrefabModule as IPrefabModule, DialogModule as IDialogModule, AudioModule as IAudioModule } from './types';
export { EventModule, DataModule, SceneModule, PrefabModule, DialogModule, AudioModule };