import { Portal } from '../portal';
import { MessageView } from './message-view.tsx';
import { toOptions } from '../customer/utils';
import type { Props } from './message-view-props';

const Message$ = new Portal(MessageView, {
	leaveDelay: 0,
	multiple: true,
	autoDestroy: false
});

type Options = Partial<Props & { onClose: (...args: any[]) => any }>;

const create = (options: Options) => (...params: Array<Options[keyof Options] | Options>) => {
	// 多条提示的竖向排列由 MessageView 的堆叠处理（./stack）
	const options$ = toOptions(params, ['content', 'duration', 'onClose'], options);

	// 执行弹窗
	return Message$.popup({
		...options$,
		onFulfilled: options$.onClose,
		// 当组件内使用emit('close')，避免重复触发
		onClose: null
	});
};

export const destroy = () => Message$.destroy();
export const info = create({ mode: 'info' });
export const success = create({ mode: 'success' });
export const loading = create({ mode: 'loading', duration: 0, maskClosable: false });
export const warning = create({ mode: 'warning' });
export const error = create({ mode: 'error' });

export const Message = Object.assign(MessageView, { destroy, info, success, loading, warning, error });
