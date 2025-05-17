import { ref, inject, watch, computed, getCurrentInstance, nextTick } from 'vue';
import type { Ref } from 'vue';
import type { Props } from './input-props';
import { getFitValue, getFitMaxLength } from './utils';

export const useInput = (input: Ref<HTMLInputElement | undefined>) => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;

	const currentValue = ref(props.modelValue);
	const isFocus = ref(false);
	const isClearing = ref(false);
	const isOnComposition = ref(false);
	const formItem: any = inject('vc-form-item', {});

	watch(
		() => props.modelValue,
		(v) => {
			if (props.controllable || v !== currentValue.value) {
				currentValue.value = v;
			}
		}
	);

	watch(
		() => currentValue.value,
		(v) => {
			props.allowDispatch && formItem.change?.(v);
		}
	);

	const classes = computed(() => {
		return {
			'is-focus': isFocus.value,
			'is-disabled': props.disabled
		};
	});

	const currentMaxlength = computed(() => {
		const value = currentValue.value;
		const { maxlength, bytes } = props;
		return Array.isArray(value) || !maxlength || !bytes
			? maxlength
			: getFitMaxLength(value, maxlength);
	});

	const sync = (value: string, e: any, force?: boolean) => {
		if (!force && value === currentValue.value) return;

		// 非受控组件时
		if (!props.controllable) {
			currentValue.value = value;
		}

		emit('update:modelValue', value, e);
		emit('input', value, e);
		emit('change', value, e);
	};

	// Focus时。可以强制刷新输入框内的值
	const forceUpdate = () => {
		instance.proxy?.$forceUpdate?.();
	};

	const handleKeydown = (e: KeyboardEvent) => {
		emit('keydown', e);
	};

	const handleKeypress = (e: KeyboardEvent) => {
		emit('keypress', e);
	};

	const handleKeyup = (e: KeyboardEvent) => {
		// 键盘Enter / 数字键盘13
		if (e.code === 'Enter' || e.keyCode === 13) {
			emit('enter', e);
		}
		emit('keyup', e);
	};

	let focusValue: Props['modelValue'];
	const handleFocus = (e: FocusEvent) => {
		focusValue = currentValue.value;

		isFocus.value = true;

		if (isClearing.value) return;
		if (props.focusEnd) {
			const length = String(currentValue.value).length;
			setTimeout(() => {
				input.value!.setSelectionRange(length, length);
			}, 0);
		}

		emit('focus', e, currentValue.value);
	};

	const handleBlur = (e: FocusEvent) => {
		if (isClearing.value) return;
		isFocus.value = false;

		emit('blur', e, input.value ? input.value.value : currentValue.value, focusValue);
		props.allowDispatch && formItem.blur?.(currentValue.value);
	};

	const handleInput = (e: InputEvent) => {
		if (isOnComposition.value) return;
		let value = input.value!.value;

		/**
		 * 当bytes为true, 初始值就已经超出maxlength的情况
		 * 1.删除操作时，应不受maxlength的影响(deleteContentBackward)，值会发生改变
		 * 2.如maxlength为2, 此时值为`abc`, currentMaxlength为4.
		 * 	- 不允许输入`abc值`，可以允许输入`abcd`
		 * 3.当粘帖时，文本太多，要计算fitValue
		 */
		if (
			typeof props.maxlength !== 'undefined'
			&& props.bytes
			&& e.inputType !== 'deleteContentBackward'
		) {
			const fitValue = getFitValue(value, props.maxlength) as string;
			if (value !== fitValue) {
				value = fitValue;
			}
		}

		sync(value, e, e.inputType === 'insertFromPaste'); // 粘帖事件，允许触发事件
		forceUpdate();
	};

	const handleComposition = (e: InputEvent) => {
		if (e.type === 'compositionstart') {
			isOnComposition.value = true;
		}

		if (e.type === 'compositionend') {
			isOnComposition.value = false;
			handleInput(e);
		}
	};

	const handlePaste = (e: ClipboardEvent) => {
		emit('paste', e, (e.clipboardData as DataTransfer).getData('text'));
	};

	// 聚焦状态使用mousedown先触发clear再执行blur
	const handleClear = () => {
		if (isFocus.value) {
			isClearing.value = true;
		}
		const e = { target: { value: '' } };

		sync('', e);
		emit('clear', e);

		// 非聚焦时清数据，modelValue接收同步后再触发focus(如input-number在focus事件中使用了props.modelValue)
		nextTick(() => {
			input.value!.focus();
			setTimeout(() => {
				isClearing.value = false;
			}, 0);
		});
	};

	// 非响应式
	const listeners = {
		onKeyup: handleKeyup,
		onKeypress: handleKeypress,
		onKeydown: handleKeydown,
		onFocus: handleFocus,
		onBlur: handleBlur,
		onCompositionstart: handleComposition,
		onCompositionupdate: handleComposition,
		onCompositionend: handleComposition,
		onPaste: handlePaste,
		onInput: handleInput,

		// 原生的change禁止触发
		onChange: undefined
	};

	return {
		currentValue,
		currentMaxlength,
		isFocus,
		isClearing,
		isOnComposition,
		classes,
		listeners,
		handleClear
	};
};
