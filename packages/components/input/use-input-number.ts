import { ref, watch, computed, getCurrentInstance } from 'vue';
import type { Ref } from 'vue';
import type { Props } from './input-number-props';

type Value = Props['modelValue'];

export const useInputNumber = () => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;
	const currentValue: Ref<Value> = ref('');
	const isInput = ref(false);
	
	let changedBeforeValue: Value;
	let timer: any;

	watch(
		() => props.modelValue,
		(v) => {
			// changedBeforeValue有值后将不再在此处赋值
			if (!timer && !changedBeforeValue && !isInput.value) {
				changedBeforeValue = v;
			}
		},
		{ immediate: true }
	);

	const plusDisabled = computed(() => {
		return props.disabled || (props.modelValue as number) >= props.max;
	});

	const minusDisabled = computed(() => {
		return props.disabled || (props.modelValue as number) <= props.min;
	});

	const formatterValue = computed(() => {
		return isInput.value ? currentValue.value : props.modelValue;
	});

	const sync = (value: string, e: any) => {
		if (value === props.modelValue) return;

		emit('update:modelValue', value, e);
		emit('input', value, e);
		emit('change', value, e);
	};

	const isAfterAllowChanged = async (e: any, value: Value) => {
		let onAfter = instance.vnode?.props?.onAfter;
		if (!onAfter) return true;
		let allow = false;
		try {
			allow = (await onAfter?.(value)) !== false;
		} catch { /* empty */ }

		if (allow) {
			changedBeforeValue = value;
		} else {
			// 回滚数值
			sync(changedBeforeValue as string, e);
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
		let value = composeValue(currentValue.value as string, 'input');

		let allow = await isAfterAllowChanged(e, value);

		allow && sync(value, e);
		allow && emit('enter', e);
	};

	const handleFocus = (e: FocusEvent) => {
		currentValue.value = props.modelValue;
		emit('focus', e);
	};

	/**
	 * 其他
	 * 1. 无法实时边界值计算, 主要矛盾点考虑加入最小值是100, 无法删除到最小值以下
	 * @param value ~
	 * @param e ~
	 */
	const handleInput = (value: string, e: InputEvent) => {
		isInput.value = true;

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

		currentValue.value = value;
		sync(props.output(value), e);
	};

	const handleBlur = async (e: FocusEvent, _targetValue: string, focusValue: any) => {
		isInput.value = false;
		let value = composeValue(currentValue.value as string, 'input');
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
		let plus = instance.vnode?.props?.['onPlus'];
		let minus = instance.vnode?.props?.['onMinus'];
		let before = instance.vnode?.props?.['onBefore'];
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

		if (base === 1 && plus) { return plus?.(); }
		if (base === -1 && minus) { return minus?.(); }

		let value: number = +props.modelValue + (props.step as number) * base;
		let value$ = props.output(compareWithBoundary(isNaN(value) ? '' : value, 'button'));

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
		formatterValue,
		handleStepper
	};
};