/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as formItemProps } from './form-item-props';
import { useFormItem } from './use-form-item';
import { TransitionFade } from '../transition';

const COMPONENT_NAME = 'vc-form-item';

export const FormItem = defineComponent({
	name: COMPONENT_NAME,
	props: formItemProps,
	setup(props, { slots, expose }) {
		const it = useFormItem(expose);

		const { isStyleless, classes, labelStyle, contentStyle, showError, validateMessage } = it;
		const { label, labelFor } = props;

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
							<TransitionFade>
								{
									showError && (
										<div class="vc-form-item__tip">
											{ validateMessage.value }
										</div>
									)
								}
							</TransitionFade>
						</div>
					</div>
				</div>
			);
		};
	}
});
