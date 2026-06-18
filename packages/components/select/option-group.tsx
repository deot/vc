/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { props as optionGroupProps } from './option-group-props';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-select-option-group';

export const OptionGroup = defineComponent({
	name: COMPONENT_NAME,
	props: optionGroupProps,
	setup(props, { slots }) {
		const formatterLabel = computed(() => {
			const v = String(props.label || props.value);
			return v.trim();
		});

		const customOptions = computed(() => {
			return {
				row: props.row,
				store: {
					group: true
				}
			};
		});

		return () => {
			return (
				<div class="vc-select-option-group">
					{
						typeof props.render === 'function'
							? (<Customer render={props.render} {...customOptions.value} />)
							: slots.optionGroup
								? slots.optionGroup(customOptions.value)
								: (
										<div class="vc-select-option-group__title">
											{
												typeof props.renderLabel === 'function'
													? (<Customer render={props.renderLabel} {...customOptions.value} />)
													: slots.label
														? slots.label(customOptions.value)
														: formatterLabel.value
											}
										</div>
									)
					}
					<div>
						{ slots?.default?.() }
					</div>
				</div>
			);
		};
	}
});
