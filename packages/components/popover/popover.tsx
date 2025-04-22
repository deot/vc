/** @jsxImportSource vue */

import { defineComponent, h, ref, computed, watch, getCurrentInstance, onMounted, onUnmounted } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { props as popoverProps } from './popover-props';
import { composedPath } from '@deot/helper-dom';
import { getUid } from '@deot/helper-utils';
import { PopoverPortal } from './wrapper';
import type { PortalLeaf } from '../portal/portal-leaf';

const COMPONENT_NAME = 'vc-popover';

export const Popover = defineComponent({
	name: COMPONENT_NAME,
	props: popoverProps,
	emits: ['update:modelValue', 'visible-change', 'ready', 'close'],
	open: PopoverPortal.popup.bind(PopoverPortal),
	setup(props, { emit, slots }) {
		const instance = getCurrentInstance() as ComponentInternalInstance;

		const popoverId = getUid('popover');
		const isActive = ref(false);
		const isHover = computed(() => {
			return props.trigger === 'hover' && !props.always;
		});
		const isStrictHover = computed(() => {
			return props.trigger === 'strictHover' && !props.always;
		});

		const isClick = computed(() => {
			return props.trigger === 'click' && !props.always;
		});

		const isFocus = computed(() => {
			return props.trigger === 'focus' && !props.always;
		});

		const sync = () => {
			emit('update:modelValue', isActive.value);
			emit('visible-change', isActive.value);
		};

		let timer: any;
		let popperInstance: PortalLeaf;

		/**
		 * portal: false
		 * 是直接挂在父节点上的，
		 * 点击pop内容区域时click事件冒泡，导致执行了该toggle方法
		 * visible: true, false, undefined(处理 doc click)
		 * @param e ~
		 * @param root0 ~
		 * @param root0.visible ~
		 */
		const handleChange = (e: any = {}, { visible }) => {
			visible = props.always || visible;
			if (props.disabled) return;

			isHover.value && timer && clearTimeout(timer);
			const path: Element[] = e.path || composedPath(e) || [];

			const isPopArea = path.some(item => new RegExp(popoverId).test(item.className));

			if (!props.portal && isPopArea) return;

			// document click
			if (visible === undefined) {
				if (
					!isPopArea
					&& !instance?.vnode?.el?.contains(e.target)
					&& props.outsideClickable
				) {
					visible = false;
				} else {
					return;
				}
			}

			if (visible != isActive.value) {
				const callback = () => {
					isActive.value = visible;

					sync();
				};
				(isHover.value || isStrictHover.value) && visible === false
					? (timer = setTimeout(callback, 200))
					: callback();
			}
		};

		const refresh = () => {
			if (isActive.value) {
				const el = props.getPopupContainer
					? props.getPopupContainer()
					: props.portal
						? document.body
						: instance.vnode.el;
				let { portalClass } = props;

				typeof portalClass === 'object'
					? portalClass instanceof Array
						? portalClass.push(popoverId)
						: (portalClass[popoverId] = true)
					: (portalClass += ` ${popoverId}`);

				popperInstance = PopoverPortal.popup({
					el,
					cName: popoverId,
					triggerEl: instance.vnode.el as Element,
					onChange: handleChange,
					// @ts-ignore
					onClose: () => {
						emit('close');
					},
					// @ts-ignore
					onReady: () => {
						emit('ready');
					},
					hover: isHover.value,

					/**
					 * 传送门通信控制
					 */
					slots,
					parent: instance.parent!,
					...props,
					portalClass
				}) as PortalLeaf;
			} else if (popperInstance && popperInstance.wrapper) {
				popperInstance.wrapper.toggle(false);
			}
		};

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		watch(
			() => isActive.value,
			() => {
				refresh();
			}
		);

		onMounted(() => {
			isActive.value && refresh();
		});

		onUnmounted(() => {
			popperInstance && popperInstance.destroy();
		});
		return () => {
			return h(props.tag, {
				class: 'vc-popover',
				style: 'position: relative;',
				onFocus: (e: any) => isFocus.value && handleChange(e, { visible: true }),
				onBlur: (e: any) => isFocus && handleChange(e, { visible: false }),
				onMouseenter: (e: any) => (isHover.value || isStrictHover.value) && handleChange(e, { visible: true }),
				onMouseleave: (e: any) => (isHover.value || isStrictHover.value) && handleChange(e, { visible: false }),
				onClick: (e: any) => isClick.value && handleChange(e, { visible: !isActive.value })
			}, slots.default?.());
		};
	}
});
