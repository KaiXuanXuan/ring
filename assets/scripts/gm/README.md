# GM Framework

GM (Game Manager) Framework - Cocos Creator 3.x 通用游戏框架，提供全局单例访问游戏模块。

**核心价值**: 简单、可配置、单入口的游戏框架，处理常见的游戏开发模式（场景切换、事件通信、弹窗管理、状态持久化），避免过度复杂。

---

## 快速开始

### 初始化

在游戏入口（如 Loading 场景的脚本）中初始化 GM：

```typescript
import { initGM } from './gm';

// 方式一：一次性初始化所有模块（推荐）
initGM({
  data: {
    defaults: {
      level: 1,
      score: 0,
      playerName: 'Player'
    }
  },
  scene: {
    loadingScene: 'Loading',  // 默认: 'Loading'
    mainScene: 'Main'         // 默认: 'Main'
  },
  audio: {
    audio: 'audio',           // 默认: 'audio'
    persistRoot: true         // 默认: true，跨场景播放 BGM
  }
});

// 方式二：使用空对象，全部使用默认配置
initGM({
  data: { defaults: { level: 1 } },
  scene: {},     // 使用默认场景名 'Loading' 和 'Main'
  audio: {}      // 使用默认配置：audio 目录 'audio'，persistRoot: true
});

// 方式三：基础初始化，稍后单独配置各模块
initGM();

// 稍后单独初始化
window.GM.data.init({ defaults: { level: 1 } });
window.GM.scene.init({ loadingScene: 'Loading', mainScene: 'Main' });
window.GM.audio.init({ audio: 'audio' });
```

### 在任意脚本中使用

```typescript
// 发送事件
window.GM.event.emit('playerDie', { reason: 'collision' });

// 获取状态
const level = window.GM.data.getState<number>('level');

// 打开弹窗
window.GM.dialog.open({ path: 'prefabs/ConfirmDialog' });
```

---

## 模块概览

| 模块 | 功能描述 |
|------|----------|
| `event` | 发布/订阅事件通信，解耦游戏逻辑 |
| `data` | 全局状态管理，自动 localStorage 持久化 |
| `scene` | 场景预加载与切换，支持进度回调 |
| `prefab` | 动态 Prefab 实例化与销毁 |
| `dialog` | 弹窗管理，自动遮罩层，单层模式 |
| `audio` | 背景音乐（BGM）、环境音（Ambient）与音效（SFX） |

---

## 模块使用示例

### EventModule - 事件通信

```typescript
// 注册监听器
const onSceneChange = window.GM.event.on('sceneChange', (data) => {
  console.log(`场景切换: ${data.from} -> ${data.to}`);
});

// 发送事件（带数据）
window.GM.event.emit('playerDie', { reason: 'collision' });

// 移除特定监听器
window.GM.event.off('sceneChange', onSceneChange);

// 移除该事件的所有监听器
window.GM.event.off('sceneChange');

// 清除所有事件监听器
window.GM.event.offAll();
```

**特性**:
- 事件名使用 camelCase（如 `sceneChange`、`playerDie`）
- 发送到不存在的事件时静默失败
- `on()` 返回回调函数，便于链式调用和后续移除

---

### DataModule - 状态管理

```typescript
// 初始化（带默认值，localStorage 中的值优先）
window.GM.data.init({
  defaults: {
    level: 1,
    score: 0,
    playerName: 'Player',
    settings: { sound: true, music: true }
  }
});

// 设置状态（部分合并）
window.GM.data.setState({ level: 5, score: 1000 });

// 获取单个值（类型推断）
const level = window.GM.data.getState<number>('level'); // 5

// 获取完整状态对象
const allState = window.GM.data.getState();

// 监听状态变化
window.GM.data.onChange('score', (newVal, oldVal) => {
  console.log(`分数变化: ${oldVal} -> ${newVal}`);
});
```

**特性**:
- 自动持久化到 localStorage（key: `gm_game_state`）
- 使用严格相等（`===`）检测变化，仅在实际变化时触发回调
- localStorage 中的值覆盖默认值

---

### SceneModule - 场景管理

```typescript
// 配置场景名称
window.GM.scene.init({
  loadingScene: 'Loading',
  mainScene: 'Main'
});

// 预加载主场景（带进度回调）
window.GM.scene.loadMain((progress) => {
  console.log(`加载进度: ${Math.floor(progress * 100)}%`);
  // 更新进度条 UI...
}).then(() => {
  console.log('预加载完成');
  // 切换到主场景
  window.GM.scene.switchToMain();
});

// 获取当前场景名
const current = window.GM.scene.currentScene;
```

**特性**:
- `loadMain()` 返回 Promise，支持 async/await
- 进度值范围 0-1
- `switchToMain()` 会发送 `sceneChange` 事件

---

### PrefabModule - Prefab 管理

