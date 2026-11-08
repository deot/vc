/** @jsxImportSource vue */

import { inject, ref, watch, computed } from 'vue';
import type { SetupContext } from 'vue';
import type { Props, CheckboxShape } from './checkbox-props';
import type { CustomerValue } from '../customer/types';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';

type Options = {
	name: string;
	// 平台默认形状：选项与分组都未设置时使用
	shape: CheckboxShape;
};

export const useCheckbox = (props: Props, context: SetupContext<['update:modelValue', 'change']>, options: Options) => {
	const { emit, slots } = context;
	const { name } = options;
	const group = inject<any>('vc-checkbox-group', {});
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>(undefined);
	const isFocus = ref(false);

	const hasGroup = computed(() => {
		return !!group.props;
	});

	// 优先找value和label都有值，value用于选择，label用于展示
	const computedValue = computed(() => {
		return typeof props.value === 'undefined' || props.value === ''
			? props.label
			: props.value;
	});

	const computedLabel = computed(() => {
		return (typeof props.label === 'undefined' || props.label === ''
			? props.value
			: props.label) as CustomerValue | undefined;
	});

	const checked = computed(() => {
		return hasGroup.value
			? group.currentValue.value.includes(computedValue.value)
			: currentValue.value === props.checkedValue;
	});

	// 自身 > 分组 > 达到分组上限时未选中的项
	const isDisabled = computed(() => {
		if (props.disabled) return true;
		if (!hasGroup.value) return false;
		return group.props.disabled || (group.isFull.value && !checked.value);
	});

	const shape = computed(() => {
		return props.shape || group.props?.shape || options.shape;
	});

	const classes = computed(() => {
		return {
			'is-indeterminate': props.indeterminate,
			'is-checked': checked.value,
			'is-disabled': isDisabled.value,
			'is-focus': isFocus.value,
			'is-error': !!formItem?.message?.value,
			[`is-${shape.value}`]: true
		};
	});

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const reset = ($checked: any) => {
		currentValue.value = $checked ? props.checkedValue : props.uncheckedValue;
	};

	/**
	 * v-model 同步, 外部的数据改变时不会触发
	 * @param e ~
	 */
	const sync = (e: any) => {
		emit('update:modelValue', currentValue.value, e, reset);
		emit('change', currentValue.value, e, reset);
		formItem?.change?.(currentValue.value);
	};

	const handleChange = (e: any) => {
		if (isDisabled.value) {
			return false;
		}
		const $checked = e.target.checked;

		if (hasGroup.value) {
			group.reset(computedValue.value);
			group.sync(e);
		} else {
			reset($checked);
			sync(e);
		}
	};

	const handleBlur = () => {
		isFocus.value = false;
	};

	const handleFocus = () => {
		isFocus.value = true;
	};

	return () => {
		const label = slots.default || computedLabel.value;
		const hasLabel = hasCustomerValue(label);
		// 选项自身的图标插槽优先，其次是分组的
		const icon = slots.icon || group.slots?.icon;
		return (
			<label class={[classes.value, name]}>
				<span class={[{ 'has-sibling': hasLabel }, `${name}__wrapper`]}>
					{
						icon
							? icon({ checked: checked.value, indeterminate: props.indeterminate, disabled: isDisabled.value })
							: (
									<span class={`${name}__border`}>
										<span class={`${name}__inner`} />
									</span>
								)
					}
					<input
						checked={checked.value}
						name={props.name}
						disabled={isDisabled.value}
						type="checkbox"
						onChange={handleChange}
						onFocus={handleFocus}
						onBlur={handleBlur}
					/>
				</span>
				{ hasLabel && (<Customer tag="span" render={label} />) }
			</label>
		);
	};
};
