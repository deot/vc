import { provide, inject, ref, computed, watch, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';
import type { SetupContext } from 'vue';
import { cloneDeep } from 'lodash-es';
import { Validator } from '@deot/helper-validator';
import { getPropByPath } from '@deot/helper-utils';
import { VcError } from '../vc';
import type { Props } from './form-item-props';

import type { FormItemProvide, FormProvide, FormRule } from './types';

const filterEmpty = (val: any) => {
	if (val instanceof Array) {
		val = val.filter(i => i !== '');
	}
	return val;
};

const toRules = (rules?: FormRule | FormRule[]) => {
	return rules instanceof Array 
		? rules 
		: rules 
			? [rules]
			: [];
};

export const useFormItem = (expose: SetupContext['expose']) => {
	const form = inject<FormProvide>('form');
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;
	
	if (!form?.props) {
		throw new VcError('form-item', 'form-item需要在form内使用');
	}

	// 嵌套
	const formItem = inject<FormItemProvide>('form-item', {
		blur: () => {},
		change: () => {},
	});

	const validateState = ref('');
	const validateMessage = ref('');

	let validateDisabled = false;
	let initialValue: any;

	const currentRules = computed(() => {
		const formRules = form.props.rules;
		const formItemBindRules = toRules(props.rules);

		let formItemRules = formItemBindRules;
		// 当前无绑定规则，寻找form上的rules
		if (!formItemRules.length && formRules && props.prop) {
			try {
				// 如果是数组的话 xxx.1.xxx -> xxx.xxx
				let key = props.prop.replace(/\.[0-9]+\./g, '.');
				let { v } = getPropByPath(formRules, key);
				formItemRules = toRules(v);
			} catch {
				let rules = formRules[props.prop];
				formItemRules = toRules(rules);
			}
		}

		return formItemRules;
	});

	const isRequired = computed(() => {
		if (!currentRules.value.length) {
			return !!props.required;
		}

		let required = false;
		for (let i = 0; i < currentRules.value.length; i++) {
			let rule = currentRules.value[i];

			required = !!rule.required;

			if (required) break;
		}
		return required;
	});

	const classes = computed(() => {
		return {
			'is-require': isRequired.value,
			'is-error': validateState.value === 'error',
			'is-validating': validateState.value === 'validating',
			'is-inline': form.props.inline,
			[`is-${form.props.labelPosition}`]: true,
		};
	});

	const labelStyle = computed(() => {
		const labelWidth = props.labelWidth === 0 || props.labelWidth ? props.labelWidth : form.props.labelWidth;
		return {
			width: labelWidth && labelWidth > 0 ? `${labelWidth}px` : 'auto',
			textAlign: form.props.labelPosition as any
		};
	});

	const contentStyle = computed(() => {
		const labelWidth = props.labelWidth === 0 || props.labelWidth ? props.labelWidth : form.props.labelWidth;
		return {
			marginLeft: labelWidth && labelWidth > 0 ? `${labelWidth}px` : 'unset'
		};
	});

	const isStyleless = computed(() => {
		return props.styleless || form.props.styleless;
	});

	const fieldValue = computed(() => {
		const model = form.props.model;
		if (!model || !props.prop) { return; }

		let path = props.prop;
		if (path.includes(':')) {
			path = path.replace(/:/, '.');
		}

		return getPropByPath(model, path).v;
	});

	const showError = computed(() => {
		return validateState.value === 'error' && props.showMessage && form.props.showMessage;
	});

	watch(
		() => props.error, 
		(v) => {
			validateMessage.value = v || '';
			validateState.value = v === '' ? '' : 'error';
		}
	);

	const resetField = () => {
		validateState.value = '';
		validateMessage.value = '';

		let model = form.props.model!;
		if (!props.prop) return;

		let k = getPropByPath(model, props.prop).k as string;
		if (!k) return;

		validateDisabled = true;
		form.props.model![k] = Array.isArray(fieldValue.value) 
			? [].concat(initialValue)
			: initialValue;
	};

	const validate = async (trigger: string) => {
		if (!props.prop) return;
		let rules = currentRules.value
			.filter(rule => !rule.trigger || rule.trigger.includes(trigger));

		if (!rules.length) {
			if (!props.required) {
				return;
			} else {
				rules = [{ 
					required: true,
					message: typeof props.required === 'string' ? props.required : undefined
				}];
			}
		}

		validateState.value = 'validating';
		let descriptor = {};

		descriptor[props.prop] = rules;
		let validator = new Validator(descriptor);
		let model = {};
		model[props.prop] = filterEmpty(fieldValue.value);

		try {
			await validator.validate(model, { first: false });
			validateState.value = 'success';
		} catch (errors: any) {
			validateState.value = 'error';
			validateMessage.value = errors[0].message;
			// eslint-disable-next-line no-throw-literal
			throw ({
				prop: props.prop,
				message: validateMessage.value
			});
		}
		validateDisabled = false;
	};

	const handleFieldBlur = () => {
		// 嵌套
		if (!props.prop) {
			formItem.blur();
			return;
		}
		validate('blur');
	};
	const handleFieldChange = () => {
		// 嵌套
		if (!props.prop) {
			formItem.change();
			return;
		}
		if (validateDisabled) {
			validateDisabled = false;
			return;
		}
		validate('change');
	};

	provide<FormItemProvide>('form-item', {
		blur: handleFieldBlur,
		change: handleFieldChange
	});

	onMounted(() => {
		if (props.prop) {
			form.add?.(instance);
			initialValue = cloneDeep(fieldValue.value);
		}
	});

	onBeforeUnmount(() => {
		form.remove?.(instance);
	});

	watch(
		() => props.rules,
		() => {
			props.resetByRulesChanged && resetField();
		}
	);

	expose({
		validate,
		resetField
	});

	return {
		isStyleless,
		validateMessage,
		classes,
		labelStyle,
		contentStyle,
		showError
	};
};