/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { omit, pick } from 'lodash-es';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { props as selectProps, coreOmitKeys } from './select-props';
import { props as coreProps } from './select-core-props';
import { MSelectPortal } from './select-core';
import { usePickerTrigger } from '../../picker/mobile/use-picker-portal';
import { flattenData, getLabel, toCurrentValue } from '../utils';
import { useSelectedCache } from '../hooks/use-select';

const COMPONENT_NAME = 'vcm-select';

// 透传给弹层的属性
const coreKeys = Object.keys(omit(coreProps, coreOmitKeys));

export const MSelect = defineComponent({
	name: COMPONENT_NAME,
	props: selectProps,
	emits: [
		'update:modelValue',
		'visible-change',
		'select',
		'clear',
		'ok',
		'cancel',
		'change',
		'close'
	],
	setup(props, context) {
		const { slots } = context;
		const { t } = useLocale();
		const currentValue = ref<any>(props.modelValue);
		const trigger = usePickerTrigger(context, {
			portal: MSelectPortal,
			accept: (value: any) => (currentValue.value = value),
			forward: ['select', 'clear']
		});

		// 铺平的选项（含分组内的），用于查找已选项的文字
		const source = computed(() => flattenData(props.data, { parent: true, cascader: true }));
		// 远程搜索时 data 只是当前关键词的结果：已选项不在其中时沿用上次查到的文字
		// 记录表与弹层共用：弹层里查到的已选项（如搜索结果里选中的）提交后这里也能用
		const isRemote = () => !!props.loadData && props.searchable;
		const selectedLabels = new Map<unknown, string>();
		const getCached = useSelectedCache<string>(isRemote, selectedLabels);
		const labels = computed(() => {
			const values = toCurrentValue(currentValue.value, props);
			const found = getCached(values, v => getLabel(source.value, v) as string);
			return values.map(v => found.get(v) ?? '');
		});

		// 已选项文字经 formatter 的显示内容，空时为 extra（plaintext 时不回退到占位文字）
		const formatterValue = computed(() => {
			return (labels.value.length && props.formatter(labels.value, currentValue.value))
				|| (props.extra ?? (props.plaintext ? '' : t('vc.Select.placeholder')));
		});

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			}
		);

		// 远程搜索时调用方更新的 data 同步给打开的弹层
		watch(
			() => props.data,
			v => trigger.update({ data: v })
		);

		const handleClick = () => {
			if (props.disabled) return;
			trigger.open({
				...pick(props, coreKeys),
				// 选项的 label 插槽在弹层中按 renderLabel 渲染
				renderLabel: slots.label || props.renderLabel,
				modelValue: currentValue.value,
				selectedLabels
			});
		};

		return () => {
			if (props.plaintext) {
				return (<span class="vcm-select-plaintext">{ formatterValue.value }</span>);
			}
			return (
				<div class={['vcm-select', { 'is-disabled': props.disabled }]} onClick={handleClick}>
					{
						slots.default
							? slots.default({
									label: labels.value,
									value: currentValue.value
								})
							: (
									<MListItem
										label={props.label}
										labelWidth={props.labelWidth}
										arrow={props.disabled ? false : props.arrow}
										extra={formatterValue.value}
									/>
								)
					}
				</div>
			);
		};
	}
});
