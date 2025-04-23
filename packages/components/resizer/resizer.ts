import { h, defineComponent, ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as resizerProps } from './resizer-props';

const COMPONENT_NAME = 'vc-resizer';

export const Resizer = defineComponent({
	name: COMPONENT_NAME,
	props: resizerProps,
	emit: ['resize', 'change'],
	setup(props, { emit, slots }) {
		const width = ref(0);
		const height = ref(0);
		const current = ref();

		const currentExposed = computed(() => {
			return {
				height: height.value,
				width: width.value,
				style: `height: ${height.value}px; width: ${width.value}px`
			};
		});

		let hasInitial = false;
		const handleResize = () => {
			let { width: width$, height: height$ } = current.value.getBoundingClientRect();
			const { paddingLeft, paddingRight, paddingTop, paddingBottom } = window.getComputedStyle(current.value);
			const left = Number.parseInt(paddingLeft) || 0;
			const right = Number.parseInt(paddingRight) || 0;
			const top = Number.parseInt(paddingTop) || 0;
			const bottom = Number.parseInt(paddingBottom) || 0;

			width$ -= (left + right);
			height$ -= (top + bottom);

			const heightChanged = height.value != height$;
			const widthChanged = width.value != width$;

			heightChanged && (height.value = height$);
			widthChanged && (width.value = width$);

			if (heightChanged || widthChanged) {
				hasInitial && emit('resize', currentExposed.value);
				emit('change', currentExposed.value);
			}

			hasInitial = true;
		};

		onMounted(() => {
			Resize.on(current.value, handleResize); // 首次会执行一次
		});

		onBeforeUnmount(() => {
			Resize.off(current.value, handleResize);
		});

		return () => {
			return h(
				props.tag,
				{
					ref: current,
					class: 'vc-resizer'
				},
				slots.default?.(currentExposed.value)
			);
		};
	}
});
