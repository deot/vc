/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, ref, computed, watch, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import { hasOwn } from '@deot/helper-utils';
import { toCurrentValue, toModelValue } from '../../select/utils';
import { Button } from '../../button/index';
import { Checkbox, CheckboxGroup } from '../../checkbox/index';
import { Dropdown } from '../../dropdown/index';
import { Icon } from '../../icon/index';

export type TableFilterOption = {
	label: string | number;
	value: string | number;
	disabled?: boolean;
};

type TableFilterValue = (string | number)[] | string | number;

/**
 * 列的 filter-options，即 TableFilter 的 props（表头以 v-bind 传入）
 */
export type TableFilterOptions = {
	data: TableFilterOption[];
	// 可选数量上限，默认 1（单选）；大于 1 为多选
	max?: number;
	icon?: string;
	portalClass?: string | Record<string, unknown>;
	// 写了这个键即为受控（即使值为 undefined）；形态同 Select：数组，或 'a,b' 字符串 / 单个值
	modelValue?: TableFilterValue;
	separator?: string;
	numerable?: boolean;
	onChange?: (value: TableFilterValue | undefined) => void;
} & {
	// 受控时在这里写回 modelValue
	'onUpdate:modelValue'?: (value: TableFilterValue | undefined) => void;
};

/**
 * 表头筛选：只做交互，选中值经 change / update:modelValue 交给外部，数据过滤由外部完成
 * 	- 多选（max > 1）：勾选后点「确认」生效，「重置」清空；选满 max 个后其余选项置灰；
 * 	- 单选（max = 1）：点选即生效，「全部」清空。
 */
export const TableFilter = defineComponent({
	name: 'vc-table-filter',
	props: {
		// 筛选项
		data: {
			type: Array as PropType<TableFilterOption[]>,
			default: () => ([])
		},
		// 可选数量上限，同 Select：默认 1（单选），大于 1 为多选
		max: {
			type: Number,
			default: 1,
			validator: (v: number) => v >= 1
		},
		icon: String,
		// 弹层的类名
		portalClass: [String, Object],
		// 当前生效的筛选值；形态同 Select（数组，或 'a,b' 字符串 / 单个值）
		modelValue: [Array, String, Number] as PropType<TableFilterValue>,
		// 同 Select：字符串形态的分隔符，以及字符串值对应数字选项时的转换
		separator: {
			type: String,
			default: ','
		},
		numerable: Boolean
	},
	emits: ['update:modelValue', 'change'],
	setup(props, { emit }) {
		const instance = getCurrentInstance()!;
		const isVisible = ref(false);
		const multiple = computed(() => props.max > 1);

		// 受控：传入了 modelValue 这个键（即使值为 undefined，如单选清空后），以外部为准
		const isControlled = () => hasOwn(instance.vnode.props || {}, 'modelValue');

		// 非受控时的生效值：由确认结果维护
		const innerValue = ref<unknown[]>([]);
		// 生效值（统一为数组）：受控时以外部为准，外部未写回（如校验不通过）就不生效
		const appliedValue = computed<unknown[]>(() => {
			return isControlled()
				? toCurrentValue(props.modelValue, { separator: props.separator, numerable: props.numerable })
				: innerValue.value;
		});

		// 输出保持外部的原始形态（同 Select）；没有形态可参照时，多选输出数组、单选输出单值
		const toValue = (v: unknown[]) => {
			return toModelValue([...v] as (string | number)[], {
				modelValue: props.modelValue ?? (multiple.value ? [] : undefined),
				max: props.max,
				separator: props.separator,
				numerable: props.numerable,
				nullValue: undefined
			}) as TableFilterValue | undefined;
		};
		// 弹层内编辑中的值，确认后才生效并 emit
		const currentValue = ref<unknown[]>([]);

		// 图标高亮只反映生效值，未确认的勾选不算
		const isFiltered = computed(() => appliedValue.value.length > 0);

		// 按集合比较：CheckboxGroup 按勾选先后排列，选项相同、顺序不同视为未变化
		const isSameValue = (a: unknown[], b: unknown[]) => {
			return a.length === b.length && a.every(item => b.includes(item));
		};

		// 生效值确实变化时才同步编辑中的值：外部每次渲染传入内容相同的新数组（如模板字面量）时，不打断编辑中的勾选
		watch(
			appliedValue,
			(v, oldV) => {
				if (oldV && isSameValue(v, oldV)) return;
				currentValue.value = [...v];
			},
			{ immediate: true }
		);

		const getHasChanged = () => !isSameValue(currentValue.value, appliedValue.value);

		const handleConfirm = () => {
			if (getHasChanged()) {
				// 受控时等外部写回 modelValue 才生效
				if (!isControlled()) {
					innerValue.value = [...currentValue.value];
				}
				const value = toValue(currentValue.value);
				emit('update:modelValue', value);
				emit('change', value);
			}
			isVisible.value = false;
		};

		let timer: ReturnType<typeof setTimeout> | undefined;
		const handleChange = (v: unknown[]) => {
			currentValue.value = v;
			// 单选：选中即生效，稍作延迟让选中态先展示
			if (!multiple.value) {
				timer && clearTimeout(timer);
				timer = setTimeout(handleConfirm, 100);
			}
		};

		// 打开时以生效值为准，丢弃上次未确认的编辑
		const handleVisibleChange = (v: boolean) => {
			if (v) {
				currentValue.value = [...appliedValue.value];
			}
		};

		const handleReset = () => {
			currentValue.value = [];
			handleConfirm();
		};

		onBeforeUnmount(() => {
			timer && clearTimeout(timer);
		});

		const renderMultiple = () => {
			// 选满 max 个后，未勾选的选项置灰
			const isFull = currentValue.value.length >= props.max;
			return (
				<div>
					<CheckboxGroup
						modelValue={currentValue.value}
						class="vc-table-filter__content"
						// @ts-ignore
						onChange={handleChange}
					>
						{
							props.data.map(item => (
								<Checkbox
									key={item.value}
									value={item.value}
									label={item.label}
									disabled={item.disabled || (isFull && !currentValue.value.includes(item.value))}
									class="vc-table-filter__item"
								/>
							))
						}
					</CheckboxGroup>
					<div class="vc-table-filter__footer">
						<Button onClick={handleReset}>
							重置
						</Button>
						<Button
							type="primary"
							onClick={handleConfirm}
						>
							确认
						</Button>
					</div>
				</div>
			);
		};

		const renderSingle = () => {
			return (
				<div class="vc-table-filter__content">
					<div
						class="vc-table-filter__item"
						onClick={handleReset}
					>
						全部
					</div>
					{
						props.data.map(item => (
							<div
								key={item.value}
								class={[
									{
										'is-active': currentValue.value.includes(item.value),
										'is-disabled': item.disabled
									},
									'vc-table-filter__item'
								]}
								onClick={() => !item.disabled && handleChange([item.value])}
							>
								{ item.label }
							</div>
						))
					}
				</div>
			);
		};

		return () => {
			return (
				<Dropdown
					modelValue={isVisible.value}
					trigger="click"
					placement="bottom"
					portalClass={props.portalClass}
					class="vc-table-filter"
					// @ts-ignore
					onVisibleChange={handleVisibleChange}
					onUpdate:modelValue={(v: boolean) => (isVisible.value = v)}
				>
					{{
						default: () => (
							<Icon
								type={props.icon || 'filter-solid'}
								class={[{ 'is-active': isFiltered.value }, 'vc-table-filter__icon']}
							/>
						),
						content: () => (multiple.value ? renderMultiple() : renderSingle())
					}}
				</Dropdown>
			);
		};
	}
});
