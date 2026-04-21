# 计划推进路线

## 路线总览
- 目标：先跑通核心玩法闭环，再快速扩关。
- 策略：`统一预制体 + 关卡配置`，不做“每关一个预制体”。
- 架构落位：核心代码放 `scripts/game`，预制体放 `resources/prefab`。
- 场景约定：`Main.scene` 下包含 `LevelSelection`、`Game`、`Game/Area`。

## M1 核心闭环（优先）
- 建立 `scripts/scene/Main.ts`，通过 GM 事件驱动 `LevelSelection` 与 `Game` 切换。
- 建立 `scripts/game/level/Types.ts` 与 `scripts/game/level/Repo.ts`。
- 落地 `Ring/Buckle/Rock/Bomb` 统一运行时生成（`scripts/game/runtime/Runtime.ts`）。
- 运行时实体统一挂载到 `Game/Area`。
- 实现 4 个核心判定：
  - `isRingConstrained`
  - `canRingRotate`
  - `canRingRelease`
  - `shouldBombExplodeOnRelease`
- 判定实现文件统一为 `scripts/game/rules/Rules.ts`。
- 完成最小可玩样例关（1~3 关）。

## M2 关卡生产
- 固化关卡配置模板（可复制、可校验、可回放）。
- 首批扩展到 10 关，保证“仅改配置即可出新关”。
- 增加关卡合法性校验（引用、重叠、无解）。
- 预制体统一放置 `resources/prefab`，禁止散落。

## M3 稳定与提效
- 补齐规则层单测（纯函数）。
- 优化关卡编辑流程（模板化、命名统一、减少手工错误）。
- 建立回归清单：旋转、约束、释放、爆炸链路全覆盖。

## 执行顺序
1. 先数据结构，再运行时，再交互组件。
2. 先规则正确，再表现优化。
3. 先少量高质量关卡，再批量扩关。

## 完成标准
- 核心玩法规则全可验证。
- 新增关卡不改玩法代码。
- 类型检查通过，关键链路可回归。
