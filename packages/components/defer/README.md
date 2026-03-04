## 延迟器（Defer）

大列表延迟分批渲染。优先使用 `requestIdleCallback` 在浏览器空闲时执行多批渲染，不支持时降级为 `requestAnimationFrame`。

### 何时使用

- 大列表首次渲染，卡顿

### 基础用法

## API

### 基础属性
| 属性          | 说明   | 类型        | 可选值 | 默认值   |
| ----------- | ---- | --------- | --- | ----- |
| data        | 数据源  | `array`   | -   | -     |
| primaryKey  | 主键   | `string`  | -   | -     |
| concurrency | 并发数  | `number`  | -   | 10    |
| disabled    | 是否禁用 | `boolean` | -   | false |

### 事件

| 事件名      | 说明 | 回调参数 | 参数说明 |
| -------- | -- | ---- | ---- |
| complete | 完成 | -    | -    |
