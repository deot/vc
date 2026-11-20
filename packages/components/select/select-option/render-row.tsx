/** @jsxImportSource vue */

import type { Slots } from 'vue';
import type { CustomerRender } from '../../customer/types';
import type { SelectRow, TreeData } from '../utils';
import { Option } from './option';
import { OptionGroup } from './option-group';

interface RowRendererOptions {
	slots: Slots;
	// 搜索词的正则：命中的部分高亮
	getRegex: () => RegExp;
	isDisabled: (item: TreeData) => boolean;
	getRender: () => {
		renderOption?: CustomerRender;
		renderLabel?: CustomerRender;
		renderOptionGroup?: CustomerRender;
	};
}

/**
 * Select 与联想组件共用的列表行：分组标题（OptionGroup）或选项（Option），交给 SelectList 的默认插槽
 * 	- 插槽：option / label / optionGroup，同名插槽优先于 render*
 * @param options ~
 * @returns renderRow
 */
export const createRowRenderer = (options: RowRendererOptions) => {
	const { slots, getRegex, isDisabled, getRender } = options;

	const renderOption = (item: TreeData) => {
		const { renderOption: render, renderLabel } = getRender();
		return (
			<Option
				key={item.value}
				row={item}
				value={item.value}
				label={item.label}
				disabled={isDisabled(item)}
				regex={getRegex()}
				render={render}
				renderLabel={renderLabel}
			>
				{{ default: slots.option, label: slots.label }}
			</Option>
		);
	};

	const renderGroup = (item: TreeData) => {
		return (
			<OptionGroup
				row={item}
				value={item.value}
				label={item.label}
				key={`group:${item.value}`}
				render={getRender().renderOptionGroup}
			>
				{{ optionGroup: slots.optionGroup, label: slots.label }}
			</OptionGroup>
		);
	};

	return ({ row }: { row: SelectRow }) => (row.group ? renderGroup(row.item) : renderOption(row.item));
};
