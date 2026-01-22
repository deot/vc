/** @jsxImportSource vue */

import { defineComponent, computed, withModifiers } from 'vue';
import { getInstance } from '@deot/vc-hooks';
import { Customer } from '../customer';
import { Icon } from '../icon';
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

		const handlePrevent = (e: any) => {
			e.preventDefault();
		};

		expose({
			isActive,
			isChecked,
			formatterLabel,
			props
		});
		return () => {
			if (!isActive.value) return;
			return typeof props.render === 'function'
				? (<Customer render={props.render} {...customOptions.value} />)
				: slots.default
					? slots.default(customOptions.value)
					: (
							<div
								// @ts-ignore
								disabled={props.disabled && 'disabled'}
								class={[{ 'is-select': isChecked.value, 'is-last': isLast.value }, 'vc-select-option']}
								onClick={withModifiers(handleClick, ['stop'])}
								onMousedown={handlePrevent}
							>
								{ formatterLabel.value }
								{ isChecked.value && (<Icon type="correct" />) }
							</div>
						);
		};
	}
});
