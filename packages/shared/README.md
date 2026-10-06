# @deot/vc-shared

`@deot/vc-shared` 存放组件、Hooks 与聚合入口之间共享的轻量能力，不依赖 Vue。

## 安装

```bash
pnpm add @deot/vc-shared
```

## 导出

- `IS_SERVER`：判断当前是否为服务端环境。
- `Utils`：组件库内部复用的工具集合。
- `Keyboard` / `KeyboardHandler`：原生键盘事件订阅，可从 `@deot/vc` 引入。

这些能力主要服务于组件库内部；应用侧通常从 `@deot/vc` 使用公开导出。

## Keyboard

```ts
const dispose = Keyboard.on('ctrl+shift+k', (event) => {
	return true; // 消费事件，阻止继续分发和背景监听
});
dispose(); // 重复调用安全
Keyboard.on(handler); // 订阅全部原生 keydown
Keyboard.blur(handler); // 暂停该回调的全部订阅
Keyboard.focus(handler); // 恢复该回调的全部订阅
Keyboard.off(handler);
Keyboard.off('ctrl+shift+k', handler);
```

off(handler) 移除该回调的所有注册，off(key, handler) 只移除指定按键的注册。

订阅默认启用。blur(handler) 暂停分发，focus(handler) 恢复分发，均不改变 DOM 焦点或订阅顺序，也不影响其他回调；已取消的订阅不会被恢复。暂停期间保留注册，仍需调用取消函数或 off 释放。

支持单键及 ctrl/shift/alt/meta + 单键，使用 event.key，忽略大小写并精确匹配修饰键，不支持序列或 macro。倒序分发，回调同步返回 true 表示消费。

空格使用 `' '`，例如 `Keyboard.on(' ', handler)` 或 `Keyboard.on('ctrl+ ', handler)`；也可单独订阅 `'Control'`、`'Shift'`、`'Alt'`、`'Meta'`。

首次订阅安装 document 捕获监听，最后取消释放；导入不访问 DOM。重复键、组合输入及输入区过滤由调用方处理，回调保留完整 KeyboardEvent。
