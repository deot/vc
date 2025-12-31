/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { getInstance } from '@deot/vc-hooks';

const COMPONENT_NAME = 'vc-dropdown-item';

export const DropdownItem = defineComponent({
	name: COMPONENT_NAME,
	emits: ['click'],
	props: {
		value: {
			type: [String, Number],
			value: undefined
		},
		label: {
			type: [String, Number],
			value: undefined
		},
		disabled: {
			type: Boolean,
			default: false
		},
		selected: {
			type: Boolean,
			default: false
		},
		divided: {
			type: Boolean,
			default: false
		},
		closable: {
			type: Boolean,
			default: true
		}
	},
	setup(props, { slots, emit }) {
		const owner = getInstance('dropdown', 'dropdownId')!;

		const currentValue = computed(() => {
			const v = typeof props.value === 'undefined'
				? props.label
				: props.value;

			return v;
		});

		const classes = computed(() => {
			return {
				'is-selected': props.selected,
				'is-divided': props.divided,
				'is-disabled': props.disabled
			};
		});

		const handleClick = (e: any) => {
			if (props.disabled) return;

			emit('click', currentValue.value, e);
			owner.emit('click', currentValue.value, e);

			props.closable && owner.exposed?.close();
		};

		return () => {
			return (
				<li
					class={[classes.value, 'vc-dropdown-item']}
					onClick={handleClick}
				>
					{ slots.default ? slots.default?.() : props.label }
				</li>
			);
		};
	}
});
