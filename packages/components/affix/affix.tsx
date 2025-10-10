/** @jsxImportSource vue */

import { defineComponent, ref, reactive, shallowRef, computed, onMounted, onBeforeUnmount, inject } from 'vue';
import { getScroller } from '@deot/helper-dom';
import { props as affixProps } from './affix-props';

const COMPONENT_NAME = 'vc-affix';

const SCROLLER_WHEEL_REG = /vc-scroller-wheel/;

export const Affix = defineComponent({
	name: COMPONENT_NAME,
	props: affixProps,
	setup(props, { slots, expose }) {
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

		const isVcScrollerWheel = computed(() => {
			return SCROLLER_WHEEL_REG.test(scroller.value?.className || '');
		});

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
			const rect = current.value!.getBoundingClientRect();
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
				transformY.value = Math.max(containerRect.height - containerRect.top - currentHeightOffset, 0) + transformOffsetY;
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

		const refresh = () => {
			setCurrentRect();

			scroller.value instanceof Window || props.fixed ? setFixedStatus() : setAbsoluteStatus();
		};

		onMounted(() => {
			if (typeof props.target === 'string') {
				base.value = document.querySelector<HTMLElement>(props.target) ?? (void 0);
			}

			!base.value && (base.value = document.documentElement);
			scroller.value = getScroller(current.value!, { className: SCROLLER_WHEEL_REG });

			if (isVcScrollerWheel.value) {
				scrollerInstance?.on(refresh);
			} else {
				scroller.value?.addEventListener('scroll', refresh);
			}

			refresh();
		});

		onBeforeUnmount(() => {
			if (isVcScrollerWheel.value) {
				scrollerInstance?.off(refresh);
			} else {
				scroller.value?.removeEventListener('scroll', refresh);
			}
		});

		expose({ refresh });

		return () => {
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
