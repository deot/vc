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

		const {
			isStyleless,
			isNested,
			classes,
			labelStyle,
			contentStyle,
			errorStyle,
			labelClass,
			contentClass,
			errorClass,
			showError,
			validateMessage
		} = it;

		const errorColorClass = 'vc-form-item__error';
		return () => {
			if (isStyleless.value) return [
				slots.default?.(),
				slots.error?.({
					show: showError.value,
					nested: isNested.value,
					message: validateMessage.value,
					class: [errorColorClass, ...errorClass.value],
					style: errorStyle.value
				})
			];
			return (
				<div class={['vc-form-item', classes.value]}>
					{
						(props.label || slots.label) && (
							<div
								style={labelStyle.value}
								class={['vc-form-item__label', ...labelClass.value]}
								// @ts-ignore
								for={props.labelFor}
							>
								<label>
									{ props.label || slots.label?.() }
								</label>
							</div>
						)
					}
					<div class="vc-form-item__wrapper">
						<div class={['vc-form-item__content', ...contentClass.value]} style={contentStyle.value}>
							{ slots.default?.() }
							{
								slots.error
									? slots.error({
											show: showError.value,
											nest: isNested.value,
											message: validateMessage.value,
											class: [errorColorClass, ...errorClass.value],
											style: errorStyle.value
										})
									: (
											<TransitionFade>
												<div
													v-show={showError.value}
													class={[
														'vc-form-item__tip',
														isNested.value ? 'is-nested' : '',
														errorColorClass,
														...errorClass.value
													]}
													style={[errorStyle.value]}
												>
													{ validateMessage.value }
												</div>
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
