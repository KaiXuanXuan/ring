# 代码架构设计

## 设计目标
- 简洁：模块少而清晰。
- 稳定：规则集中，避免分散。
- 可扩：扩关只动配置。

## 分层结构
- `scene`
  - `Main`：关卡入口与生命周期调度。
- `game/level`
  - `types`：关卡类型定义。
  - `repo`：关卡配置读取（确定性）。
- `game/runtime`
  - `runtime`：按配置生成并管理实体。
- `game/rules`
  - `rules`：核心判定纯函数。
- `game/components`
  - `ringCtrl`：旋转输入与环状态驱动。
  - `rockCtrl`：岩石状态与销毁。
  - `bombCtrl`：倒计时与爆炸触发。
- `resources/prefab`
  - `ring`、`buckle`、`rock`、`bomb`：统一玩法预制体资源。

## 关键数据流
1. `Main` 读取当前关卡 ID。
2. `repo` 返回 `LevelConfig`。
3. `runtime` 创建 `Ring/Buckle/Rock/Bomb` 实体。
4. 交互组件只采集输入与状态变化。
5. 所有业务判定统一调用 `rules`。
6. 判定结果回写 `runtime`，推进关卡状态。

## 约束规则
- 规则唯一入口：仅 `game/rules/rules.ts` 可定义玩法判定。
- 配置唯一入口：仅 `game/level/repo.ts` 读关卡数据。
- 资源唯一入口：预制体统一放在 `resources/prefab`。
- 禁止兜底：配置错误、引用错误、状态错误直接抛错。

## 命名规范（简短有力）
- 目录名：短词小写。例：`game`、`level`、`rules`。
- 文件名：短词小写。例：`types.ts`、`repo.ts`、`rules.ts`。
- 类型名：名词，单数，PascalCase。例：`RingConfig`。
- 函数名：动词开头，camelCase。例：`canRingRelease`。
- 布尔变量：`is/has/can` 前缀。例：`isConstrained`。
