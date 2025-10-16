/** @jsxImportSource vue */

import { defineComponent, ref, reactive, shallowRef, computed, onMounted, onBeforeUnmount, inject, provide, nextTick } from 'vue';
import { props as affixProps } from './affix-props';
import { isWheel, getScroller } from '../scroller/utils';

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
		const windowHeight = ref(window.innerHeight);

		const isVcScrollerWheel = computed(() => isWheel(scroller.value));

		const currentStyle = computed(() => {
			if (!isActive.value) return {};
			return {
				height: `${currentRect.height}px`,
				width: `${currentRect.width}px`
			};
		});

		const contentStyle = computed(() => {
			if (!isActive.value) return {};
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

		const setAbsoluteStatus = () => {
			const { placement, offset } = props;
			const currentHeightOffset = offset + currentRect.height;
			const containerRect = scroller.value!.getBoundingClientRect();
			let transformOffsetY = 0;

			// scroller-wheel滚动条偏移
			if (scrollerInstance && isVcScrollerWheel.value) {
				const maxMoveY = scrollerInstance.scrollHeight! - scrollerInstance.clientHeight!;
				transformOffsetY = scrollerInstance.scrollTop! >= maxMoveY ? maxMoveY : scrollerInstance.scrollTop;
			}

			if (placement === 'top') {
				isActive.value = currentRect.top - containerRect.top <= props.offset;
				transformY.value = Math.min(containerRect.bottom - currentHeightOffset, 0) + transformOffsetY;
			} else {
				isActive.value = currentRect.bottom - containerRect.top >= containerRect.height - props.offset;
				transformY.value = transformOffsetY;
			}
		};

		const setFixedStatus = () => {
			const { placement, target, offset } = props;
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
					isActive.value = windowHeight.value - offset < currentRect.bottom && windowHeight.value > containerRect.top;
					transformY.value = -Math.min(windowHeight.value - containerRect.top - currentHeightOffset, 0);
				} else {
					isActive.value = windowHeight.value - offset < currentRect.bottom;
				}
			}
		};

		const offScroll = (handler: any) => {
			if (isVcScrollerWheel.value) {
				scrollerInstance?.off(handler);
			} else {
				scroller.value?.removeEventListener('scroll', handler);
			}
		};

		const onScroll = (handler: any, options: any) => {
			// nextTick目的在与onMounted后执行
			nextTick(() => {
				if (isVcScrollerWheel.value) {
					scrollerInstance?.on(handler);
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

			scroller.value instanceof Window || props.fixed ? setFixedStatus() : setAbsoluteStatus();

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
					class="vc-affix"
					style={currentStyle.value}
				>
					<div
						class={{ [`vc-affix__${props.fixed ? 'fixed' : 'absolute'}`]: isActive.value }}
						style={contentStyle.value}
					>
						{ slots?.default?.({ active: isActive.value }) }
					</div>
				</div>
			);
		};
	}
});
