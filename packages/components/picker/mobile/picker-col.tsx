/** @jsxImportSource vue */

import { computed, defineComponent, h, ref, withModifiers } from 'vue';
import { prefixStyle } from '@deot/helper-dom';
import { useDrag } from '@deot/vc-hooks';
import { cloneDeep } from 'lodash-es';
import { Customer } from '../../customer';
import { getRowLabel, getRowValue } from './utils';
import type { PickerData, PickerValue } from '../types';
import type { Render } from '../../customer/types';
import type { PropType } from 'vue';

const COMPONENT_NAME = 'vcm-picker-col';
const ITEM_HEIGHT = 34;
const TRANSFORM = prefixStyle('transform').camel;
const TRANSFORM_KEBAB = prefixStyle('transform').kebab;
const TRANSITION = prefixStyle('transition').camel;

export const PickerCol = defineComponent({
	name: COMPONENT_NAME,
	props: {
		index: Number,
		data: {
			type: Array as PropType<PickerData[]>,
			default: () => []
		},
		itemStyle: Object as PropType<Record<string, any>>,
		value: [String, Number, Boolean] as PropType<PickerValue>,
		renderLabel: Function as Render
	},
	emits: ['change'],
	setup(props, { emit }) {
		const indicator = ref<HTMLElement>();
		const itemHeight = ref(ITEM_HEIGHT);
		const offsetY = ref(0);
		const scrollEnd = ref(true);
		const startY = ref(0);
		const startTime = ref(0);

		const selectedIndex = computed(() => {
			const index = props.data.findIndex(item => getRowValue(item) == props.value);
			return index >= 0 ? index : 0;
		});

		const maxH = computed(() => {
			return Math.max(props.data.length - 1, 0) * itemHeight.value;
		});

		const transform = computed(() => {
			return {
				[TRANSFORM]: `translate3d(0, calc(var(--vcm-picker-item-height) * ${-selectedIndex.value} - ${offsetY.value}px), 0)`
			};
		});

		const transition = computed(() => {
			return {
				[TRANSITION]: `${TRANSFORM_KEBAB} ${scrollEnd.value ? '500' : '0'}ms ease-out`
			};
		});

		const handleStart = (y: number) => {
			if (!props.data.length) return false;
			itemHeight.value = indicator.value?.getBoundingClientRect().height || ITEM_HEIGHT;

			scrollEnd.value = false;
			startY.value = y;
			startTime.value = Date.now();
			return true;
		};

		const handleMove = (y: number) => {
			offsetY.value = startY.value - y;
		};

		// 回弹到当前选中项；手势被打断（touchcancel、mouseup 丢失）时只回弹，不选中
		const reset = () => {
			scrollEnd.value = true;
			startY.value = 0;
			offsetY.value = 0;
		};

		const handleEnd = (y: number) => {
			if (!props.data.length) return;

			let translateY: number;
			const dt = Date.now() - startTime.value;
			if (dt > 500 || dt < 50) {
				translateY = selectedIndex.value * itemHeight.value + offsetY.value;
			} else {
				const dy = startY.value - y;
				const speed = dy / dt;
				translateY = selectedIndex.value * itemHeight.value + speed * 500;
			}

			let target: PickerData;
			if (translateY <= 0) {
				target = props.data[0];
			} else if (translateY >= maxH.value) {
				target = props.data[props.data.length - 1];
			} else {
				target = props.data[Math.round(translateY / itemHeight.value)];
			}

			emit('change', cloneDeep(target));
			reset();
		};

		const drag = useDrag({
			start: (_, point) => handleStart(point.screenY),
			move: (_, point) => handleMove(point.screenY),
			end: (_, point) => handleEnd(point.screenY),
			cancel: reset
		});

		const renderItem = (item: PickerData, index: number) => {
			const label = getRowLabel(item);

			if (typeof props.renderLabel === 'function') {
				return h(Customer, {
					render: props.renderLabel,
					label,
					row: item,
					index
				} as any);
			}

			if (typeof label === 'function') {
				return h(Customer, {
					render: label,
					row: item,
					index
				} as any);
			}

			return label;
		};

		return () => {
			return (
				<div
					class="vcm-picker-col"
					onTouchstart={withModifiers(drag.listeners.onTouchstart, ['prevent', 'stop'])}
					onTouchmove={withModifiers(drag.listeners.onTouchmove, ['prevent', 'stop'])}
					onTouchend={withModifiers(drag.listeners.onTouchend, ['prevent', 'stop'])}
					onTouchcancel={withModifiers(drag.listeners.onTouchcancel, ['prevent', 'stop'])}
					onMousedown={withModifiers(drag.listeners.onMousedown, ['prevent', 'stop'])}
				>
					<div class="vcm-picker-col__mask" />
					<div ref={indicator} class="vcm-picker-col__indicator" />
					<div style={[transform.value, transition.value]} class="vcm-picker-col__wrapper">
						{
							props.data.map((item, index) => (
								<div
									key={index}
									style={props.itemStyle}
									class="vcm-picker-col__item"
								>
									{ renderItem(item, index) }
								</div>
							))
						}
					</div>
				</div>
			);
		};
	}
});