```typescript
import { Vec3 } from 'cc';

// 创建 Prefab 实例
const enemy = await window.GM.prefab.create({
  path: 'prefabs/Enemy',
  parent: this.node,
  position: new Vec3(100, 0, 0)
});

if (enemy) {
  console.log('敌人创建成功');
  // 发送 'prefabCreate' 事件
}

// 销毁 Prefab 实例
window.GM.prefab.destroy(enemy);
// 发送 'prefabDestroy' 事件
```

**特性**:
- 从 resources 目录加载 Prefab
- 加载失败返回 `undefined`（静默失败）
- 自动发送 `prefabCreate` / `prefabDestroy` 事件

---

### DialogModule - 弹窗管理

```typescript
import { _decorator, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GameUI')
export class GameUI extends Component {
  @property(Node)
  canvas: Node = null;

  start() {
    // 设置弹窗默认父节点（通常是 Canvas）
    window.GM.dialog.setParent(this.canvas);
  }

  async showConfirm() {
    // 方式1: 使用 setParent 设置的默认父节点
    const dialog = await window.GM.dialog.open({
      path: 'prefabs/ConfirmDialog'
    });
    if (dialog) {
      console.log('弹窗已打开');
      // 发送 'dialogOpen' 事件
    }
  }

  async showConfirmWithCustomParent() {
    // 方式2: 直接指定父节点（无需调用 setParent）
    const dialog = await window.GM.dialog.open({
      path: 'prefabs/ConfirmDialog',
      parent: this.node  // 使用自定义父节点
    });
  }

  closeDialog() {
    window.GM.dialog.close();
    // 发送 'dialogClose' 事件
  }
}
```

**特性**:
- **单层模式**: 打开新弹窗时自动关闭已有弹窗
- **自动遮罩**: 弹窗后自动创建半透明黑色遮罩（50% 透明度）
- **灵活父节点**: 支持两种方式设置父节点：
  - 使用 `setParent()` 设置默认父节点，`open()` 时省略 parent
  - 直接在 `open()` 中传入 `parent` 参数（优先级高于 setParent）
- **静默失败**: 加载失败或未设置 parent 时返回 `undefined`

---

### AudioModule - 音频（BGM / Ambient / SFX）

```typescript
// 初始化（须在已有场景时调用，例如入口脚本的 start）
// 使用 initGM 配置时，persistRoot 默认为 true，可实现跨场景播放 BGM
window.GM.audio.init({ audio: 'audio' });
// window.GM.audio.init({ audio: 'audio', persistRoot: false }); // 显式关闭跨场景

// 播放 BGM：path 为 init 指定目录下的相对路径（无扩展名）；loop 默认 true
await window.GM.audio.playBgm('bg', { volume: 0.8 });
await window.GM.audio.playBgm('stinger', { volume: 1, loop: false });

// 停止 BGM
window.GM.audio.stopBgm();

// 播放环境音（与 BGM 同时播放，形成分层背景音乐）
// 例如：鸟叫声、风声、雨声等环境氛围音效
await window.GM.audio.playAmbient('bird_chirping', { volume: 0.4, loop: true });
await window.GM.audio.playAmbient('wind', { volume: 0.3 });

// 停止环境音
window.GM.audio.stopAmbient();

// 播放音效（一次性，不中断 BGM/Ambient）
await window.GM.audio.playSfx('button', { volume: 1 });

// 独立控制 BGM、Ambient 和 SFX 音量（0~1）
window.GM.audio.setBgmVolume(0.7);
window.GM.audio.setAmbientVolume(0.4);
window.GM.audio.setSfxVolume(1);
```

**特性**:
- `init()` 创建 `GM_Audio` 根节点挂到当前场景；BGM/Ambient/SFX AudioSource 在首次使用时懒加载
- `persistRoot` 默认为 `true`，音频节点跨场景保留，实现 BGM/Ambient 连续播放
- 可选 `audio` 指定 `resources` 下音频子目录（默认 `audio`）
- `playBgm` / `playAmbient` / `playSfx` 的 `path` 为上述子目录内的相对路径（无扩展名）；均可选 `loop`，默认 `true`
- **分层背景音乐**: BGM 和 Ambient 使用独立 AudioSource，可同时播放形成丰富的背景氛围（如 BGM + 鸟叫声）
- BGM、Ambient 和 SFX 使用三个独立 AudioSource，音量互不影响；SFX 使用 `playOneShot()` 不中断 BGM/Ambient
- 同一 `AudioClip` 资源路径会缓存，避免重复加载
- 加载失败时 `playBgm` / `playAmbient` / `playSfx` 的 Promise **reject**
- 可与 `data` 中的开关配合：业务层决定是否调用各播放方法，或用 `setXxxVolume(0)` 静音

---

## 内置事件参考

| 事件名 | 触发时机 | 数据结构 |
|--------|----------|----------|
| `sceneChange` | 场景切换时 | `{ from: string, to: string }` |
| `prefabCreate` | Prefab 实例化成功时 | `{ node: Node, path: string }` |
| `prefabDestroy` | Prefab 销毁时 | `{ node: Node }` |
| `dialogOpen` | 弹窗打开时 | `{ node: Node, path: string }` |
| `dialogClose` | 弹窗关闭时 | `{ node: Node, path: string }` |

