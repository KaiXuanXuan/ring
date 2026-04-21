/**
 * Event Module Interface
 * Provides pub/sub event communication for decoupled game logic.
 */
export interface EventModule {
  /**
   * Register an event listener.
   * @param name - Event name (camelCase, e.g., 'sceneChange', 'playerDie')
   * @param callback - Callback function to execute when event is emitted
   * @returns The callback function for chaining convenience
   */
  on(name: string, callback: Function): Function;

  /**
   * Emit an event with optional data payload.
   * Silent fail if no listeners registered for this event.
   * @param name - Event name
   * @param data - Optional data payload passed to listeners
   */
  emit(name: string, data?: any): void;

  /**
   * Remove event listener(s).
   * If callback is provided, removes only that specific listener.
   * If callback is omitted, removes all listeners for the event.
   * Silent fail if event or callback not found.
   * @param name - Event name
   * @param callback - Optional specific callback to remove
   */
  off(name: string, callback?: Function): void;

  /**
   * Remove all listeners for all events.
   */
  offAll(): void;
}

/**
 * Data Module Interface
 * Provides global state management with automatic localStorage persistence.
 */
export interface DataModule {
  /**
   * Initialize state with default values.
   * Merges with persisted state from localStorage (persisted values take precedence).
   * @param config - Configuration object with default values
   */
  init(config: { defaults: Record<string, any> }): void;

  /**
   * Set state values (partial merge).
   * Only triggers onChange if new value differs from old (strict equality ===).
   * Automatically persists to localStorage after change.
   * @param values - Partial state object to merge
   */
  setState<T extends Record<string, any>>(values: Partial<T>): void;

  /**
   * Get state value(s).
   * If key is omitted, returns entire state object.
   * If key is provided, returns specific value (undefined if missing).
   * @param key - Optional state key
   * @returns State value or entire state object
   */
  getState<T = any>(key?: string): T | undefined;

  /**
   * Subscribe to state changes for a specific key.
   * Callback receives new value and old value.
   * @param key - State key to watch
   * @param callback - Callback function with new and old values
   */
  onChange(key: string, callback: (newVal: any, oldVal: any) => void): void;

  /**
   * Unsubscribe a previously registered onChange callback for a key.
   */
  offChange(key: string, callback: (newVal: any, oldVal: any) => void): void;
}

/**
 * Scene Module Interface
 * Provides scene loading and switching with progress callbacks.
 */
export interface SceneModule {
  /**
   * Configure scene names for loading and main scenes.
   * @param config - Configuration object with optional scene names
   * @param config.loadingScene - Name of the loading scene (optional)
   * @param config.mainScene - Name of the main game scene (optional)
   */
  init(config: { loadingScene?: string; mainScene?: string }): void;

  /**
   * Preload the main scene with optional progress reporting.
   * Progress callback receives values between 0 and 1.
   * @param onProgress - Optional callback for progress updates (0-1)
   * @returns Promise that resolves when preload completes
   */
  loadMain(onProgress?: (progress: number) => void): Promise<void>;

  /**
   * Switch to the preloaded main scene.
   * Should be called after loadMain() completes.
   * Emits 'sceneChange' event with { from, to } payload.
   */
  switchToMain(): void;

  /**
   * Get the current scene name.
   * Returns the name of the currently active scene.
   */
  currentScene: string;
}

/**
 * Dialog Module Interface
 * Provides single-layer dialog management with auto-masking.
 */
export interface DialogModule {
  /**
   * Open a dialog from prefab path.
   * Closes any existing dialog first (single-layer behavior).
   * Auto-creates semi-transparent mask behind dialog.
   * Silent fail - returns undefined if prefab not found.
   * Emits 'dialogOpen' event with { node, path } payload on success.
   * @param config - Configuration object for dialog opening
   * @param config.path - Resources path to dialog prefab (e.g., 'prefabs/ConfirmDialog')
   * @param config.parent - Parent node for dialog and mask (defaults to parent set via setParent())
   * @returns Promise resolving to the dialog Node, or undefined on failure
   */
  open(config: { path: string; parent?: any }): Promise<any | undefined>; // Node from 'cc'

  /**
   * Close the current dialog.
   * Destroys both dialog and mask.
   * Emits 'dialogClose' event with { node, path } payload.
   * Safe to call when no dialog is open (no-op).
   */
  close(): void;

  /**
   * Detach dialog/mask references without destroying nodes. Used when the dialog tree will be removed by scene unload (e.g. replay).
   */
  detachOpenDialog(): void;

