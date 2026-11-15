/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { omit, pick } from 'lodash-es';
import { MListItem } from '../../../list/index.m';
import { useLocale } from '../../../locale';
import { usePickerTrigger } from '../../../picker/mobile/use-picker-portal';
import { toCurrentValue } from '../../../select/utils';
import type { TreeValue } from '../../../select/utils';
import { useTreeSelectValue } from '../../tree-select/use-tree-select-value';
import type { TreeSelectSelectedNode } from '../../tree-select/use-tree-select-value';
import { props as treeSelectProps, coreOmitKeys } from './tree-select-props';
import { props as coreProps } from './tree-select-core-props';
import { MTreeSelectPortal } from './tree-select-core';

const COMPONENT_NAME = 'vcm-tree-select';

// 透传给弹层的属性
const coreKeys = Object.keys(omit(coreProps, coreOmitKeys));

/**
 * 移动端树选择：点击触发区（默认为 MListItem）从底部弹出树（见 MTreeSelectCore）
 * 	- 值的形状、勾选数量与回填方式同桌面端 TreeSelect；显示的文字为已选项的文字（联动时为完整路径）
 * 	- 默认插槽可替换触发区，参数 { label, value }
 */
export const MTreeSelect = defineComponent({
	name: COMPONENT_NAME,
	props: treeSelectProps,
	emits: [
		'update:modelValue',
		'visible-change',
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
			portal: MTreeSelectPortal,
			accept: (value: any) => (currentValue.value = value),
			forward: ['clear']
		});

		const values = computed(() => toCurrentValue(currentValue.value, props));
		// 远程搜索时 data 只是当前关键词的结果：已选值不在其中时沿用上次查到的路径与文字
		// 记录表与弹层共用：弹层里查到的已选值（如搜索结果里勾选的）提交后这里也能用
		const isRemote = () => !!props.loadData && props.searchable;
		const selectedNodes = new Map<TreeValue, TreeSelectSelectedNode>();
		const { labels } = useTreeSelectValue(props, { currentValue: values, isRemote, shared: selectedNodes });

		const formatterValue = computed(() => {
			return (labels.value.length && props.formatter(labels.value, currentValue.value))
				|| (props.extra ?? t('vc.TreeSelect.placeholder'));
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
				modelValue: currentValue.value,
				selectedNodes
			});
		};

		return () => {
			return (
				<div class={['vcm-tree-select', { 'is-disabled': props.disabled }]} onClick={handleClick}>
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
