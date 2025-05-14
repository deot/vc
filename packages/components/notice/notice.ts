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
	el: el!,
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
	}
};

const create = (mode?: string) => (options: Options) => {
	if (!document.body.contains(el)) {
		document.body.appendChild(el);
	}

	const options$ = {
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
export const success = create('success');
export const warning = create('warning');
export const error = create('error');

export const Notice = Object.assign(NoticeView, { destroy, open, info, success, warning, error });
