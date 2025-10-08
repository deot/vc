/** @jsxImportSource vue */

import { defineComponent, ref, reactive, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue';
import { getScroller } from '@deot/helper-dom';
import { props as affixProps } from './affix-props';

const COMPONENT_NAME = 'vc-affix';

export const Affix = defineComponent({
	name: COMPONENT_NAME,
	props: affixProps,
	setup(props, { slots, expose }) {
		const scroller = shallowRef<any>(); // 当前元素所在的滚动容器
		const container = shallowRef<HTMLElement>();
		const current = shallowRef<HTMLDivElement>();
		const currentRect = reactive({
			top: 0,
			bottom: 0,
			width: 0,
			height: 0
		});
		const isActive = ref(false);
		const transformY = ref(0);
		const windowHeight = ref(window.innerHeight);

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

			if (placement === 'top') {
				isActive.value = currentRect.top - containerRect.top <= props.offset;
				transformY.value = Math.min(containerRect.bottom - currentHeightOffset, 0);
			} else {
				isActive.value = currentRect.bottom - containerRect.top >= containerRect.height - props.offset;
				transformY.value = Math.max(containerRect.height - containerRect.top - currentHeightOffset, 0);
			}
		};

		const setFixedStatus = () => {
			const { placement, to, offset } = props;
			const currentHeightOffset = offset + currentRect.height;
			const containerRect: any = to && container.value!.getBoundingClientRect();
			if (placement === 'top') {
				if (to) {
					isActive.value = offset > currentRect.top && containerRect.bottom > 0;
					transformY.value = Math.min(containerRect.bottom - currentHeightOffset, 0);
				} else {
					isActive.value = offset > currentRect.top;
				}
			} else {
				if (to) {
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
			if (typeof props.to === 'string') {
				container.value = document.querySelector<HTMLElement>(props.to) ?? (void 0);
			}

			!container.value && (container.value = document.documentElement);
			// TODO: vc-scroller/wheel
			scroller.value = getScroller(current.value!);

			scroller.value?.addEventListener('scroll', refresh);

			refresh();
		});

		onBeforeUnmount(() => scroller.value?.removeEventListener('scroll', refresh));

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
						{ slots?.default?.() }
					</div>
				</div>
			);
		};
	}
});
