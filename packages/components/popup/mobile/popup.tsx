/** @jsxImportSource vue */

import { defineComponent, watch, ref, computed, getCurrentInstance } from 'vue';
import type { Slot, VNode } from 'vue';
import { useScrollbar } from '@deot/vc-hooks';
import { MTransitionFade, MTransitionSlide } from '../../transition/index.m';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { MIcon } from '../../icon/index.m';
import { MScroller } from '../../scroller/index.m';
import { usePopupTouch } from './use-popup-touch';
import { usePopupSnaps } from './use-popup-snaps';
import { EASING } from './constants';

import { props as popupProps } from './popup-props';
import type { PopupSlotProps } from './popup-props';

const COMPONENT_NAME = 'vc-popup';

// 进入、离开动画（遮罩同步）
const ENTER_DURATION = 450;
const LEAVE_DURATION = 240;
const TRANSITION_STYLE = { animationFillMode: 'both', animationTimingFunction: EASING };
// 拖动事件对应的监听（含 Once）
const LISTENERS = {
	dragstart: ['onDragstart', 'onDragstartOnce'],
	drag: ['onDrag', 'onDragOnce'],
	dragend: ['onDragend', 'onDragendOnce']
} as const;

export const MPopup = defineComponent({
	name: COMPONENT_NAME,
	props: popupProps,
	emits: [
		'update:modelValue',
		'close',
		'portal-fulfilled',
		'visible-change',
		'update:snap',
		'dragstart',
		'drag',
		'dragend'
	],
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance()!;
		const isActive = ref(false);
		// 手势滑出后关闭：面板已在屏幕外，离场动画跳过
		const isSwiped = ref(false);
		const root = ref<HTMLElement>();
		const wrapper = ref<HTMLElement>();
		const handle = ref<HTMLElement>();
		const footer = ref<HTMLElement>();
		const mask = ref<HTMLElement>();

		const classes = computed(() => {
			return {
				[`is-${props.placement}`]: true,
				[`is-${props.theme}`]: true,
			};
		});

		const duration = computed(() => ({ enter: ENTER_DURATION, leave: isSwiped.value ? 0 : LEAVE_DURATION }));

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		/**
		 * 立即执行关闭操作，内部主动触发
		 * @param allow ~
		 */
		const handleClose = (allow = true) => {
			if (allow) {
				isActive.value = false;
			}
		};

		const snaps = usePopupSnaps(props, {
			root,
			wrapper,
			footer,
			mask,
			isActive,
			emitSnap: index => emit('update:snap', index)
		});

		// 面板是否在跟手：只给插槽参数用，Popup 自身的渲染不读取
		const dragging = ref(false);
		// 有监听时才生成拖动事件的 payload（drag 每帧触发）
		const notify = (name: keyof typeof LISTENERS, build: () => unknown) => {
			const vnodeProps = instance.vnode.props;
			const [key, once] = LISTENERS[name];
			vnodeProps && (vnodeProps[key] || vnodeProps[once]) && emit(name, build());
		};

		const touch = usePopupTouch(props, {
			root,
			wrapper,
			handle,
			mask,
			isActive,
			snaps,
			dragging,
			notify,
			close: () => {
				isSwiped.value = true;
				isActive.value = false;
			}
		});

		// 指示器：设置了 snaps 时默认显示
		const showHandle = computed(() => props.handle ?? snaps.enabled.value);
		const contentClass = computed(() => ['vcm-popup__content', props.contentClass] as any);

		watch(isActive, (v) => {
			if (!v) return;
			isSwiped.value = false;
			touch.reset();
			emit('visible-change', true);
		});

		/**
		 * 动画执行后关闭
		 * 同时close兼容portal设计
		 */
		const handleRemove = () => {
			touch.reset();
			snaps.reset();
			isSwiped.value = false;
			!instance.isUnmounted && (
				emit('close'),
				emit('portal-fulfilled'),
				emit('update:modelValue', false),
				emit('visible-change', false)
			);
		};

		useScrollbar(isActive);

		expose({
			isActive, // for portal
			toggle(v?: boolean) {
				v = typeof v === 'boolean' ? v : !isActive.value;
				isActive.value = v;
			},
		});

		// header / handle / footer 插槽的参数：取值时才读取状态；插槽各自在 MCustomer 中渲染，状态变化只更新用到它的插槽
		const slotProps: PopupSlotProps = {
			get snap() {
				return snaps.index.value;
			},
			get full() {
				return snaps.isFull.value;
			},
			get dragging() {
				return dragging.value;
			},
			close: () => handleClose(),
			snapTo: (index: number) => snaps.snapTo(index),
			next: () => snaps.next()
		};
		// 插槽函数绑定参数：随插槽函数一起变化（父级传入新的插槽时 MCustomer 随之更新），不变时 MCustomer 不重新渲染
		const bound = new WeakMap<Slot, () => VNode[]>();
		const withProps = (slot: Slot) => {
			let render = bound.get(slot);
			!render && bound.set(slot, render = () => slot(slotProps));
			return render;
		};

		// 指示器：bottom 在面板顶部，top 在面板底部；拖动时按方向加 is-up / is-down（两段横条倾斜成 ^ / V），#handle 插槽可替换横条
		const renderHandle = () => showHandle.value && (
			<div ref={handle} class="vcm-popup__handle" onClick={snaps.next}>
				{slots.handle ? <MCustomer render={withProps(slots.handle)} /> : <span class="vcm-popup__indicator" />}
			</div>
		);

		// 有标题栏、content 或 footer 插槽时，面板分为标题栏、内容区、底部；否则默认插槽直接放在面板内
		// 默认插槽在 MCustomer 中渲染：档位、全屏等状态变化时只更新面板，不重新渲染内容
		const renderPanel = () => {
			const hasHeader = !!slots.header || props.closable || (props.title !== false && hasCustomerValue(props.title));
			const hasContent = hasCustomerValue(props.content);
			// 指示器：bottom 在最前，top 在最后
			const withHandle = (nodes: any[]) => (props.placement === 'top' ? [...nodes, renderHandle()] : [renderHandle(), ...nodes]);
			const content = slots.default && <MCustomer render={slots.default} />;
			if (!hasHeader && !hasContent && !slots.footer) {
				return { structured: false, nodes: withHandle([content]) };
			}

			const body = [
				hasContent && <MCustomer render={props.content} />,
				content
			];
			return { structured: true, nodes: withHandle([
				hasHeader && (
					<div class="vcm-popup__header">
						{/* wrap：#header 插槽与空标题也有 .vcm-popup__title（占满剩余宽度，关闭按钮在右侧） */}
						<MCustomer class="vcm-popup__title" wrap render={slots.header ? withProps(slots.header) : props.title} />
						{
							props.closable && (
								<span class="vcm-popup__close" onClick={() => handleClose()}>
									<MIcon type="close" />
								</span>
							)
						}
					</div>
				),
				props.scrollable
					? (
							<MScroller
								class={['vcm-popup__scroller', { 'is-locked': snaps.isLocked.value }]}
								contentClass={contentClass.value}
								contentStyle={props.contentStyle as any}
							>
								{body}
							</MScroller>
						)
					: (<div class={contentClass.value} style={props.contentStyle as any}>{body}</div>),
				slots.footer && (<div ref={footer} class="vcm-popup__footer"><MCustomer render={withProps(slots.footer)} /></div>)
			]) };
		};

		return () => {
			// 按当前位置选择动画，placement 可在运行时切换
			const Content = props.placement === 'center' ? MTransitionFade : MTransitionSlide;
			const panel = renderPanel();
			return (
				<div
					ref={root}
					class={[classes.value, 'vcm-popup']}
					{...touch.listeners}
				>
					<MTransitionFade duration={duration.value} style={TRANSITION_STYLE}>
						<div
							ref={mask}
							// @ts-ignore
							vShow={props.mask && isActive.value}
							class="vcm-popup__mask"
							onClick={() => handleClose(props.maskClosable)}
							onTouchmovePrevent={() => {}}
						/>
					</MTransitionFade>
					<Content
						mode={props.placement}
						duration={duration.value}
						style={TRANSITION_STYLE}
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						<div
							ref={wrapper}
							// @ts-ignore
							vShow={isActive.value}
							style={[{ position: props.fixed ? 'fixed' : 'absolute' }, props.wrapperStyle as any]}
							class={[
								props.wrapperClass,
								{
									'is-structured': panel.structured,
									'is-snapped': snaps.enabled.value,
									'is-full': snaps.isFull.value,
									'is-handled': showHandle.value
								},
								'vcm-popup__wrapper'
							]}
						>
							{panel.nodes}
						</div>
					</Content>
				</div>
			);
		};
	}
});
