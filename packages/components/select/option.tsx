/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { getInstance } from '@deot/vc-hooks';
import { Icon } from '../icon';
import { props as optionProps } from './option-props';

const COMPONENT_NAME = 'vc-select-option';

export const Option = defineComponent({
	name: COMPONENT_NAME,
	props: optionProps,
	setup(props, { slots }) {
		const owner = getInstance('select', 'selectId') as any;

		const formatterLabel = computed(() => {
			const v = String(props.label || props.value);
			return v.trim();
		});

		const isSelect = computed(() => {
			const { modelValue } = owner.props;
			const { multiple } = owner.exposed;
			if (typeof modelValue === 'undefined' || modelValue === '') return;
			return !multiple.value
				? modelValue == props.value
				: modelValue.includes(props.value);
		});

		const isLast = computed(() => {
			const { modelValue } = owner.props;
			const { multiple } = owner.proxy;
			return !multiple ? true : modelValue.slice(-1)[0] === props.value;
		});

		const isActive = computed(() => {
			const regex = owner.exposed.searchRegex.value;
			return regex.test(formatterLabel.value) || !props.filterable;
		});

		const handleSelect = (e: any) => {
			e.stopPropagation();
			// 禁止操作
			if (props.disabled) return;
			// 已选中，弹层关闭
			if (!owner.exposed.multiple.value && isSelect.value) {
				owner.exposed.close();
				return;
			} else if (isSelect.value) {
				owner.exposed.remove(props.value, formatterLabel.value);
				return;
			}
			owner.exposed.add(props.value, formatterLabel.value);
		};

		const handlePrevent = (e: any) => {
			e.preventDefault();
		};
		return () => {
			if (!isActive.value) return;
			return (
				<div
					// @ts-ignore
					disabled={props.disabled && 'disabled'}
					class={[{ 'is-select': isSelect.value, 'is-last': isLast.value }, 'vc-select-option']}
					onClick={handleSelect}
					onMousedown={handlePrevent}
				>
					{
						slots.default ? slots.default() : formatterLabel.value
					}
					{ isSelect.value && (<Icon type="correct" />) }
				</div>
			);
		};
	}
});
