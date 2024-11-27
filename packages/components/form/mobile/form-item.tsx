/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as mFormItemProps } from './form-item-props';
import { useFormItem } from '../use-form-item';

const COMPONENT_NAME = 'vcm-form-item';

export const MFormItem = defineComponent({
	name: COMPONENT_NAME,
	props: mFormItemProps,
	setup(props, { slots, expose }) {
		const it = useFormItem(expose);

		const { isStyleless, classes, labelStyle, contentStyle, isNest, showError, validateMessage } = it;
		const { label, labelFor, showMessage } = props;

		const errorColorClass = 'vcm-form-item__error';
		return () => {
			if (isStyleless.value) return [
				slots.default?.(),
				slots.error?.({
					show: showError.value,
					nest: isNest.value,
					message: validateMessage.value,
					class: errorColorClass
				})
			];
			return (
				<div
					style={{ paddingLeft: `${isNest.value ? 0 : props.indent}px` }}
					class={[classes.value, 'vcm-form-item']}
				>
					<div class="vcm-form-item__wrapper">
						{
							(props.label || slots.label) && (
								<label
									for={labelFor}
									style={labelStyle.value}
									class="vcm-form-item__label"
								>
									{ label || slots.label?.() }
								</label>
							)
						}

						<div
							style={contentStyle.value}
							class="vcm-form-item__content"
						>
							{ slots.default?.() }
							{
								showMessage && showError.value && (
									<div
										class={[{ 'is-nest': isNest.value }, errorColorClass]}
									>
										{
											slots.error
												? slots.error({ message: validateMessage.value })
												: validateMessage.value
										}
									</div>
								)
							}
						</div>
					</div>
				</div>
			);
		};
	}
});
