/** @jsxImportSource vue */

import { defineComponent, computed, inject, withModifiers } from 'vue';
import { Customer } from '../../customer';
import { Icon } from '../../icon';
import { renderHighlight } from '../select-search/highlight';
import { props as optionProps } from './option-props';
import { getOptionText } from '../utils';
import { OPTION_OWNER_KEY } from './owner';
import type { OptionOwner } from './owner';

const COMPONENT_NAME = 'vc-select-option';

export const Option = defineComponent({
	name: COMPONENT_NAME,
	props: optionProps,
	setup(props, { slots }) {
		const owner = inject<OptionOwner>(OPTION_OWNER_KEY)!;

		// computed：选中值变化时，选中状态没变的选项不重渲染；没有选中态的列表（联想组件）恒为 false
		const checkedState = computed(() => !!owner.current?.value.includes(props.value));
		const isChecked = () => checkedState.value;

		// 单选时恒为 true；多选时为最后选中的一项：只在已选中时读取选中值，未选中的选项不随选中值变化而重渲染
		const isLast = (checked: boolean) => {
			const { multiple, current } = owner;
			return !multiple?.value || (checked && current!.value[current!.value.length - 1] === props.value);
		};

		// 选中：Select 单选时已选中则关闭、多选时切换（见 Select 的 pick）；联想组件为填入；禁用时不处理
		const handleClick = () => {
			!props.disabled && owner.pick(props.value, props.row);
		};

		// 自定义渲染函数的参数
		const getCustomOptions = () => {
			const checked = isChecked();
			return {
				store: {
					last: isLast(checked),
					checked,
					click: handleClick
				},
				row: props.row
			};
		};

		// 命中关键词的部分高亮；拆成多段时包一层，避免各段成为独立的 flex 子项
		const renderText = () => {
			const text = renderHighlight(getOptionText(props), props.regex);
			return typeof text === 'string' ? text : (<span>{ text }</span>);
		};

		return () => {
			// 同名插槽优先
			const render = slots.default || props.render;
			if (render) return (<Customer render={render} {...getCustomOptions()} />);

			const renderLabel = slots.label || props.renderLabel;
			const checked = isChecked();
			return (
				<div
					// @ts-ignore
					disabled={props.disabled ? 'disabled' : void 0}
					class={[{ 'is-select': checked, 'is-last': isLast(checked) }, 'vc-select-option']}
					onClick={withModifiers(handleClick, ['stop'])}
				>
					{
						renderLabel
							? (<Customer render={renderLabel} {...getCustomOptions()} />)
							: renderText()
					}
					{ checked && (<Icon type="correct" />) }
				</div>
			);
		};
	}
});
