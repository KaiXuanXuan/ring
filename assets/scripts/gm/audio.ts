/**
 * Audio Module Implementation
 *
 * Provides BGM (single looping track), Ambient (layered looping track) and SFX (one-shot) via resources paths
 * using separate AudioSource components for independent volume control.
 * BGM/Ambient use play(), SFX uses playOneShot().
 */

import { AudioClip, AudioSource, Node, director, resources } from 'cc';
import type { AudioModule as IAudioModule } from './types';

/**
 * AudioModule Implementation
 *
 * Loads AudioClip from resources with in-memory cache and in-flight deduplication.
 * BGM uses loop playback; Ambient uses loop playback (plays together with BGM); SFX uses playOneShot (does not interrupt BGM).
 * AudioSource components are lazily created on first use.
 */
export class AudioModule implements IAudioModule {
  /** Root node created in init(); holds BGM, Ambient and SFX AudioSource components (lazily added) */
  private soundRoot: Node | null = null;

  /** True if soundRoot was registered with director.addPersistRootNode */
  private persistRoot = false;

  /** AudioSource for background music (loop playback) */
  private bgmSource: AudioSource | null = null;

  /** AudioSource for ambient sound (loop playback, layered with BGM) */
  private ambientSource: AudioSource | null = null;

  /** AudioSource for sound effects (one-shot playback) */
  private sfxSource: AudioSource | null = null;

  /** True after init() succeeds */
  private initialized = false;

  /** Loaded clips keyed by resources path */
  private readonly clipCache = new Map<string, AudioClip>();

  /** Ongoing load promises per path (dedupe concurrent loads) */
  private readonly clipLoading = new Map<string, Promise<AudioClip>>();

  /**
   * Resources folder name (under assets/resources/) for `playBgm` / `playSfx` paths; default `audio`.
   */
  private audioFolder = 'audio';

  /**
   * Create internal root node (`GM_Audio`) and optionally make it persist across scenes.
   * BGM and SFX AudioSource components are lazily added on first use.
   *
   * @param config.persistRoot - If true, `director.addPersistRootNode` on the created root (survives scene switches)
   * @param config.audio - Subfolder under resources for clips (default `audio` → `resources/audio/...`)
   * @throws Error if called twice without dispose(), or if there is no active scene
   */
  init(config?: { persistRoot?: boolean; audio?: string }): void {
    if (this.initialized) {
      throw new Error('[AudioModule] init() called twice. Call dispose() first.');
    }
    const scene = director.getScene();
    if (scene == null) {
      throw new Error('[AudioModule] init() requires an active scene.');
    }
    const folder = config?.audio?.trim();
    this.audioFolder = folder != null && folder.length > 0 ? folder : 'audio';

    const root = new Node('GM_Audio');
    scene.addChild(root);

    if (config?.persistRoot === true) {
      director.addPersistRootNode(root);
      this.persistRoot = true;
    }

    this.soundRoot = root;
    this.initialized = true;
  }

  /**
   * Load BGM from resources, assign clip, set loop (default true), and play.
   * Stops any current BGM before switching tracks.
   *
   * @param path - Path relative to `audioFolder`, no extension (e.g. `bg` → `resources/audio/bg`)
   * @param options.volume - Optional volume 0–1 applied before play
   * @param options.loop - Loop playback (default true)
   * @returns Promise that rejects if the clip fails to load
   */
  async playBgm(path: string, options?: { volume?: number; loop?: boolean }): Promise<void> {
    const src = this.getOrCreateBgmSource();
    const clip = await this.loadClip(path);
    src.stop();
    src.clip = clip;
    src.loop = options?.loop ?? true;
    if (options?.volume != null) {
      src.volume = options.volume;
    }
    src.play();
  }

  /**
   * Stop BGM playback. No-op if BGM AudioSource was never created.
   */
  stopBgm(): void {
    if (this.bgmSource == null) {
      return;
    }
    this.bgmSource.stop();
  }

  /**
   * Load ambient sound from resources, assign clip, set loop (default true), and play.
   * Plays together with BGM as a layered ambient track (e.g., bird chirping).
   *
   * @param path - Path relative to `audioFolder`, no extension (e.g. `bird` → `resources/audio/bird`)
   * @param options.volume - Optional volume 0–1 applied before play
   * @param options.loop - Loop playback (default true)
   * @returns Promise that rejects if the clip fails to load
   */
  async playAmbient(path: string, options?: { volume?: number; loop?: boolean }): Promise<void> {
    const src = this.getOrCreateAmbientSource();
    const clip = await this.loadClip(path);
    src.stop();
    src.clip = clip;
    src.loop = options?.loop ?? true;
    if (options?.volume != null) {
      src.volume = options.volume;
    }
    src.play();
  }

