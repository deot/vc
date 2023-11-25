import { ref, watch, computed, getCurrentInstance } from 'vue';
import type { Ref } from 'vue';
import { VcError } from '../vc/index';
import type { Props } from './input-number-props';

type Value = Props['modelValue'];

export const useInputNumber = () => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;
	const currentValue: Ref<Value> = ref('');
	const isInput = ref(false);
	
	let hookValue: Value;
	let timer: any;

	watch(
		() => props.modelValue,
		(v) => {
			// hookValue有值后将不再在此处赋值
			if (!timer && !hookValue && !isInput.value) {
				hookValue = v;
			}
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const plusDisabled = computed(() => {
		return props.disabled || (currentValue.value as number) >= props.max;
	});

	const minusDisabled = computed(() => {
		return props.disabled || (currentValue.value as number) <= props.min;
	});

	const formatterValue = computed(() => {
		return isInput.value
			? currentValue.value
			: props.formatter(currentValue.value, props.precision);
	});

	const afterHook = async (value: Value) => {
		let onAfter = instance.vnode?.props?.onAfter;
		if (!onAfter) return true;
		let state = await onAfter?.(value);
		if (state) {
			hookValue = value;
		} else {
			emit('update:modelValue', hookValue);
			emit('input', hookValue);
		}
		return state;
	};

	const compareWithBoundary = (value: number | string, tag: string) => {
		let $value: number = +value;
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

		// Number('') -> 0 会赋值，除非添加required，否者这里不修改
		return typeof props.output === 'function' 
			? props.output($value) 
			: props.output === 'number' && $value !== ''
				? Number($value)
				: $value;
	};

	const handleKeyup = async (e: KeyboardEvent) => {
		// 数字键盘
		if (e.key === 'Enter') {
			let value = composeValue(currentValue.value as string, 'input');

			try {
				let state = await afterHook(value);
				state && (emit('input', value), emit('update:modelValue', value));
				emit('enter', e);
			} catch (error) {
				throw new VcError('vc-input-number', error);
			}

		}
		emit('keyup', e);
	};

	const handleInput = (value: string) => {
		isInput.value = true;

		value = value.trim();

		if (/[^-]/.test(value) && Number.isNaN(Number(value))) { // `[A-Za-z]` -> ''
			value = currentValue.value as string;
		} else if (/[-]{2,}/.test(value)) { // `--` -> `-`
			value = '-';
		} else if (value !== '') {
			let regex = props.precision
				? new RegExp(`(.*\\.[\\d]{${props.precision}})[\\d]+`)
				: /(.*)\./;

			value = value.replace(regex, '$1');
			// 0002 -> 2, 0.2 -> .2
			value = value === '0' ? '0' : value.replace(/^[0]{1,}/, '');
			// '0.' -> '.' -> '0.'
			value = value.charAt(0) === '.' ? `0${value}` : value;
		}

		// TODO: 实时边界值计算, 矛盾点考虑加入最小值是100, 无法删除到最小值以下
		// if (this.min <= 1 && value !== '') {
		// 	value = this.compareWithBoundary({ value, tag: 'input' });
		// }

		emit('input', value);
		emit('update:modelValue', value);
	};

	const handleBlur = async (e: InputEvent) => {
		isInput.value = false;
		let value = composeValue(currentValue.value as string, 'input');

		try {
			let state = await afterHook(value);

			state && (emit('input', value), emit('update:modelValue', value));
			emit('blur', e, Number((e.target as any).value));
		} catch (error) {
			throw new VcError('vc-input-number', error);
		}
	};

	/**
	 * 为防止在有after的时候多次触发input事件，返回state
	 * 没有after时，返回true，有外面自己发射input
	 * 有after时，根据after的返回值，如果是false，则由内部发射input事件，重新赋值value；
	 * 如果是true，也由外部发射
	 * @param value ~
	 */
	const afterDebounce = (value: Value) => {
		timer && clearTimeout(timer);
		timer = setTimeout(() => {
			afterHook(value);
			timer = null;
		}, 500);
	};

	const handleStepper = async (base: number) => {
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

		let value: number = +currentValue.value + (props.step as number) * base;
		value = compareWithBoundary(value, 'button');

		let state = true;
		try {
			if (before) {
				state = await before?.(value);
			}

			state && (emit('input', value), emit('update:modelValue', value));
			afterDebounce(value);
		} catch (e) {
			throw new VcError('vc-input-number', e);
		}
	};

	const listeners = {
		onKeyup: handleKeyup,
		onBlur: handleBlur,
		onInput: handleInput,
	};

	return {
		currentValue,
		listeners,
		plusDisabled,
		minusDisabled,
		formatterValue,
		handleStepper
	};
};