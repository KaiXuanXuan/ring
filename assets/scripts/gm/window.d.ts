/**
 * Window Global Type Declaration
 *
 * Extends the Window interface to include GM global singleton.
 * This allows TypeScript to recognize `window.GM` without errors.
 *
 * Usage:
 *   import './window.d.ts'; // Or let TypeScript auto-discover
 *   window.GM.event.on('test', callback);
 */

// This export makes the file a module (required for declare global)
export {};

declare global {
  interface Window {
    /**
     * GM Framework Global Singleton
     *
     * Access the game framework anywhere via window.GM.
     * Must call GM.init() before using any module.
     *
     * @example
     *   window.GM.init();
     *   window.GM.event.on('sceneChange', (data) => console.log(data));
     *   window.GM.data.setState({ level: 5 });
     */
    GM: import('./types').GMInterface;
  }
}