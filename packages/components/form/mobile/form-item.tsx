/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { props as mFormItemProps } from './form-item-props';
import { useFormItem } from '../use-form-item';
import { MCustomer } from '../../customer/index.m';
import { isCustomerData } from '../../customer/utils';
import { toRem } from '@deot/vc-shared';

const COMPONENT_NAME = 'vcm-form-item';

export const MFormItem = defineComponent({
	name: COMPONENT_NAME,
	props: mFormItemProps,
	setup(props, context) {
		const { slots } = context;
		const it = useFormItem(props, context, { rem: true });

		const {
			isStyleless,
			classes,
			labelStyle,
			contentStyle,
			errorStyle,
			labelClass,
			contentClass,
			errorClass,
			isNested,
			showError,
			validateMessage,
			isAutoWidth,
			observeLabel
		} = it;

		const errorColorClass = 'vcm-form-item__error';

		// 嵌套项不缩进；未传 indent 时取样式默认值
		const rootStyle = computed(() => {
			if (isNested.value) return { paddingLeft: 0 };
			return props.indent != null ? { paddingLeft: toRem(props.indent) } : undefined;
		});

		// label 插槽优先；文字直接放在 label 内，渲染函数与 { type, value } 交给 Customer
		const renderLabel = () => {
			const label = slots.label || props.label;
			return typeof label === 'function' || isCustomerData(label)
				? (<MCustomer tag="span" render={label} />)
				: label;
		};

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
				<div
					style={rootStyle.value}
					class={[classes.value, 'vcm-form-item']}
				>
					<div class="vcm-form-item__wrapper">
						{
							(props.label || slots.label) && (
								<label
									for={props.labelFor}
									style={labelStyle.value}
									class={['vcm-form-item__label', ...labelClass.value]}
								>
									{
										isAutoWidth.value
											? <span ref={observeLabel} class="vcm-form-item__label-content">{ renderLabel() }</span>
											: renderLabel()
									}
								</label>
							)
						}

						<div
							style={contentStyle.value}
							class={['vcm-form-item__content', ...contentClass.value]}
						>
							{ slots.default?.() }
							{
								props.showMessage && showError.value && (
									<div
										class={[{ 'is-nested': isNested.value }, errorColorClass, ...errorClass.value]}
										style={errorStyle.value}
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
