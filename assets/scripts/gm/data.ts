import { sys } from 'cc';
import type { DataModule as IDataModule } from './types';

/**
 * Storage key for localStorage persistence
 */
const STORAGE_KEY = 'gm_game_state';

/**
 * Data Module Implementation
 *
 * Provides global state management with automatic localStorage persistence.
 *
 * Key behaviors (from CONTEXT.md):
 * - Strict equality (===) for change detection
 * - Generic getState<T>(key) for type inference
 * - Merge strategy: localStorage values override defaults
 * - Silent fail for missing keys, invalid setState, storage errors
 */
export class DataModule implements IDataModule {
  private state: Record<string, any> = {};
  private changeListeners: Map<string, Array<(newVal: any, oldVal: any) => void>> = new Map();

  /**
   * Initialize state with default values.
   * Merges with persisted state from localStorage (persisted takes precedence).
   * @param config - Configuration with default values
   */
  init(config: { defaults: Record<string, any> }): void {
    // Load persisted state from localStorage
    let persisted: Record<string, any> = {};
    try {
      const stored = sys.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        persisted = JSON.parse(stored);
      }
    } catch (e) {
      // Silent fail on parse error - use defaults
    }

    // Merge: defaults first, then persisted overwrites
    this.state = { ...config.defaults, ...persisted };
  }

  /**
   * Set state values (partial merge).
   * Only triggers onChange if new value differs (strict equality).
   * Automatically persists to localStorage.
   * @param values - Partial state to merge
   */
  setState<T extends Record<string, any>>(values: Partial<T>): void {
    const changes: Array<{ key: string; oldVal: any; newVal: any }> = [];

    // Track changes with strict equality check
    Object.keys(values).forEach(key => {
      const oldVal = this.state[key];
      const newVal = values[key];

      // Strict equality check - only fire if value actually changed
      if (oldVal !== newVal) {
        this.state[key] = newVal;
        changes.push({ key, oldVal, newVal });
      }
    });

    // Persist once after all changes
    if (changes.length > 0) {
      this.persist();
      // Notify listeners after persist
      changes.forEach(({ key, oldVal, newVal }) => {
        this.notifyChange(key, newVal, oldVal);
      });
    }
  }

  /**
   * Get state value(s).
   * If key omitted, returns entire state.
   * If key provided, returns specific value (undefined if missing).
   * @param key - Optional state key
   * @returns State value or entire state object
   */
  getState<T = any>(key?: string): T | undefined {
    if (key === undefined) {
      return this.state as T;
    }
    return this.state[key] as T | undefined;
  }

  /**
   * Subscribe to state changes for a specific key.
   * @param key - State key to watch
   * @param callback - Callback receiving new and old values
   */
  onChange(key: string, callback: (newVal: any, oldVal: any) => void): void {
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, []);
    }
    this.changeListeners.get(key)!.push(callback);
  }

  offChange(key: string, callback: (newVal: any, oldVal: any) => void): void {
    const list = this.changeListeners.get(key);
    if (!list) {
      return;
    }
    const idx = list.indexOf(callback);
    if (idx >= 0) {
      list.splice(idx, 1);
    }
  }

  /**
   * Notify all change listeners for a key.
   * @param key - State key that changed
   * @param newVal - New value
   * @param oldVal - Old value
   */
  private notifyChange(key: string, newVal: any, oldVal: any): void {
    const callbacks = this.changeListeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newVal, oldVal);
        } catch (e) {
          // Silent fail - don't let one callback break others
        }
      });
    }
  }

  /**
   * Persist current state to localStorage.
   */
  private persist(): void {
    try {
      sys.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      // Silent fail - storage quota or unavailable
    }
  }
}