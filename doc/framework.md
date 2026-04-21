# 代码架构设计

## 设计目标
- 简洁：模块少而清晰。
- 稳定：规则集中，避免分散。
- 可扩：扩关只动配置。

## 分层结构
- `scene`
  - `Main`：界面路由与生命周期调度（由 GM 事件驱动）。
- `game/level`
  - `Types`：关卡类型定义。
  - `Repo`：关卡配置读取（确定性）。
- `game/runtime`
  - `Runtime`：按配置生成并管理实体（固定坐标 + 随机颜色 + 选中态表现）。
- `game/rules`
  - `Rules`：核心判定纯函数。
- `game/components`
  - `RingCtrl`：旋转输入与环状态驱动。
  - `RockCtrl`：岩石状态与销毁。
  - `BombCtrl`：倒计时与爆炸触发。
- `resources/prefab`
  - `ring`、`buckle`、`rock`、`bomb`：统一玩法预制体资源。

## Main.scene 节点规划
- `Main`
  - `LevelSelection`：选图界面（后续实现）。
  - `Game`：主要游戏界面。
    - `Area`：锁环玩法主区域（运行时实体挂载根节点）。

## 关键数据流
1. `scripts/scene/Main.ts` 监听 GM 事件并切换 `LevelSelection` / `Game` 显隐。
2. 进入 `Game` 时读取当前关卡 ID。
3. `Repo` 返回 `LevelConfig`。
4. `Runtime` 在 `Game/Area` 下按配置坐标创建 `Ring/Buckle/Rock/Bomb` 实体。
5. `Runtime` 为每个 `Ring` 从 `assets/resources/ring/1~7` 随机分配颜色贴图。
6. 按住某个 `Ring` 时叠加 `assets/resources/ring/绿圈.png` 作为选中态。
7. 交互组件只采集输入与状态变化。
8. 所有业务判定统一调用 `Rules`。
9. 判定结果回写 `Runtime`，推进关卡状态。

## 约束规则
- 规则唯一入口：仅 `scripts/game/rules/Rules.ts` 可定义玩法判定。
- 配置唯一入口：仅 `scripts/game/level/Repo.ts` 读关卡数据。
- 资源唯一入口：预制体统一放在 `resources/prefab`。
- 颜色资源入口：`Ring` 颜色仅使用 `assets/resources/ring/1~7`。
- 选中态资源入口：仅使用 `assets/resources/ring/绿圈.png`。
- 场景事件入口：仅 `scripts/scene/Main.ts` 监听 GM 事件并驱动主界面切换。
- 禁止兜底：配置错误、引用错误、状态错误直接抛错。

## 命名规范（简短有力）
- 目录名：短词小写。例：`game`、`level`、`rules`。
- 脚本文件名：PascalCase，且简洁命名。例：`Types.ts`、`Repo.ts`、`Rules.ts`。
- 类型名：名词，单数，PascalCase。例：`RingConfig`。
- 函数名：动词开头，camelCase。例：`canRingRelease`。
- 布尔变量：`is/has/can` 前缀。例：`isConstrained`。
