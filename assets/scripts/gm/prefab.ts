/**
 * Prefab Module Implementation
 * Provides async prefab loading, instantiation, and destruction.
 */

import { resources, instantiate, Node, Vec3, Prefab } from 'cc';
import type { PrefabModule as IPrefabModule, EventModule } from './types';

/**
 * PrefabModule Implementation
 * Handles dynamic prefab instantiation from resources with event emission.
 */
export class PrefabModule implements IPrefabModule {
  /** Event module reference for emitting prefab events */
  private event: EventModule;

  /**
   * Create a PrefabModule instance.
   * @param event - EventModule reference for emitting 'prefabCreate' and 'prefabDestroy' events
   */
  constructor(event: EventModule) {
    this.event = event;
  }

  /** Ensure instantiated prefab tree inherits parent's render layer. */
  private syncLayerRecursively(node: Node, layer: number): void {
    node.layer = layer;
    for (const child of node.children) {
      this.syncLayerRecursively(child, layer);
    }
  }

  /**
   * Create a prefab instance from resources.
   * Loads the prefab, instantiates it, sets parent and position.
   * Emits 'prefabCreate' event on success.
   * Silent fail - returns undefined if loading fails.
   *
   * @param config - Configuration object
   * @param config.path - Resources path to the prefab (e.g., 'prefabs/Enemy')
   * @param config.parent - Parent node to attach the prefab instance to
   * @param config.position - Optional position (defaults to Vec3.ZERO)
   * @returns Promise resolving to the instantiated Node, or undefined on failure
   */
  async create(config: {
    path: string;
    parent: Node;
    position?: Vec3;
  }): Promise<Node | undefined> {
    const { path, parent, position } = config;

    // Validate required parameters
    if (!path || !parent) {
      return undefined;
    }

    // Wrap resources.load in Promise
    return new Promise<Node | undefined>((resolve) => {
      resources.load(path, Prefab, (err, prefab) => {
        if (err) {
          console.error(`[PrefabModule] Failed to load prefab: ${path}`, err);
          resolve(undefined);
          return;
        }

        // Instantiate the prefab
        const node = instantiate(prefab) as Node;

        // Set parent
        node.setParent(parent);

        // Sync layer recursively to inherit parent's render layer
        this.syncLayerRecursively(node, parent.layer);

        // Set position (default to Vec3.ZERO if not provided)
        node.setPosition(position ?? Vec3.ZERO);

        // Emit prefabCreate event
        this.event.emit('prefabCreate', { node, path });

        resolve(node);
      });
    });
  }

  /**
   * Destroy a prefab instance.
   * Calls node.destroy() and emits 'prefabDestroy' event.
   *
   * @param node - The node to destroy
   */
  destroy(node: Node): void {
    if (!node) {
      return;
    }

    // Emit prefabDestroy event before destruction
    this.event.emit('prefabDestroy', { node });

    // Destroy the node
    node.destroy();
  }
}