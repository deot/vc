import { defineComponent, h, ref, camelize, toHandlerKey } from 'vue';
import type { PortalOptions } from '../../portal/default-options';
import { props as popoverProps } from '../popover-props';
import { Popover, emits } from '../popover';
import { PopoverPortal } from '../popover-view';

const COMPONENT_NAME = 'vcm-popover';

// 移动端外观：浮层带上该类，字号、行高、内边距、圆角换成 750 稿（见 ./style.scss）；Popover.open、PopoverView 传入 portalClass 同样生效
export const MOBILE_CLASS = 'vcm-popover-wrapper';

const withMobileClass = (options: Record<string, any> = {}) => ({
	...options,
	portalClass: [MOBILE_CLASS, options.portalClass]
});

/**
 * 移动端气泡：Popover 加上移动端外观，触屏默认点按触发
 */
export const MPopover$ = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...popoverProps,
		trigger: {
			...popoverProps.trigger,
			default: 'click'
		}
	},
	emits,
	setup(props, { emit, slots, expose }) {
		const listeners = Object.fromEntries(emits.map(name => [toHandlerKey(camelize(name)), (...args: any[]) => emit(name, ...args)]));
		const popover = ref<{ update: () => void }>();

		// 与 Popover 一致：ref 上可调用 update() 重新定位
		expose({ update: () => popover.value?.update() });

		return () => h(Popover, { ref: popover, ...props, ...listeners, portalClass: [MOBILE_CLASS, props.portalClass] }, slots);
	}
});

/**
 * 创建带移动端外观的独立浮层，参数同 Popover.open
 * @param propsData 浮层属性；只传一个参数时可同时包含 Portal 配置
 * @param options Portal 配置
 * @returns PortalLeaf
 */
export const open = (propsData?: Record<string, any>, options?: PortalOptions) => {
	return options
		? PopoverPortal.popup(withMobileClass(propsData), options)
		: PopoverPortal.popup(withMobileClass(propsData));
};
