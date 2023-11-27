import { ref, inject, watch, computed, getCurrentInstance } from 'vue';
import type { Ref } from 'vue'; 
import type { Props } from './input-props'; 
import { isPassByMaxlength, getBytesLength } from './utils';

export const useInput = (input: Ref<HTMLElement | undefined>) => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;

	const currentValue = ref(props.modelValue);
	const currentMaxlength = ref(props.maxlength);
	const isFocus = ref(false);
	const isOnComposition = ref(false);
	const formItem: any = inject('form-item', {});
	/**
	 * 强制必须使用v-model，所以不需要判断一次
	 */
	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
			props.allowDispatch && formItem.change?.(v);
		},
		{ immediate: false }
	);

	const classes = computed(() => {
		return {
			'is-focus': isFocus.value,
			'is-disabled': props.disabled
		};
	});

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
		// 撤销/重做，deleteContentBackward处理当初始化的值超出maxlength时无法删除的问题
		if (
			e.inputType !== 'deleteContentBackward'
			&& (props.bytes && !isPassByMaxlength(value, props.maxlength)) 
		) {
			e.preventDefault();
			return;
		}
		emit('update:modelValue', value, e);
		emit('input', value, e);

		emit('change', e);
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

	// 输入框内容允许输入的长度
	const getMaxLength = (value: number | string) => {
		if (!props.bytes || !props.maxlength) return props.maxlength;
		let extraLength = getBytesLength(value);
		return props.maxlength + extraLength;
	};

	const handlePaste = (e: ClipboardEvent) => {
		// 只有在bytes下,会需要重新计算maxlength
		if (props.bytes) {
			let content = currentValue.value + (e.clipboardData as DataTransfer).getData('text');
			if (!isPassByMaxlength(content, props.maxlength)) { e.preventDefault(); }
			currentMaxlength.value = getMaxLength(content);
		}

		emit('paste', e);
	};

	const handleClear = () => {
		const e = { target: { value: '' } };
		
		emit('update:modelValue', '');
		emit('input', '');

		emit('change', e);
		emit('clear', e);

		input.value?.focus?.();
	};

	watch(
		() => props.modelValue,
		(v) => {
			if (Array.isArray(v)) return;
			currentMaxlength.value = getMaxLength(v);
		},
		{ immediate: true }
	);

	watch(
		() => props.maxlength,
		(v) => {
			if (!v || !props.bytes) {
				currentMaxlength.value = v;
			} else {
				let extraLength = getBytesLength(currentValue.value);
				currentMaxlength.value = v + extraLength;
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