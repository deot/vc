import { Utils } from '@deot/vc-shared';
import { Portal } from '../portal';
import { MessageView } from './message-view.tsx';
import type { Props } from './message-view-props';

const Message = new Portal(MessageView, {
	leaveDelay: 0,
	multiple: true,
	autoDestroy: false
});

type Options = Partial<Props & { onClose: (...args: any[]) => any }>;

const create = (options: Options) => (...params: Array<Options[keyof Options] | Options>) => {
	let number = 0;
	Portal.leafs.forEach((_, key) => {
		if (key.includes(Message.globalOptions.name!)) {
			number++;
		}
	});

	const top = 30 + number * 40;
	const maxH = window.innerHeight - 100;
	options.top = top > maxH ? maxH : top;
	const options$ = Utils.toOptions(
		params,
		['content', 'duration', 'onClose'],
		// 避免引用
		{ ...options }
	);

	// 执行弹窗
	return Message.popup({
		...options$,
		onFulfilled: options$.onClose,
		// 当组件内使用emit('close')，避免重复触发
		onClose: null
	});
};

export const destroy = () => Message.destroy();
export const info = create({ mode: 'info' });
export const success = create({ mode: 'success' });
export const loading = create({ mode: 'loading', duration: 0, maskClosable: false });
export const warning = create({ mode: 'warning' });
export const error = create({ mode: 'error' });
