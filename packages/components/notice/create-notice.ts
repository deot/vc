import { toRem } from '@deot/vc-shared';
import { Portal } from '../portal';
import type { Props } from './notice-view-props';
import type { PortalOptions } from '../portal/default-options';
import { resolvePortalElement } from '../portal/utils';

type Options = Partial<Props & {
	insertion: PortalOptions['insertion'];
	onClose: (...args: any[]) => any;
}>;

/**
 * Notice 与 MNotice 的静态方法：各自一个全局容器与 Portal
 * @param View NoticeView / MNoticeView
 * @param options ~
 * @param options.mobile 移动端：容器为顶部通栏（vcm-notice-portals），top 为 750 稿长度
 * @returns open / info / loading / success / warning / error / destroy
 */
export const createNotice = (View: any, options: { mobile?: boolean } = {}) => {
	const { mobile = false } = options;
	const toLength = mobile ? toRem : (v: number) => `${v}px`;

	let el: HTMLElement;
	if (typeof document !== 'undefined') {
		el = document.createElement('div');
		el.className = mobile ? 'vc-notice-portals vcm-notice-portals' : 'vc-notice-portals';
	}

	const Notice$ = new Portal(View, {
		element: el!,
		leaveDelay: 0,
		multiple: true,
		autoDestroy: false
	});

	const setTop = (top?: number) => {
		el.style.top = typeof top === 'number' ? toLength(top) : '';
		// 移动端贴顶（top 为 0 或未传）时，最上面一条延伸进安全区
		mobile && el.classList.toggle('is-offset', !!top);
	};

	const clean = () => {
		let number = 0;
		const prefix = `${Notice$.globalOptions.name!}__`;
		Portal.leafs.forEach((_, key) => {
			if (key.startsWith(prefix)) {
				number++;
			}
		});

		if (!number && el.parentNode) {
			el.remove();
			setTop();
		}
	};

	const create = (mode?: Props['mode'], defaults: Options = {}) => (options$: Options) => {
		// 容器挂在弹层挂载点（Portal.element，缺省 body）下；挂载点变化后移过去
		const root = resolvePortalElement();
		if (el.parentNode !== root) {
			root.appendChild(el);
		}

		// 全局通知都在同一容器内排列：top 设置容器位置，以最新一次调用为准（不传时为样式中的默认值）
		setTop(options$.top);

		const config = {
			...defaults,
			...options$,
			mode,
			fixed: false
		};

		// 执行弹窗
		return Notice$.popup({
			insertion: 'first', // 保持最新的在上面
			...config,
			onFulfilled: () => {
				config.onClose?.();
				clean();
			},
			// 当组件内使用emit('close')，避免重复触发
			onClose: null
		});
	};

	const destroy = () => {
		Notice$.destroy();
		clean();
	};

	return {
		destroy,
		open: create(),
		info: create('info'),
		loading: create('loading', { duration: 0 }),
		success: create('success'),
		warning: create('warning'),
		error: create('error')
	};
};
