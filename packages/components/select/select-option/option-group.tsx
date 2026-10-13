/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { props as optionGroupProps } from './option-group-props';
import { Customer } from '../../customer';

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
			// 同名插槽优先
			const render = slots.optionGroup || props.render;
			const renderLabel = slots.label || props.renderLabel;
			return (
				<div class="vc-select-option-group">
					{
						render
							? (<Customer render={render} {...customOptions.value} />)
							: (
									<div class="vc-select-option-group__title">
										{
											renderLabel
												? (<Customer render={renderLabel} {...customOptions.value} />)
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
