import { Portal } from '../portal';
import { NoticeView } from './notice-view.tsx';
import type { Props } from './notice-view-props';
import type { PortalOptions } from '../portal/default-options';

let el: HTMLElement;
if (typeof document !== 'undefined') {
	el = document.createElement('div');
	el.classList.add('vc-notice-portals');
}

const Notice$ = new Portal(NoticeView, {
	element: el!,
	leaveDelay: 0,
	multiple: true,
	autoDestroy: false
});

type Options = Partial<Props & {
	insertion: PortalOptions['insertion'];
	onClose: (...args: any[]) => any;
}>;

const clean = () => {
	let number = 0;
	Portal.leafs.forEach((_, key) => {
		if (key.includes(Notice$.globalOptions.name!)) {
			number++;
		}
	});

	if (!number && document.body.contains(el)) {
		document.body.removeChild(el);
		el.style.top = '';
	}
};

const create = (mode?: Props['mode'], defaults: Options = {}) => (options: Options) => {
	if (!document.body.contains(el)) {
		document.body.appendChild(el);
	}

	// 全局通知都在同一容器内排列：top 设置容器位置，以最新一次调用为准（不传时为样式中的默认值）
	el.style.top = typeof options.top === 'number' ? `${options.top}px` : '';

	const options$ = {
		...defaults,
		...options,
		mode,
		fixed: false
	};

	// 执行弹窗
	return Notice$.popup({
		insertion: 'first', // 保持最新的在上面
		...options$,
		onFulfilled: () => {
			options$.onClose?.();
			clean();
		},
		// 当组件内使用emit('close')，避免重复触发
		onClose: null
	});
};

export const destroy = () => {
	Notice$.destroy();
	clean();
};
export const open = create();
export const info = create('info');
export const loading = create('loading', { duration: 0 });
export const success = create('success');
export const warning = create('warning');
export const error = create('error');

export const Notice = Object.assign(NoticeView, { destroy, open, info, loading, success, warning, error });
