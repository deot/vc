/** @jsxImportSource vue */

import { defineComponent, ref, reactive, shallowRef, computed, onMounted, onBeforeUnmount, inject, provide, nextTick } from 'vue';
import { props as affixProps } from './affix-props';
import { getScroller, getViewportRect } from '../scroller/utils';

const COMPONENT_NAME = 'vc-affix';

export const Affix = defineComponent({
	name: COMPONENT_NAME,
	emits: ['update:modelValue'],
	props: affixProps,
	setup(props, { slots, expose, emit }) {
		const scrollerInstance = inject<any>('vc-scroller', null);
		const scroller = shallowRef<any>(); // 当前元素所在的滚动容器
		const base = shallowRef<HTMLElement>(); // 当前元素（props.tagret）的参考容器
		const current = shallowRef<HTMLDivElement>(); // 当前元素

		const currentRect = reactive({
			top: 0,
			bottom: 0,
			width: 0,
			height: 0
		});

		const isActive = ref(false);
		const transformY = ref(0);

		// fixed=false：由 position: sticky 固定在滚动容器内，吸附位置不依赖 JS，滚动时不会抖动
		const currentStyle = computed(() => {
			if (!props.fixed) {
				return {
					top: props.placement === 'top' ? `${props.offset}px` : '',
					bottom: props.placement === 'bottom' ? `${props.offset}px` : '',
					zIndex: props.zIndex
				};
			}
			if (!isActive.value) return {};
			return {
				height: `${currentRect.height}px`,
				width: `${currentRect.width}px`
			};
		});

		const contentStyle = computed(() => {
			if (!props.fixed || !isActive.value) return {};
			const offset = `${props.offset}px`;
			return {
				height: `${currentRect.height}px`,
				width: `${currentRect.width}px`,
				top: props.placement === 'top' ? offset : '',
				bottom: props.placement === 'bottom' ? offset : '',
				zIndex: props.zIndex,
				transform: transformY.value ? `translateY(${transformY.value}px)` : '',
			};
		});

		const setCurrentRect = () => {
			const rect = current.value?.getBoundingClientRect?.();
			if (!rect) return;
			Object.assign(currentRect, {
				top: rect.top,
				bottom: rect.bottom,
				width: rect.width,
				height: rect.height
			});
		};

		// sticky 以滚动容器去掉边框与 padding 后的可视区为参照；恰好停在吸附线上即为吸附中（被父元素带走后不再算）
		// offset 为 CSS px，祖先有缩放时按 scale 换算为视口 px
		const setStickyStatus = () => {
			if (!scroller.value) return;
			const { placement, offset } = props;
			const { top, bottom, scale } = getViewportRect(scroller.value);

			isActive.value = placement === 'bottom'
				? Math.abs(bottom - offset * scale - currentRect.bottom) < 1
				: Math.abs(currentRect.top - top - offset * scale) < 1;
		};

		const setFixedStatus = () => {
			const { placement, target, offset } = props;
			// 每次实时读取：窗口高度会变化
			const windowHeight = window.innerHeight;
			const currentHeightOffset = offset + currentRect.height;
			const containerRect: any = target && base.value!.getBoundingClientRect();
			if (placement === 'top') {
				if (target) {
					isActive.value = offset > currentRect.top && containerRect.bottom > 0;
					transformY.value = Math.min(containerRect.bottom - currentHeightOffset, 0);
				} else {
					isActive.value = offset > currentRect.top;
				}
			} else {
				if (target) {
					isActive.value = windowHeight - offset < currentRect.bottom && windowHeight > containerRect.top;
					transformY.value = -Math.min(windowHeight - containerRect.top - currentHeightOffset, 0);
				} else {
					isActive.value = windowHeight - offset < currentRect.bottom;
				}
			}
		};

		// 所在滚动容器正是注入的 VC Scroller 时订阅其滚动通知：ScrollerWheel 由滚轮驱动时与滚动同一帧回调
		// 注入的是更外层的 Scroller（中间另有滚动容器）时，改为监听原生 scroll
		const isInjectedScroller = () => !!scrollerInstance && scrollerInstance.wrapper === scroller.value;

		const offScroll = (handler: any) => {
			if (isInjectedScroller()) {
				scrollerInstance.off(handler);
			} else {
				scroller.value?.removeEventListener('scroll', handler);
			}
		};

		const onScroll = (handler: any, options: any) => {
			// nextTick目的在与onMounted后执行
			nextTick(() => {
				if (isInjectedScroller()) {
					scrollerInstance.on(handler);
				} else {
					scroller.value?.addEventListener('scroll', handler);
				}
				options?.first && handler();
			});
			return () => offScroll(handler);
		};

		const refresh = () => {
			if (props.disabled) return;
			setCurrentRect();

			props.fixed ? setFixedStatus() : setStickyStatus();

			emit('update:modelValue', isActive.value);
		};

		onMounted(() => {
			if (typeof props.target === 'string') {
				base.value = document.querySelector<HTMLElement>(props.target) ?? (void 0);
			}

			!base.value && (base.value = document.documentElement);
			scroller.value = getScroller(current.value!);

			onScroll(refresh, { first: true });
		});

		onBeforeUnmount(() => offScroll(refresh));

		expose({ refresh, onScroll, offScroll });
		provide('vc-affix', {
			props,
			isActive,
			refresh,
			onScroll,
			offScroll
		});
		return () => {
			if (props.disabled) return slots?.default?.({ active: false });
			return (
				<div
					ref={current}
					class={['vc-affix', { 'is-sticky': !props.fixed }]}
					style={currentStyle.value}
				>
					<div
						class={{ 'vc-affix__fixed': props.fixed && isActive.value }}
						style={contentStyle.value}
					>
						{ slots?.default?.({ active: isActive.value }) }
					</div>
				</div>
			);
		};
	}
});
