/** @jsxImportSource vue */

import { defineComponent, h, ref, computed, watch, getCurrentInstance, onMounted, onActivated, onDeactivated, Teleport } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { pick } from 'lodash-es';
import { props as popoverProps, viewKeys } from './popover-props';
import { PopoverView } from './popover-view';
import { isInArea, isEditable, keepFocus } from './utils';

const COMPONENT_NAME = 'vc-popover';

export const Popover = defineComponent({
	name: COMPONENT_NAME,
	props: popoverProps,
	emits: ['update:modelValue', 'visible-change', 'ready', 'close'],
	setup(props, { emit, slots }) {
		const instance = getCurrentInstance() as ComponentInternalInstance;

		const isActive = ref(false);
		// 浮层是否挂载：打开时挂载，关闭动画结束后卸载（见 handleClose）
		const isRendered = ref(false);
		// 离场动画中再次打开时换一个 key 重新挂载：重新触发 ready、入场动画与挂载时的自动聚焦
		const renderKey = ref(0);
		const viewRef = ref<{ $el: Element; toggle: (v?: boolean) => void; update: () => void }>();
		let isMounted = false;

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

		// 浮层渲染在根节点内（Teleport 不传送）
		const isInline = computed(() => !props.portal && !props.to);
		const viewProps = computed(() => pick(props, viewKeys));

		const sync = () => {
			emit('update:modelValue', isActive.value);
			emit('visible-change', isActive.value);
		};

		let timer: any;

		/**
		 * 浮层渲染在根节点内时，浮层内的点击冒泡到根节点，不应切换
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

			const wrapperEl = viewRef.value?.$el;
			if (isInline.value && wrapperEl && isInArea(e, wrapperEl)) return;

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

		// keepFocus：浮层打开时点击触发器的输入框只移动光标，不关闭
		const handleClick = (e: MouseEvent) => {
			if (props.keepFocus && isActive.value && isEditable(e.target)) return;
			handleChange(e, { visible: !isActive.value });
		};

		// keepFocus：焦点已在触发器内时，按下鼠标不转移焦点；焦点在别处时照常（如页面上的其他输入框照常失焦）
		const handleMousedown = (e: MouseEvent) => {
			props.keepFocus && (instance.vnode.el as Element).contains(document.activeElement) && keepFocus(e);
		};

		// 关闭动画结束后卸载浮层
		const handleClose = () => {
			isRendered.value = false;
			emit('close');
		};

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		// 挂载前打开的由 onMounted 渲染（不在服务端输出浮层）
		watch(isActive, (v) => {
			if (!isMounted) return;
			if (v) {
				isRendered.value && renderKey.value++;
				isRendered.value = true;
			} else if (viewRef.value) {
				viewRef.value.toggle(false);
			} else {
				isRendered.value = false;
			}
		});

		// 挂载位置变化（Teleport 移动浮层）后，按新的坐标系重新定位
		watch(
			() => [props.to, props.portal],
			() => viewRef.value?.update(),
			{ flush: 'post' }
		);

		onMounted(() => {
			isMounted = true;
			isActive.value && (isRendered.value = true);
		});

		// KeepAlive 失活（如切换缓存的页面）：浮层在 Teleport 的目标里，不随页面移走，直接卸载
		onDeactivated(() => {
			if (!isRendered.value) return;
			isRendered.value = false;
			if (isActive.value) {
				isActive.value = false;
				sync();
			}
			emit('close');
		});

		// 重新激活：调用方仍要求打开时恢复（单向传入的 modelValue 不会随失活变为 false，如 Slider 的 always 提示）
		onActivated(() => {
			if (!props.modelValue || isActive.value) return;
			isActive.value = true;
			sync();
		});

		// 只传弹层的属性：trigger、tag 等属于触发器；插槽只传浮层用的，触发器的 default 不传
		const renderPopup = () => isRendered.value && (
			<Teleport to={props.to || 'body'} disabled={isInline.value}>
				<PopoverView
					// 切换触发方式时重新挂载：弹层按 hover 绑定、解绑的监听要对得上
					key={`${renderKey.value}-${isHover.value}`}
					ref={viewRef}
					{...viewProps.value}
					triggerElement={instance.vnode.el!}
					alone={false} // 由当前组件控制hover/click等情况
					hover={isHover.value}
					onChange={handleChange}
					onReady={() => emit('ready')}
					onClose={handleClose}
				>
					{{ header: slots.header, content: slots.content, footer: slots.footer }}
				</PopoverView>
			</Teleport>
		);

		return () => {
			return h(props.tag, {
				class: 'vc-popover',
				style: 'position: relative;',
				onFocus: (e: any) => isFocus.value && handleChange(e, { visible: true }),
				onBlur: (e: any) => isFocus.value && handleChange(e, { visible: false }),
				onMouseenter: (e: any) => (isHover.value || isStrictHover.value) && handleChange(e, { visible: true }),
				onMouseleave: (e: any) => (isHover.value || isStrictHover.value) && handleChange(e, { visible: false }),
				onMousedown: handleMousedown,
				onClick: (e: MouseEvent) => isClick.value && handleClick(e)
			}, [slots.default?.(), renderPopup()]);
		};
	}
});
