import { h, defineComponent, ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as resizerProps } from './resizer-props';

const COMPONENT_NAME = 'vc-resizer';

export const Resizer = defineComponent({
	name: COMPONENT_NAME,
	props: resizerProps,
	emits: ['resize'],
	setup(props, { emit, slots, expose }) {
		const width = ref(0);
		const height = ref(0);
		const current = ref();

		const classes = computed(() => {
			const v = Array.isArray(props.fill) ? props.fill : [props.fill, props.fill];
			return {
				'is-fill-width': v[0],
				'is-fill-height': v[1]
			};
		});
		const currentExposed = computed(() => {
			return {
				height: height.value,
				width: width.value,
				style: `height: ${height.value}px; width: ${width.value}px`
			};
		});

		let locked = false;
		let hasInitial = false;
		const handleResize = () => {
			if (locked) return;
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
				emit('resize', {
					...currentExposed.value,
					inited: hasInitial
				});
			}

			hasInitial = true;
		};

		let timer: any;
		const refresh = () => {
			handleResize();
			locked = true;
			// 避免连续触发（下一帧执行完成后16.66，下下帧开始前33.33）
			timer = setTimeout(() => (locked = false), 20);
		};
		onMounted(() => {
			Resize.on(current.value, handleResize); // 首次会执行一次
		});

		onBeforeUnmount(() => {
			Resize.off(current.value, handleResize);
			timer && clearTimeout(timer);
		});

		expose({ refresh, offsetHeight: height, offsetWidth: width });

		return () => {
			return h(
				props.tag,
				{
					ref: current,
					class: ['vc-resizer', classes.value]
				},
				slots.default?.(currentExposed.value)
			);
		};
	}
});
