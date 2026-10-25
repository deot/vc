/** @jsxImportSource vue */

import { defineComponent, computed, withModifiers } from 'vue';
import { getInstance } from '@deot/vc-hooks';
import { Customer } from '../../customer';
import { Icon } from '../../icon';
import { renderHighlight } from '../select-search/highlight';
import { props as optionProps } from './option-props';

const COMPONENT_NAME = 'vc-select-option';

export const Option = defineComponent({
	name: COMPONENT_NAME,
	props: optionProps,
	setup(props, { slots }) {
		const owner = getInstance('select', 'selectId') as any;

		const isChecked = computed(() => {
			return owner.exposed.current.value.includes(props.value);
		});

		// 单选时恒为 true；多选时为最后选中的一项：只在已选中时读取选中值，未选中的选项不随选中值变化而重渲染
		const isLast = () => {
			const { multiple, current } = owner.exposed;
			return !multiple.value || (isChecked.value && current.value[current.value.length - 1] === props.value);
		};

		// 单选时已选中则关闭，多选时切换，见 Select 的 pick；禁用时不处理
		const handleClick = () => {
			!props.disabled && owner.exposed.pick(props.value);
		};

		// 自定义渲染函数的参数
		const getCustomOptions = () => {
			return {
				store: {
					last: isLast(),
					checked: isChecked.value,
					click: handleClick
				},
				row: props.row
			};
		};

		// 命中关键词的部分高亮；拆成多段时包一层，避免各段成为独立的 flex 子项
		const renderText = () => {
			const text = renderHighlight(String(props.label || props.value).trim(), props.regex);
			return typeof text === 'string' ? text : (<span>{ text }</span>);
		};

		return () => {
			// 同名插槽优先
			const render = slots.default || props.render;
			if (render) return (<Customer render={render} {...getCustomOptions()} />);

			const renderLabel = slots.label || props.renderLabel;
			return (
				<div
					// @ts-ignore
					disabled={props.disabled ? 'disabled' : void 0}
					class={[{ 'is-select': isChecked.value, 'is-last': isLast() }, 'vc-select-option']}
					onClick={withModifiers(handleClick, ['stop'])}
				>
					{
						renderLabel
							? (<Customer render={renderLabel} {...getCustomOptions()} />)
							: renderText()
					}
					{ isChecked.value && (<Icon type="correct" />) }
				</div>
			);
		};
	}
});