---

## API 速查表

### 全局方法

| 方法 | 说明 |
|------|------|
| `initGM(config?)` | 初始化 GM 并挂载到 `window.GM`，可选配置 data/scene/audio 模块 |
| `getGM()` | 获取 GM 实例（不挂载到 window） |
| `window.GM.init(config?)` | 初始化框架（`initGM()` 已调用） |
| `window.GM.destroy()` | 清理 GM，移除 `window.GM` 引用 |

### EventModule

| 方法 | 参数 | 返回值 |
|------|------|--------|
| `on(name, callback)` | 事件名, 回调函数 | 回调函数 |
| `emit(name, data?)` | 事件名, 可选数据 | void |
| `off(name, callback?)` | 事件名, 可选回调 | void |
| `offAll()` | - | void |

### DataModule

| 方法 | 参数 | 返回值 |
|------|------|--------|
| `init(config)` | `{ defaults: object }` | void |
| `setState(values)` | 部分状态对象 | void |
| `getState(key?)` | 可选键名 | 值或完整状态 |
| `onChange(key, callback)` | 键名, 回调(newVal, oldVal) | void |

### SceneModule

| 方法 | 参数 | 返回值 |
|------|------|--------|
| `init(config)` | `{ loadingScene?, mainScene? }` | void |
| `loadMain(onProgress?)` | 可选进度回调(0-1) | `Promise<void>` |
| `switchToMain()` | - | void |
| `currentScene` | getter | string |

### PrefabModule

| 方法 | 参数 | 返回值 |
|------|------|--------|
| `create(config)` | `{ path, parent, position? }` | `Promise<Node \| undefined>` |
| `destroy(node)` | Node 实例 | void |

### DialogModule

| 方法 | 参数 | 返回值 |
|------|------|--------|
| `setParent(parent)` | 父节点 | void |
| `open(config)` | `{ path, parent? }` - path 为 Prefab 路径，parent 可选 | `Promise<Node \| undefined>` |
| `close()` | - | void |

### AudioModule

| 方法 | 参数 | 返回值 |
|------|------|--------|
| `init(config?)` | 可选 `{ persistRoot?, audio? }`，根节点挂当前场景；`audio` 为 resources 下子目录名（默认 `audio`）；`persistRoot` 通过 `initGM` 初始化时默认为 `true` | void |
| `playBgm(path, options?)` | 相对 `audio` 目录的路径, 可选 `{ volume?, loop? }`（`loop` 默认 `true`） | `Promise<void>` |
| `stopBgm()` | - | void |
| `playAmbient(path, options?)` | 相对 `audio` 目录的路径, 可选 `{ volume?, loop? }`（`loop` 默认 `true`）；与 BGM 同时播放形成分层背景音乐 | `Promise<void>` |
| `stopAmbient()` | - | void |
| `playSfx(path, options?)` | 相对 `audio` 目录的路径, 可选 `{ volume? }`（默认 1） | `Promise<void>` |
| `setBgmVolume(volume)` | 0~1 | void |
| `setAmbientVolume(volume)` | 0~1 | void |
| `setSfxVolume(volume)` | 0~1 | void |
| `dispose()` | - | void（由 `GM.destroy()` 调用，一般无需手动调用） |

---

## 注意事项

1. **内存管理**: 使用 `on()` 注册的监听器需要在不需要时使用 `off()` 移除，避免内存泄漏

2. **状态持久化**: 所有状态自动持久化到 `localStorage`，调用 `destroy()` 不会清除持久化数据

3. **单例模式**: `initGM()` 只能调用一次，重复调用会抛出错误。如需重新初始化，先调用 `destroy()`

4. **Prefab 路径**: `path` 参数是相对于 `resources` 目录的路径，不含扩展名

5. **弹窗父节点**: DialogModule 必须先调用 `setParent()` 才能正常工作

6. **音频**: `audio.init()` 须在已有活动场景时调用（否则抛错）；`init({ audio: '...' })` 指定 resources 下子目录（默认 `audio`）；跨场景保留可传 `persistRoot: true`

---

## 目录结构

```
assets/script/gm/
  index.ts      - 入口文件，导出 initGM / getGM
  types.ts      - TypeScript 接口定义
  event.ts      - EventModule 实现
  data.ts       - DataModule 实现
  scene.ts      - SceneModule 实现
  prefab.ts     - PrefabModule 实现
  dialog.ts     - DialogModule 实现
  audio.ts      - AudioModule 实现
  window.d.ts   - Window 接口扩展声明
```

---

## 类型支持

框架提供完整的 TypeScript 类型定义：

```typescript
import type {
  GMInterface,
  IEventModule,
  IDataModule,
  ISceneModule,
  IPrefabModule,
  IDialogModule,
  IAudioModule
} from './gm/types';
```
