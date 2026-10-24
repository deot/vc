/** @jsxImportSource vue */

import { defineComponent, ref, reactive, shallowRef, computed, watch, onMounted, onBeforeUnmount, provide, nextTick } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as affixProps } from './affix-props';
import { getViewportRect } from '../scroller/utils';
import { ScrollerManager } from '../scroller/manager';

const COMPONENT_NAME = 'vc-affix';
const SHARED = { shared: true };

export const Affix = defineComponent({
	name: COMPONENT_NAME,
	emits: ['update:modelValue'],
	props: affixProps,
	setup(props, { slots, expose, emit }) {
		const scroller = shallowRef<any>(); // 当前元素所在的滚动容器（最近一层，可能为 window），吸附位置以它为参照
		const base = shallowRef<HTMLElement>(); // 当前元素（props.tagret）的参考容器
		const current = shallowRef<HTMLDivElement>(); // 当前元素（外层）：宽度由布局决定，吸附时只写占位高度
		const content = shallowRef<HTMLDivElement>(); // 固定层：高度由内容撑开，吸附时只写宽度

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
				height: `${currentRect.height}px`
			};
		});

		const contentStyle = computed(() => {
			if (!props.fixed || !isActive.value) return {};
			const offset = `${props.offset}px`;
			return {
				width: `${currentRect.width}px`,
				top: props.placement === 'top' ? offset : '',
				bottom: props.placement === 'bottom' ? offset : '',
				zIndex: props.zIndex,
				transform: transformY.value ? `translateY(${transformY.value}px)` : '',
			};
		});

		/**
		 * fixed：宽度与位置取外层，高度取固定层，都不量自己写上的值，吸附期间容器或内容变化也能跟上；
		 * bottom 按内容高度推算，外层的占位高度可能还是上一次的值
		 * sticky：不写尺寸，外层即内容
		 */
		const setCurrentRect = () => {
			const rect = current.value?.getBoundingClientRect?.();
			if (!rect) return;
			const height = props.fixed
				? content.value?.getBoundingClientRect?.().height ?? rect.height
				: rect.height;
			Object.assign(currentRect, {
				top: rect.top,
				bottom: rect.top + height,
				width: rect.width,
				height
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

		/**
		 * 滚动回调：自身的 refresh 与子组件（如 Tabs）经 onScroll 登记的回调
		 * 挂载时统一订阅当前元素所在滚动容器链（逐层向上）及页面的滚动，见 ScrollerManager.subscribe
		 */
		const handlers = new Set<(...args: any[]) => void>();
		let unsubscribe = () => {};

		const offScroll = (handler: any) => {
			handlers.delete(handler);
		};

		const onScroll = (handler: any, options?: any) => {
			handlers.add(handler);
			// nextTick目的在与onMounted后执行
			options?.first && nextTick(handler);
			return () => offScroll(handler);
		};

		const refresh = () => {
			if (props.disabled) return;
			setCurrentRect();

			props.fixed ? setFixedStatus() : setStickyStatus();

			emit('update:modelValue', isActive.value);
		};

		/**
		 * 尺寸变化时重算，不必等下一次滚动：外层随容器宽度变化，固定层随内容高度变化；
		 * 窗口尺寸变化时吸附线也会变（如只改窗口高度时吸底），一并重算
		 */
		const handleResize = () => {
			refresh();
		};
		watch([current, content], () => {
			Resize.disconnect(handleResize);
			current.value && Resize.on(current.value, handleResize, SHARED);
			content.value && Resize.on(content.value, handleResize, SHARED);
		}, { flush: 'post' });

		onMounted(() => {
			if (typeof props.target === 'string') {
				base.value = document.querySelector<HTMLElement>(props.target) ?? (void 0);
			}

			!base.value && (base.value = document.documentElement);
			if (current.value) {
				const result = ScrollerManager.subscribe(current.value, () => handlers.forEach(fn => fn()), { window: true });
				scroller.value = result.scrollers[0] || window;
				unsubscribe = result.off;
			}

			onScroll(refresh, { first: true });
			window.addEventListener('resize', handleResize);
		});

		onBeforeUnmount(() => {
			unsubscribe();
			Resize.disconnect(handleResize);
			window.removeEventListener('resize', handleResize);
		});

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
						ref={content}
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
