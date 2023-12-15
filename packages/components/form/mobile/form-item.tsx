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

		const { isStyleless, classes, labelStyle, contentStyle } = it;
		const { label, labelFor } = props;

		return () => {
			if (isStyleless.value) return slots.default?.();
			return (
				<div
					style={{ paddingLeft: `${props.indent}px` }}
					class="vcm-form-item"
				>
					<div
						class={[classes.value, 'vcm-form-item__wrapper']}
					>
						{
							(props.label || slots.label) && (
								<label
									for={labelFor}
									style={[labelStyle.value]}
									class="vcm-form-item__label"
								>
									{ label || slots.label?.() }
								</label>
							)
						}

						<div
							style={[contentStyle.value]}
							class="vcm-form-item__content"
						>
							{ slots.default?.() }
						</div>
					</div>
				</div>
			);
		};
	}
});
