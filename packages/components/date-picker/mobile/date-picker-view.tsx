/** @jsxImportSource vue */

import { computed, defineComponent, inject, ref, watch } from 'vue';
import { isEqual } from 'lodash-es';
import { MPickerView } from '../../picker/index.m';
import { useLocale } from '../../locale';
import { props as datePickerViewProps } from './date-picker-view-props';
import {
	createContext,
	formatPointText,
	formatPoints,
	isRangeType,
	resolveColumns,
	resolvePoints,
	valuesToDate
} from './utils';
import type { PickerColumn, PickerData, PickerValue } from '../../picker/types';

const COMPONENT_NAME = 'vcm-date-picker-view';

export const MDatePickerView = defineComponent({
	name: COMPONENT_NAME,
	props: datePickerViewProps,
	emits: ['update:modelValue', 'change', 'picker-change'],
	setup(props, { emit }) {
		const { t, locale } = useLocale();
		const formItem = inject<any>('vc-form-item', {});

		// 选中的点：单值 [date]，范围 [start, end]
		const points = ref<Date[]>([]);
		// 范围时滚轮编辑的一侧：0 开始，1 结束
		const active = ref<0 | 1>(0);
		const values = ref<PickerValue[]>([]);
		const columns = ref<PickerColumn[]>([]);
		// 最近一次发出的值：v-model 回传时不再重新解析
		let emitted: any;

		const context = computed(() => createContext(props, t));
		const isRange = computed(() => isRangeType(context.value.type));

		// 结束一侧不早于开始值
		const getBound = (side: number) => (side === 1 ? points.value[0] : void 0);

		// 按当前一侧的点生成各列，并把校正后的日期写回
		const refresh = () => {
			const side = active.value;
			const result = resolveColumns(context.value, points.value[side], getBound(side));
			points.value.splice(side, 1, result.date);
			values.value = result.values;
			columns.value = result.columns;
		};

		const setValue = (value: any) => {
			if (!isRange.value) active.value = 0;
			points.value = resolvePoints(value, context.value);
			refresh();
		};

		const sync = () => {
			const value = formatPoints(points.value, context.value, props.nullValue);
			emitted = value;
			emit('update:modelValue', value);
			emit('change', value);
			props.allowDispatch && formItem?.change?.(value);
		};

		const handlePickerChange = (value: PickerValue, index: number, row: PickerData) => {
			const side = active.value;
			const next = values.value.slice();
			next.splice(index, 1, value);
			points.value.splice(side, 1, valuesToDate(context.value, next, points.value[side]));
			refresh();

			// 开始值改到结束值之后：结束值跟到开始值
			if (isRange.value && side === 0 && points.value[1] < points.value[0]) {
				points.value.splice(1, 1, resolveColumns(context.value, points.value[0], points.value[0]).date);
			}

			emit('picker-change', value, index, row);
			sync();
		};

		const handleSide = (side: 0 | 1) => {
			if (active.value === side) return;
			active.value = side;
			refresh();
		};

		watch(
			() => props.modelValue,
			(v) => {
				if (emitted !== void 0 && isEqual(v, emitted)) return;
				setValue(v);
			},
			{ immediate: true, deep: true }
		);

		watch(
			() => [
				locale.value,
				props.type,
				props.format,
				props.disabledDate,
				props.timePickerOptions,
				props.steps,
				props.yearRange,
				props.separator
			],
			() => {
				emitted = void 0;
				setValue(props.modelValue);
			},
			{ deep: true }
		);

		const renderRange = () => {
			const item = (side: 0 | 1) => (
				<span
					class={['vcm-date-picker-view__range-item', { 'is-active': active.value === side }]}
					onClick={() => handleSide(side)}
				>
					{ points.value[side] && formatPointText(points.value[side], context.value) }
				</span>
			);
			return (
				<div class="vcm-date-picker-view__range">
					{ item(0) }
					<span class="vcm-date-picker-view__separator">~</span>
					{ item(1) }
				</div>
			);
		};

		return () => {
			return (
				<div class="vcm-date-picker-view">
					{ isRange.value && renderRange() }
					<MPickerView
						modelValue={values.value}
						data={columns.value}
						columns={columns.value.length}
						cascader={false}
						allowDispatch={false}
						{...{
							'onPicker-change': handlePickerChange
						}}
					/>
				</div>
			);
		};
	}
});
