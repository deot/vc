import { ref, inject, watch, computed, getCurrentInstance } from 'vue';
import type { Ref } from 'vue'; 
import type { Props } from './input-props'; 
import { getFitValue, getFitMaxLength } from './utils';

export const useInput = (input: Ref<HTMLElement | undefined>) => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;

	const currentValue = ref(props.modelValue);
	const currentMaxlength = ref(props.maxlength);
	const isFocus = ref(false);
	const isOnComposition = ref(false);
	const formItem: any = inject('form-item', {});

	const classes = computed(() => {
		return {
			'is-focus': isFocus.value,
			'is-disabled': props.disabled
		};
	});

	// Focus时。可以强制刷新输入框内的值
	const forceUpdate = () => {
		instance.proxy?.$forceUpdate?.();
	};

	const handleKeydown = (e: any) => {
		emit('keydown', e);
	};

	const handleKeypress = (e: any) => {
		emit('keypress', e);
	};

	const handleKeyup = (e: any) => {
		// 数字键盘
		if (e.keyCode == 13 || e.keyCode == 108) {
			emit('enter', e);
		}
		emit('keyup', e);
	};

	const handleFocus = (e: any) => {
		isFocus.value = true;
		
		if (props.focusEnd) {
			let length = String(currentValue.value).length;
			/**
			 * hack chrome浏览器的BUG：
			 * setSelectionRange() for input/textarea during onFocus fails 
			 * when mouse clicks
			 */
			setTimeout(() => {
				// @ts-ignore: deprecated
				e.srcElement?.setSelectionRange(length, length);
			}, 0);
		}
		emit('focus', e);
	};

	const handleBlur = (e: InputEvent) => {
		isFocus.value = false;

		emit('blur', e);
		props.allowDispatch && formItem.blur?.(currentValue.value);
	};

	const handleInput = (e: InputEvent) => {
		if (isOnComposition.value) return;
		let value = (e.target as HTMLInputElement).value;
		
		/**
		 * 当bytes为true, 初始值就已经超出maxlength的情况
		 * 1.删除操作时，应不受maxlength的影响(deleteContentBackward)，值会发生改变
		 * 2.如maxlength为2, 此时值为`abc`, currentMaxlength为4. 
		 * 	- 不允许输入`abc值`，可以允许输入`abcd`
		 * 3.当粘帖时，文本太多，要计算fitValue
		 */
		if (typeof props.maxlength !== 'undefined' && props.bytes && e.inputType !== 'deleteContentBackward') {
			let fitValue = getFitValue(value, props.maxlength) as string;
			if (value !== fitValue) {
				value = fitValue;
			}
		}
		
		emit('update:modelValue', value, e);
		emit('input', value, e);

		emit('change', e);
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

	const handleChange = (e: InputEvent) => {
		emit('change', e);
	};

	const handlePaste = (e: ClipboardEvent) => {
		emit('paste', e, (e.clipboardData as DataTransfer).getData('text'));
	};

	const handleClear = () => {
		const e = { target: { value: '' } };
		
		emit('update:modelValue', '');
		emit('input', '');

		emit('change', e);
		emit('clear', e);

		input.value?.focus?.();
	};

	// 强制必须使用v-model，所以不需要判断一次
	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
			props.allowDispatch && formItem.change?.(v);
		},
		{ immediate: false }
	);

	// to computed
	watch(
		[() => currentValue.value, () => props.maxlength, () => props.bytes],
		([value, maxlength]) => {
			if (Array.isArray(value)) return;
			if (!maxlength || !props.bytes) {
				currentMaxlength.value = maxlength;
			} else {
				currentMaxlength.value = getFitMaxLength(value, maxlength);
			}
		},
		{ immediate: true }
	);

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
		onInput: handleInput,
		onChange: handleChange,
		onPaste: handlePaste
	};

	return {
		currentValue,
		currentMaxlength,
		isFocus,
		isOnComposition,
		classes,
		listeners,
		handleClear
	};
};