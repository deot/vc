/** @jsxImportSource vue */

import { defineComponent, watch, ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';
import { composedPath } from '@deot/helper-dom';
import { Utils } from '@deot/vc-shared';
import { MTransitionFade, MTransitionSlide } from '../../transition/index.m';

import { props as popupProps } from './popup-props';

const COMPONENT_NAME = 'vc-popup';

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
		const classes = computed(() => {
			return {
				[`is-${props.placement}`]: true,
				[`is-${props.theme}`]: true,
			};
		});
		const Content = props.placement === 'center' ? MTransitionFade : MTransitionSlide;

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

		/**
		 * 动画执行后关闭
		 * 同时close兼容portal设计
		 */
		const handleRemove = () => {
			!instance.isUnmounted && (
				emit('close'),
				emit('portal-fulfilled'),
				emit('update:modelValue', false),
				emit('visible-change', false)
			);
		};

		let startY: number;
		let scrollContainer: any;
		const handleTouchStart = (e: any) => {
			if (isActive.value) {
				startY = e.touches[0].pageY;
			}
		};

		const handleTouchMove = (e) => {
			// 显示状态下才处理滑动
			if (!isActive.value) return;
			const path = e.path || composedPath(e) || [];
			const inContainer = path.some((ele: any) => {
				if (Utils.eleInRegExp(ele, props.scrollRegExp)) {
					scrollContainer = ele;
					return true;
				}
				return false;
			});
			// 容器外的滑动禁止
			if (!inContainer) { e.preventDefault(); return; }

			const moveY = e.touches[0].pageY;
			const top = scrollContainer.scrollTop;
			const ch = scrollContainer.clientHeight;
			const sh = scrollContainer.scrollHeight;
			if ((top === 0 && moveY > startY) || (top + ch === sh && moveY < startY)) {
				// 到底或到头都禁止
				e.preventDefault();
			}
		};

		const operateDOMEvents = (type: string) => {
			const fn = (type === 'add' ? document.addEventListener : document.removeEventListener).bind(document);
			fn('touchstart', handleTouchStart);
			fn('touchmove', handleTouchMove, { passive: false }); // 是否会使用preventDefault()，false表示使用
		};

		onMounted(() => operateDOMEvents('add'));
		onBeforeUnmount(() => operateDOMEvents('remove'));

		expose({
			isActive, // for portal
			toggle(v?: boolean) {
				v = typeof v === 'boolean' ? v : !isActive.value;
				isActive.value = v;
			},
		});
		return () => {
			return (
				<div class={[classes.value, 'vcm-popup']}>
					<MTransitionFade>
						<div
							// @ts-ignore
							vShow={props.mask && isActive.value}
							class="vcm-popup__mask"
							onClick={() => handleClose(props.maskClosable)}
							onTouchmovePrevent={() => {}}
						/>
					</MTransitionFade>
					<Content
						mode={props.placement}
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						<div
							// @ts-ignore
							vShow={isActive.value}
							style={[{ position: props.fixed ? 'fixed' : 'absolute' }, props.wrapperStyle as any]}
							class={[props.wrapperClass, 'vcm-popup__wrapper']}
						>
							{ slots?.default?.()}
						</div>
					</Content>
				</div>
			);
		};
	}
});
