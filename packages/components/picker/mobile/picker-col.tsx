/** @jsxImportSource vue */

import { computed, defineComponent, h, ref, withModifiers } from 'vue';
import { prefixStyle } from '@deot/helper-dom';
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
		const scrollStart = ref(false);
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
			if (!props.data.length) return;
			itemHeight.value = indicator.value?.getBoundingClientRect().height || ITEM_HEIGHT;

			scrollStart.value = true;
			scrollEnd.value = false;
			startY.value = y;
			startTime.value = Date.now();
		};

		const handleMove = (y: number) => {
			if (!scrollStart.value) return;
			offsetY.value = startY.value - y;
		};

		const handleEnd = (y: number) => {
			if (!scrollStart.value || !props.data.length) return;

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

			scrollStart.value = false;
			scrollEnd.value = true;
			startY.value = 0;
			offsetY.value = 0;
		};

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
					onTouchstart={withModifiers((e: Event) => handleStart((e as TouchEvent).touches[0].screenY), ['prevent', 'stop'])}
					onTouchmove={withModifiers((e: Event) => handleMove((e as TouchEvent).touches[0].screenY), ['prevent', 'stop'])}
					onTouchend={withModifiers((e: Event) => handleEnd((e as TouchEvent).changedTouches[0].screenY), ['prevent', 'stop'])}
					onMousedown={withModifiers((e: Event) => handleStart((e as MouseEvent).screenY), ['prevent', 'stop'])}
					onMousemove={withModifiers((e: Event) => handleMove((e as MouseEvent).screenY), ['prevent', 'stop'])}
					onMouseup={withModifiers((e: Event) => handleEnd((e as MouseEvent).screenY), ['prevent', 'stop'])}
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
