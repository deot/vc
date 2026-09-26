/** @jsxImportSource vue */

import { defineComponent, h, ref, computed, watch, getCurrentInstance, onMounted, onUnmounted } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { props as popoverProps } from './popover-props';
import { getUid } from '@deot/helper-utils';
import { PopoverPortal } from './wrapper';
import { isInArea } from './utils';
import type { PortalLeaf } from '../portal/portal-leaf';

const COMPONENT_NAME = 'vc-popover';

export const Popover = defineComponent({
	name: COMPONENT_NAME,
	props: popoverProps,
	emits: ['update:modelValue', 'visible-change', 'ready', 'close'],
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
		let popperInstance: PortalLeaf | null;

		/**
		 * portal: false
		 * 是直接挂在父节点上的，
		 * 点击pop内容区域时click事件冒泡，导致执行了该toggle方法
		 * visible: true, false, undefined(处理 doc click)
		 * @param e ~
		 * @param root0 ~
		 * @param root0.visible ~
		 * @param root0.immediate 不走 hover 的延时关闭
		 */
		const handleChange = (e: any = {}, { visible, immediate = false }) => {
			visible = props.always || visible;
			if (props.disabled) return;

			// 新的触发会取消未执行的延时关闭（hover / strictHover 都会设置）
			clearTimeout(timer);

			const wrapperEl = popperInstance?.wrapper?.$el;
			if (!props.portal && wrapperEl && isInArea(e, wrapperEl)) return;

			// document click（弹层内的点击已由弹层自身排除）：触发节点在触发区内的子弹层（如 Select 的标签列表）也视为触发区
			if (visible === undefined) {
				if (isInArea(e, instance.vnode.el as Element) || !props.outsideClickable) return;
				visible = false;
			}

			if (visible != isActive.value) {
				const callback = () => {
					isActive.value = visible;

					sync();
				};
				// immediate：弹层要求立即关闭（如滚动容器滚动、触发节点被移除，见 wrapper 的 close）
				(isHover.value || isStrictHover.value) && visible === false && !immediate
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
				popperInstance = PopoverPortal.popup({
					el,
					alone: false, // 由当前组件控制hover/click等情况
					name: popoverId,
					triggerEl: instance.vnode.el as Element,
					onChange: handleChange,
					// @ts-ignore
					onClose: () => {
						emit('close');
						popperInstance = null;
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
					...props
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
				onBlur: (e: any) => isFocus.value && handleChange(e, { visible: false }),
				onMouseenter: (e: any) => (isHover.value || isStrictHover.value) && handleChange(e, { visible: true }),
				onMouseleave: (e: any) => (isHover.value || isStrictHover.value) && handleChange(e, { visible: false }),
				onClick: (e: any) => isClick.value && handleChange(e, { visible: !isActive.value })
			}, slots.default?.());
		};
	}
});
