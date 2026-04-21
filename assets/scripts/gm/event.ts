import type { EventModule as IEventModule } from './types';

/**
 * Event Module Implementation
 *
 * Provides pub/sub event communication for decoupled game logic.
 * Uses Map-based listener storage for O(1) lookup by event name.
 *
 * Key behaviors (from CONTEXT.md):
 * - camelCase event naming (e.g., 'sceneChange', 'playerDie')
 * - Silent fail for emit to non-existent events
 * - Silent fail for off with wrong callback
 * - on() returns callback for chaining convenience
 */
export class EventModule implements IEventModule {
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Register an event listener.
   * @param name - Event name (camelCase)
   * @param callback - Callback function
   * @returns The callback function for chaining
   */
  on(name: string, callback: Function): Function {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }
    this.listeners.get(name)!.push(callback);
    return callback;
  }

  /**
   * Emit an event with optional data payload.
   * Silent fail if no listeners registered.
   * @param name - Event name
   * @param data - Optional data payload
   */
  emit(name: string, data?: any): void {
    const callbacks = this.listeners.get(name);
    if (!callbacks) return; // Silent fail for non-existent events

    // Call each callback, catching errors to prevent one bad callback
    // from breaking others
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        // Silent fail - don't let one callback break others
        // In production, you might want to log this
      }
    });
  }

  /**
   * Remove event listener(s).
   * If callback provided, removes only that specific listener.
   * If callback omitted, removes all listeners for the event.
   * @param name - Event name
   * @param callback - Optional specific callback to remove
   */
  off(name: string, callback?: Function): void {
    if (!callback) {
      // Remove all listeners for this event
      this.listeners.delete(name);
      return;
    }

    const callbacks = this.listeners.get(name);
    if (!callbacks) return; // Silent fail for non-existent event

    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    // Silent fail if callback not found (index === -1)
  }

  /**
   * Remove all listeners for all events.
   */
  offAll(): void {
    this.listeners.clear();
  }
}