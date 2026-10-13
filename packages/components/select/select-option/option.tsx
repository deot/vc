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
	setup(props, { slots, expose }) {
		const owner = getInstance('select', 'selectId') as any;

		const formatterLabel = computed(() => {
			const v = String(props.label || props.value);
			return v.trim();
		});

		const isChecked = computed(() => {
			const { current } = owner.exposed;
			return current.value.includes(props.value);
		});

		const isLast = computed(() => {
			const { multiple, current } = owner.exposed;
			return !multiple.value ? true : current.value.slice(-1)[0] === props.value;
		});

		const isActive = computed(() => {
			const { searchRegex } = owner.exposed;
			return !!(searchRegex.value.test(formatterLabel.value) || !props.filterable);
		});

		const customOptions = computed(() => {
			return {
				store: {
					last: isLast.value,
					checked: isChecked.value,
					click: handleClick
				},
				row: props.row
			};
		});

		const handleClick = () => {
			// 禁止操作
			if (props.disabled) return;
			// 已选中，弹层关闭
			if (!owner.exposed.multiple.value && isChecked.value) {
				owner.exposed.close();
				return;
			} else if (isChecked.value) {
				owner.exposed.remove(props.value, formatterLabel.value);
				return;
			}
			owner.exposed.add(props.value, formatterLabel.value);
		};

		// 命中关键词的部分高亮；拆成多段时包一层，避免各段成为独立的 flex 子项
		const renderText = () => {
			const text = renderHighlight(formatterLabel.value, owner.exposed.searchRegex.value);
			return typeof text === 'string' ? text : (<span>{ text }</span>);
		};

		expose({
			isActive,
			isChecked,
			formatterLabel,
			props
		});
		return () => {
			if (!isActive.value) return;

			// 同名插槽优先
			const render = slots.default || props.render;
			if (render) return (<Customer render={render} {...customOptions.value} />);

			const renderLabel = slots.label || props.renderLabel;
			return (
				<div
					// @ts-ignore
					disabled={props.disabled ? 'disabled' : void 0}
					class={[{ 'is-select': isChecked.value, 'is-last': isLast.value }, 'vc-select-option']}
					onClick={withModifiers(handleClick, ['stop'])}
				>
					{
						renderLabel
							? (<Customer render={renderLabel} {...customOptions.value} />)
							: renderText()
					}
					{ isChecked.value && (<Icon type="correct" />) }
				</div>
			);
		};
	}
});
