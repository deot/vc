/** @jsxImportSource vue */

import { defineComponent, watch, ref, computed, getCurrentInstance } from 'vue';
import { useScrollbar } from '@deot/vc-hooks';
import { MTransitionFade, MTransitionSlide } from '../../transition/index.m';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { MIcon } from '../../icon/index.m';
import { MScroller } from '../../scroller/index.m';
import { usePopupTouch, EASING } from './use-popup-touch';

import { props as popupProps } from './popup-props';

const COMPONENT_NAME = 'vc-popup';

// 进入、离开动画（遮罩同步）
const ENTER_DURATION = 450;
const LEAVE_DURATION = 240;
const TRANSITION_STYLE = { animationFillMode: 'both', animationTimingFunction: EASING };

export const MPopup = defineComponent({
	name: COMPONENT_NAME,
	props: popupProps,
	emits: [
		'update:modelValue',
		'close',
		'portal-fulfilled',
		'visible-change'
	],
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance()!;
		const isActive = ref(false);
		// 手势滑出后关闭：面板已在屏幕外，离场动画跳过
		const isSwiped = ref(false);
		const root = ref<HTMLElement>();
		const wrapper = ref<HTMLElement>();
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

		const touch = usePopupTouch(props, {
			root,
			wrapper,
			mask,
			isActive,
			close: () => {
				isSwiped.value = true;
				isActive.value = false;
			}
		});

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

		// 有标题栏、content 或 footer 插槽时，面板分为标题栏、内容区、底部；否则默认插槽直接放在面板内
		const renderPanel = () => {
			const hasHeader = !!slots.header || props.closable || (props.title !== false && hasCustomerValue(props.title));
			const hasContent = hasCustomerValue(props.content);
			if (!hasHeader && !hasContent && !slots.footer) return { structured: false, nodes: slots.default?.() };

			const body = [
				hasContent && <MCustomer render={props.content} />,
				slots.default?.()
			];
			return { structured: true, nodes: [
				hasHeader && (
					<div class="vcm-popup__header">
						<MCustomer class="vcm-popup__title" render={slots.header || props.title} />
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
							<MScroller class="vcm-popup__scroller" contentClass="vcm-popup__content">
								{body}
							</MScroller>
						)
					: (<div class="vcm-popup__content">{body}</div>),
				slots.footer && (<div class="vcm-popup__footer">{slots.footer()}</div>)
			] };
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
								{ 'is-structured': panel.structured },
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
