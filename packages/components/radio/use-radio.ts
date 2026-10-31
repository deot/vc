import { inject, getCurrentInstance, ref, watch, computed } from 'vue';
import type { CustomerValue } from '../customer/types';
import type { RadioGroupType } from './types';

type Options = {
	// 固定的外观，不随分组的type变化（RadioButton为button）
	variant?: RadioGroupType;
};

export const useRadio = (options: Options = {}) => {
	const { props, emit } = getCurrentInstance()!;
	const group = inject<any>('vc-radio-group', {});
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>(undefined);
	const isFocus = ref(false);

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

	const hasGroup = computed(() => {
		return !!group.props;
	});

	const checked = computed(() => {
		return hasGroup.value
			? group.currentValue.value === computedValue.value
			: currentValue.value === props.trueValue;
	});

	const radioName = computed(() => {
		return hasGroup.value
			? group.props.name
			: props.name;
	});

	// 外观：固定值 > 分组的type > 默认圆点
	const variant = computed<RadioGroupType>(() => {
		return options.variant || group.props?.type || 'default';
	});

	// 按钮、胶囊等分组样式不渲染圆点
	const isPlain = computed(() => {
		return variant.value === 'default';
	});

	const size = computed(() => {
		return props.size || group.props?.size || 'medium';
	});

	const isDisabled = computed(() => {
		return hasGroup.value
			? (group.props.disabled || props.disabled)
			: props.disabled;
	});

	const classes = computed(() => {
		return {
			'is-checked': checked.value,
			'is-disabled': isDisabled.value,
			'is-focus': isFocus.value,
			'is-error': !!formItem?.message?.value,
			[`is-${size.value}`]: true,
			[`is-${variant.value}`]: !isPlain.value
		};
	});

	const styles = computed(() => {
		return {};
	});

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const reset = ($checked: any) => {
		currentValue.value = $checked ? props.trueValue : props.falseValue;
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
		if (props.disabled) {
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

	return {
		currentValue,
		isFocus,
		isDisabled,
		radioName,
		classes,
		styles,
		hasGroup,
		variant,
		isPlain,
		size,
		checked,
		handleChange,
		handleBlur,
		handleFocus,
		sync,
		reset,
		computedValue,
		computedLabel
	};
};