  /**
   * Stop ambient playback. No-op if Ambient AudioSource was never created.
   */
  stopAmbient(): void {
    if (this.ambientSource == null) {
      return;
    }
    this.ambientSource.stop();
  }

  /**
   * Load an SFX clip and play it once via playOneShot.
   * Does not interrupt BGM playback.
   *
   * @param path - Path relative to `audioFolder`, no extension
   * @param options.volume - Multiplier passed to playOneShot (default 1)
   * @returns Promise that rejects if the clip fails to load
   */
  async playSfx(path: string, options?: { volume?: number }): Promise<void> {
    const src = this.getOrCreateSfxSource();
    const clip = await this.loadClip(path);
    src.playOneShot(clip, options?.volume ?? 1);
  }

  /**
   * Set BGM AudioSource volume (0–1).
   * @throws Error if init() was not called
   */
  setBgmVolume(volume: number): void {
    this.getOrCreateBgmSource().volume = volume;
  }

  /**
   * Set SFX AudioSource volume (0–1); affects subsequent playOneShot scaling baseline.
   * @throws Error if init() was not called
   */
  setSfxVolume(volume: number): void {
    this.getOrCreateSfxSource().volume = volume;
  }

  /**
   * Set Ambient AudioSource volume (0–1).
   * @throws Error if init() was not called
   */
  setAmbientVolume(volume: number): void {
    this.getOrCreateAmbientSource().volume = volume;
  }

  /**
   * Stop BGM, destroy internal nodes if created, clear caches.
   * Invoked by GM.destroy(); typically not called directly.
   */
  dispose(): void {
    if (this.bgmSource != null) {
      this.bgmSource.stop();
    }
    this.bgmSource = null;
    if (this.ambientSource != null) {
      this.ambientSource.stop();
    }
    this.ambientSource = null;
    this.sfxSource = null;
    this.initialized = false;
    this.audioFolder = 'audio';
    this.clipCache.clear();
    this.clipLoading.clear();

    if (this.soundRoot != null) {
      if (this.persistRoot) {
        director.removePersistRootNode(this.soundRoot);
        this.persistRoot = false;
      }
      this.soundRoot.destroy();
      this.soundRoot = null;
    }
  }

  /**
   * Get or lazily create the BGM AudioSource component on the root node.
   * @throws Error if init() was not called
   */
  private getOrCreateBgmSource(): AudioSource {
    if (!this.initialized || this.soundRoot == null) {
      throw new Error('[AudioModule] call init() before using BGM.');
    }
    if (this.bgmSource == null) {
      this.bgmSource = this.soundRoot.addComponent(AudioSource);
    }
    return this.bgmSource;
  }

  /**
   * Get or lazily create the SFX AudioSource component on the root node.
   * @throws Error if init() was not called
   */
  private getOrCreateSfxSource(): AudioSource {
    if (!this.initialized || this.soundRoot == null) {
      throw new Error('[AudioModule] call init() before using SFX.');
    }
    if (this.sfxSource == null) {
      this.sfxSource = this.soundRoot.addComponent(AudioSource);
    }
    return this.sfxSource;
  }

  /**
   * Get or lazily create the Ambient AudioSource component on the root node.
   * @throws Error if init() was not called
   */
  private getOrCreateAmbientSource(): AudioSource {
    if (!this.initialized || this.soundRoot == null) {
      throw new Error('[AudioModule] call init() before using Ambient.');
    }
    if (this.ambientSource == null) {
      this.ambientSource = this.soundRoot.addComponent(AudioSource);
    }
    return this.ambientSource;
  }

  /**
   * Resolve `resources/{audioFolder}/{relativePath}` for resources.load.
   */
  private resolveClipPath(relativePath: string): string {
    const p = relativePath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
    return `${this.audioFolder}/${p}`;
  }

  /**
   * Load AudioClip from resources with cache and single in-flight load per path.
   *
   * @param relativePath - Path relative to audioFolder (no extension)
   * @returns Promise that resolves to the clip or rejects on load failure
   */
  private loadClip(relativePath: string): Promise<AudioClip> {
    const fullPath = this.resolveClipPath(relativePath);
    const cached = this.clipCache.get(fullPath);
    if (cached != null) {
      return Promise.resolve(cached);
    }
    const existing = this.clipLoading.get(fullPath);
    if (existing != null) {
      return existing;
    }
    const task = new Promise<AudioClip>((resolve, reject) => {
      resources.load(fullPath, AudioClip, (err, clip) => {
        if (err != null || clip == null) {
          reject(new Error(`[AudioModule] failed to load AudioClip: ${fullPath}`));
          return;
        }
        this.clipCache.set(fullPath, clip);
        resolve(clip);
      });
    });
    task.then(
      () => {
        this.clipLoading.delete(fullPath);
      },
      () => {
        this.clipLoading.delete(fullPath);
      }
    );
    this.clipLoading.set(fullPath, task);
    return task;
  }
}
