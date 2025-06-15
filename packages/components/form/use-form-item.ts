import { toRaw, provide, inject, ref, reactive, computed, watch, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';
import type { SetupContext, VNode, ComponentInternalInstance } from 'vue';
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
	const { slots } = instance;

	if (!form?.props) {
		throw new VcError('form-item', 'form-item需要在form内使用');
	}

	// 嵌套
	const formItem = inject('vc-form-item', {} as FormItemProvide);

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
				const key = props.prop.replace(/\.[0-9]+\./g, '.');
				const { v } = getPropByPath(formRules, key);
				formItemRules = toRules(v);
			} catch {
				const rules = formRules[props.prop];
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
			const rule = currentRules.value[i];

			required = !!rule.required;

			if (required) break;
		}
		return required;
	});

	const labelPosition = computed(() => {
		return props.labelPosition || form.props.labelPosition;
	});

	const classes = computed(() => {
		return {
			'is-require': isRequired.value && props.asterisk,
			'is-error': validateState.value === 'error',
			'is-validating': validateState.value === 'validating',
			'is-inline': form.props.inline,
			'is-nest': isNest.value,
			[`is-${labelPosition.value}`]: true,
		};
	});

	const isNest = computed(() => {
		return !!formItem.change;
	});

	const isNestLast = ref(false);

	const hasLabel = computed(() => {
		return !!props.label || slots.label;
	});

	const labelStyle = computed(() => {
		const labelWidth = props.labelWidth === 0 || props.labelWidth
			? props.labelWidth
			: isNest.value
				? 0
				: form.props.labelWidth;
		return [
			{
				width: labelPosition.value !== 'top' && labelWidth && labelWidth > 0 ? `${labelWidth}px` : 'auto',
				textAlign: labelPosition.value === 'top' ? 'left' : labelPosition.value
			},
			props.labelStyle
		];
	});

	const contentStyle = computed(() => {
		const labelWidth = props.labelWidth === 0 || props.labelWidth ? props.labelWidth : form.props.labelWidth;
		return [
			{
				marginLeft: !hasLabel.value && isNest.value ? 0 : labelWidth && labelWidth > 0 ? `${labelWidth}px` : 'unset',
				marginBottom: isNest.value && !isNestLast.value ? `20px` : 0
			},
			props.contentStyle
		];
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

	const reset = (v?: any) => {
		validateState.value = '';
		validateMessage.value = '';

		const model = form.props.model!;
		if (!props.prop) return;

		const { o, k } = getPropByPath(model, props.prop);
		if (!k) return;

		validateDisabled = true;
		o[k] = v !== null && v !== undefined
			? v
			: Array.isArray(fieldValue.value)
				? [].concat(initialValue)
				: initialValue;
	};

	const validate = async (trigger: string) => {
		if (!props.prop) return;
		let rules = currentRules.value
			.filter(rule => !rule.trigger || rule.trigger.includes(trigger));

		// 注意如果没有指定规则，含required属性，trigger相当于''
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
		const descriptor = {};

		descriptor[props.prop] = rules;
		const validator = new Validator(descriptor);
		const model = {};
		model[props.prop] = filterEmpty(fieldValue.value);

		try {
			await validator.validate(model, { first: false });
			validateState.value = 'success';
			validateMessage.value = '';
		} catch (errors: any) {
			validateState.value = 'error';
			validateMessage.value = errors[0].message;

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
			formItem.blur?.();
			return;
		}
		validate('blur');
	};
	const handleFieldChange = () => {
		// 嵌套
		if (!props.prop) {
			formItem.change?.();
			return;
		}
		if (validateDisabled) {
			validateDisabled = false;
			return;
		}
		validate('change');
	};

	const getPosition = async () => {
		let el = (instance.vnode as VNode).el!;
		try {
			while (el && !el.getBoundingClientRect) {
				el = el!.nextSibling;
			};

			const rect = el.getBoundingClientRect();
			return {
				top: rect.top,
				left: rect.left
			};
		} catch {
			throw new VcError('form-item', 'form-item位置计算错误');
		}
	};

	// 用于判断是否是当前formItem的最后一个
	const fields = reactive<ComponentInternalInstance[]>([]);
	provide<FormItemProvide>('vc-form-item', {
		fields,
		blur: handleFieldBlur,
		change: handleFieldChange,
		message: validateMessage,
		add: (field) => {
			field && fields.push(field);
		},
		remove: (field) => {
			field && fields.splice(fields.indexOf(field), 1);
		}
	});

	onMounted(() => {
		if (props.prop) {
			form.add?.(instance);
			initialValue = cloneDeep(fieldValue.value);
		}
		formItem.add?.(instance);
	});

	onBeforeUnmount(() => {
		form.remove?.(instance);
		formItem.remove?.(instance);
	});

	watch(
		() => props.rules,
		() => {
			props.resetByRulesChanged && reset();
		}
	);

	watch(
		() => formItem.fields?.length,
		async (v) => {
			if (!isNest.value || !v) return isNestLast.value = false;
			const fields$ = [...toRaw(formItem.fields)];
			const positions = await Promise.all(fields$.map(item => (item.exposed as any).getPosition()));
			const sortFields = fields$.toSorted((a, b) => {
				const aIndex = fields$.findIndex(i => i === a);
				const bIndex = fields$.findIndex(i => i === b);
				const aPosition = positions[aIndex];
				const bPosition = positions[bIndex];
				if (aPosition.top != bPosition.top) return aPosition.top - bPosition.top;
				return aPosition.left - bPosition.left;
			});

			isNestLast.value = sortFields[sortFields.length - 1] === instance;
		}
	);

	expose({
		validate,
		reset,
		getPosition
	});

	return {
		isNest,
		isStyleless,
		isNestLast,
		validateMessage,
		classes,
		labelStyle,
		contentStyle,
		showError,
		labelPosition
	};
};
