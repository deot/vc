/** @jsxImportSource vue */

import { defineComponent, withDirectives, vShow } from 'vue';
import { props as formItemProps } from './form-item-props';
import { useFormItem } from './use-form-item';
import { TransitionFade } from '../transition';

const COMPONENT_NAME = 'vc-form-item';

export const FormItem = defineComponent({
	name: COMPONENT_NAME,
	props: formItemProps,
	setup(props, { slots, expose }) {
		const it = useFormItem(expose);

		const { isStyleless, isNest, classes, labelStyle, contentStyle, showError, validateMessage } = it;
		const { label, labelFor } = props;

		const errorColorClass = 'vc-form-item__error';
		return () => {
			if (isStyleless.value) return slots;
			return (
				<div class={['vc-form-item', classes.value]}>
					<div 
						style={labelStyle.value} 
						class="vc-form-item__label"
						// @ts-ignore
						for={labelFor}
					>
						<label>
							{ label || slots.label?.() }
						</label>
					</div>
					<div style={contentStyle.value} class="vc-form-item__wrapper">
						<div class="vc-form-item__content">
							{ slots.default?.() }
							{
								slots.error 
									? slots.error({
										show: showError.value,
										nest: isNest.value,
										message: validateMessage.value,
										class: errorColorClass,
									})
									: (
										<TransitionFade>
											{ 
												withDirectives(
													(
														<div class={['vc-form-item__tip', isNest.value ? 'is-nest' : '', errorColorClass]}>
															{ validateMessage.value }
														</div>
													), 
													[[vShow, showError.value]]
												)
											}
										</TransitionFade>
									)
							}
						</div>
					</div>
				</div>
			);
		};
	}
});