  /**
   * Set the default parent node for dialogs and masks.
   * Used as fallback when parent is not provided to open().
   * @param parent - Parent node (typically canvas)
   */
  setParent(parent: any): void; // Node from 'cc'
}

/**
 * Prefab Module Interface
 * Provides dynamic prefab instantiation and destruction.
 * Note: Node and Vec3 types are from 'cc' module.
 */
export interface PrefabModule {
  /**
   * Create a prefab instance at specified parent and position.
   * Loads prefab from resources, instantiates it, and sets parent/position.
   * Silent fail - returns undefined if prefab not found or load fails.
   * Emits 'prefabCreate' event with { node, path } payload on success.
   * @param config - Configuration object for prefab creation
   * @param config.path - Resources path (e.g., 'prefabs/Enemy')
   * @param config.parent - Parent node to attach the prefab instance to
   * @param config.position - Optional position (defaults to Vec3.ZERO)
   * @returns Promise resolving to the instantiated Node, or undefined on failure
   */
  create(config: {
    path: string;
    parent: any; // Node from 'cc'
    position?: any; // Vec3 from 'cc'
  }): Promise<any | undefined>; // Node from 'cc' or undefined

  /**
   * Destroy a prefab instance.
   * Emits 'prefabDestroy' event with { node, path } payload.
   * @param node - The Node instance to destroy
   */
  destroy(node: any): void; // Node from 'cc'
}

/**
 * Audio Module Interface
 * BGM (single looping track), Ambient (layered looping track) and SFX (one-shot) via resources paths.
 */
export interface AudioModule {
  /**
   * Create internal node tree and AudioSource components. Call once before playBgm / playSfx.
   * Root node is parented to the current scene.
   * @param config.persistRoot - If true, root survives scene loads (director.addPersistRootNode)
   * @param config.audio - Folder under resources/ for clips (default `audio`, i.e. resources/audio)
   * @throws Error if called twice without dispose(), or if there is no active scene
   */
  init(config?: { persistRoot?: boolean; audio?: string }): void;

  /**
   * Load BGM from resources, set loop (default true), play. Replaces any current BGM.
   * @param path - Relative to config.audio folder, no extension (e.g. `bg` → resources/audio/bg)
   */
  playBgm(path: string, options?: { volume?: number; loop?: boolean }): Promise<void>;

  stopBgm(): void;

  /**
   * Load ambient sound from resources, set loop (default true), play.
   * Plays together with BGM as a layered ambient track (e.g., bird chirping).
   * @param path - Relative to config.audio folder, no extension
   */
  playAmbient(path: string, options?: { volume?: number; loop?: boolean }): Promise<void>;

  stopAmbient(): void;

  /**
   * Play a one-shot SFX from resources.
   * @param path - Relative to config.audio folder, no extension
   * @param options.volume - Per-shot multiplier for playOneShot (default 1)
   */
  playSfx(path: string, options?: { volume?: number }): Promise<void>;

  setBgmVolume(volume: number): void;

  setSfxVolume(volume: number): void;

  setAmbientVolume(volume: number): void;

  /**
   * Stop BGM and release module references. Called by GM.destroy().
   */
  dispose(): void;
}

/**
 * GM Framework Initialization Configuration
 *
 * Optional configuration for initializing GM modules.
 * All fields are optional - modules can be initialized later via their init() methods.
 */
export interface GMInitConfig {
  /**
   * Data module configuration
   * @param defaults - Default state values (localStorage values take precedence)
   */
  data?: { defaults: Record<string, any> };

  /**
   * Scene module configuration
   * @param loadingScene - Name of the loading scene
   * @param mainScene - Name of the main game scene
   */
  scene?: { loadingScene?: string; mainScene?: string };

  /**
   * Audio module configuration
   * @param persistRoot - If true, audio node survives scene loads (default: true)
   * @param audio - Folder under resources/ for audio clips (default: 'audio')
   */
  audio?: { persistRoot?: boolean; audio?: string };
}

/**
 * GM Framework Interface
 * Global singleton providing unified access to all game framework modules.
 */
export interface GMInterface {
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

  /**
   * Initialize the GM framework.
   * Must be called before using any module.
   * @throws Error if called twice without destroy()
   */
  init(config?: GMInitConfig): void;

  /**
   * Clean up and remove GM from memory.
   * Clears all listeners, resets modules, removes window.GM reference.
   * Does NOT clear localStorage - persisted state survives.
   * Allows re-initialization after destroy.
   */
  destroy(): void;
}