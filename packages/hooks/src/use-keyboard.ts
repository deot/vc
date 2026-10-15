import { watch } from 'vue';
import { Keyboard } from '@deot/vc-shared';
import type { KeyboardHandler } from '@deot/vc-shared';

export interface KeyboardOptions {
	// 为真期间订阅（如弹层打开、触发器聚焦），变化时订阅或退订
	enabled: () => boolean;
	// 返回 true 表示已处理：阻止默认行为，不再传给更早的订阅与页面上的其他监听
	handler: KeyboardHandler;
	// 默认 'pre'；需要等 DOM 更新后再订阅时传 'post'
	flush?: 'pre' | 'post';
}

/**
 * 按条件订阅统一的 Keyboard：后订阅的先处理；条件变化、所在作用域销毁时退订
 * @param options ~
 */
export const useKeyboard = (options: KeyboardOptions) => {
	const { enabled, handler, flush = 'pre' } = options;
	watch(
		enabled,
		(v, _, onCleanup) => {
			v && onCleanup(Keyboard.on(handler));
		},
		{ immediate: true, flush }
	);
};
