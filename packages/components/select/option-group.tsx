/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { props as optionGroupProps } from './option-group-props';

const COMPONENT_NAME = 'vc-select-option-group';

export const OptionGroup = defineComponent({
	name: COMPONENT_NAME,
	props: optionGroupProps,
	setup(props, { slots }) {
		const formatterLabel = computed(() => {
			const v = String(props.label || props.value);
			return v.trim();
		});
		return () => {
			return (
				<div class="vc-select-option-group">
					<div class="vc-select-option-group__title">
						{ formatterLabel.value }
					</div>
					<div>
						{ slots?.default?.() }
					</div>
				</div>
			);
		};
	}
});
