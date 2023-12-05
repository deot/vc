import { ref, watch, computed, getCurrentInstance } from 'vue';
import type { Ref } from 'vue';
import type { Props } from './input-number-props';

type Value = Props['modelValue'];

export const useInputNumber = () => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;
	const typingValue: Ref<Value> = ref('');
	const currentValue: Ref<Value> = ref('');
	const isTyping = ref(false);
	
	let rollBackValue: Value;
	let timer: any;

	watch(
		() => props.modelValue,
		(v) => {
			// rollBackValue有值后将不再在此处赋值
			if (!timer && !rollBackValue && !isTyping.value) {
				rollBackValue = v;
			}
			if (props.controllable || v !== currentValue.value) {
				currentValue.value = v;
			}
		},
		{ immediate: true }
	);

	const plusDisabled = computed(() => {
		return props.disabled || (currentValue.value as number) >= props.max;
	});

	const minusDisabled = computed(() => {
		return props.disabled || (currentValue.value as number) <= props.min;
	});

	// 当controllable为true是，由于input-number特殊性是允许输入，但失焦会显示modelValue
	const displayValue = computed(() => {
		return isTyping.value
			? typingValue.value 
			: currentValue.value;
	});

	const sync = (value: string, e: any) => {
		if (value === currentValue.value) return;

		// 非受控组件时
		if (!props.controllable) {
			currentValue.value = value;
		}

		emit('update:modelValue', value, e);
		emit('input', value, e);
		emit('change', value, e);
	};

	const isAfterAllowChanged = async (e: any, value: Value) => {
		let onAfter = instance.attrs.onAfter as any;
		if (!onAfter) return true;
		let allow = false;
		try {
			allow = (await onAfter?.(value)) !== false;
		} catch { /* empty */ }

		if (allow) {
			rollBackValue = value;
		} else {
			// 回滚数值
			sync(rollBackValue as string, e);
		}
		return allow;
	};

	const compareWithBoundary = (value: number | string, tag: string) => {
		let $value = value;
		if (+value > props.max) {
			$value = props.max;

			emit('tip', {
				type: 'max',
				message: `数值不能超过${value}`,
				value,
				tag
			});
		}

		if (+value < props.min) {
			$value = props.min;

			emit('tip', {
				type: 'min',
				message: `数值不能低于${value}`,
				value,
				tag
			});
		}
		return $value;
	};
	const composeValue = (value: string, tag: string): any => {
		// 失焦时，只留一个'-'或为''
		let $value = /^(-|)$/.test(value)
			? '' 
			: compareWithBoundary(value, tag);
		$value = props.required && !$value
			? String(props.min)
			: $value;

		return props.output($value);
	};

	const handleEnter = async (e: KeyboardEvent) => {
		let value = composeValue(typingValue.value as string, 'input');

		let allow = await isAfterAllowChanged(e, value);

		allow && sync(value, e);
		allow && emit('enter', e);
	};

	const handleFocus = (e: FocusEvent) => {
		typingValue.value = currentValue.value;
		emit('focus', e);
	};

	/**
	 * 其他
	 * 1. 无法实时边界值计算, 主要矛盾点考虑加入最小值是100, 无法删除到最小值以下
	 * @param value ~
	 * @param e ~
	 */
	const handleInput = (value: string, e: InputEvent) => {
		isTyping.value = true;

		value = value.trim();
		if (Number.isNaN(+value)) { // `[A-Za-z]` -> ''
			let hasDoubleDot = false;
			let hasDoubleDash = false;
			value = value
				.replace(/[^0-9\.\-]/g, '')
				.replace(/-/g, function (_, index) {
					if (hasDoubleDash || index !== 0) {
						return '';
					} else {
						hasDoubleDash = true;
						return '-';
					}
				})
				.replace(/\./g, () => {
					if (hasDoubleDot) {
						return '';
					} else {
						hasDoubleDot = true;
						return '.';
					}
				});
		} 

		if (value !== '') {
			let regex = props.precision
				? new RegExp(`(.*\\.[\\d]{${props.precision}})[\\d]+`)
				: /(.*)\./;
			value = value
				.replace(regex, '$1')
				.replace(/^[0]{2,}/, '0') // 0002 -> 2,
				.replace(/^\./, `0.`); // '.' -> '0.'
		}

		typingValue.value = value;
		sync(props.output(value), e);
	};

	const handleBlur = async (e: FocusEvent, _targetValue: string, focusValue: any) => {
		isTyping.value = false;
		let value = composeValue(typingValue.value as string, 'input');
		let allow = await isAfterAllowChanged(e, value);

		allow && sync(value, e);
		allow && emit('blur', e, value, focusValue);
	};

	/**
	 * 为防止在有after的时候多次触发input事件，返回state
	 * 没有after时，返回true，有外面自己发射input
	 * 有after时，根据after的返回值，如果是false，则由内部发射input事件，重新赋值value；
	 * 如果是true，也由外部发射
	 * @param e ~
	 * @param value ~
	 */
	const afterDebounce = (e: any, value: Value) => {
		timer && clearTimeout(timer);
		timer = setTimeout(() => {
			isAfterAllowChanged(e, value);
			timer = null;
		}, 500);
	};

	const handleStepper = async (e: any, base: number) => {
		let plus = instance.attrs.onPlus;
		let minus = instance.attrs.onMinus;

		if (base === 1 && typeof plus === 'function') { return plus(); }
		if (base === -1 && typeof minus === 'function') { return minus(); }

		if (base === 1 && plusDisabled.value) {
			emit('tip', {
				type: 'max',
				message: '不能再多了',
				tag: 'button'
			});
			return;
		} else if (base === -1 && minusDisabled.value) {
			emit('tip', {
				type: 'min',
				message: '不能再少了',
				tag: 'button'
			});
			return;
		}

		let value: number = +currentValue.value + (props.step as number) * base;
		let value$ = props.output(compareWithBoundary(isNaN(value) ? '' : value, 'button'));

		let before = instance.attrs.onBefore as any;
		let state = (await before?.(value$) !== false);

		state && sync(value$, {});
		afterDebounce(e, value);
	};

	const listeners = {
		onEnter: handleEnter,
		onFocus: handleFocus,
		onBlur: handleBlur,
		onInput: handleInput,

		// 防止通过attrs挂在到Input组件上触发事件
		onChange: undefined,
		'onUpdate:modelValue': undefined
	};

	return {
		listeners,
		plusDisabled,
		minusDisabled,
		displayValue,
		handleStepper
	};
};