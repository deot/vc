import { useAttrs, nextTick, inject, ref, computed, watch, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';
import type { Ref, SetupContext } from 'vue';
import { Resize } from '@deot/helper-resize';
import { getComputedHeight } from './utils';
import { getFitMaxLength, getFitValue } from '../input/utils';
import { useNativeEmitter } from '../input/use-native-emitter';
import type { Props } from './textarea-props';

export default (textarea: Ref<HTMLTextAreaElement | undefined>, expose?: SetupContext['expose']) => {
	const attrs = useAttrs();
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;
	const { emit } = instance;
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>(null);
	const isOnComposition = ref(false);
	const isFocus = ref(false);
	const calcTextareaStyle = ref({});
	const contentStyle = ref({});

	const currentMaxlength = computed(() => {
		const value = currentValue.value;
		const { maxlength, bytes } = props;
		return Array.isArray(value) || !maxlength || !bytes
			? maxlength
			: getFitMaxLength(value, maxlength);
	});

	const sync = (v: string, e: any, force?: boolean) => {
		if (!force && v === currentValue.value) return;
		// 非受控组件时
		if (!props.controllable) {
			currentValue.value = v;
		}

		emit('update:modelValue', v, e);
		emit('input', v, e);
		emit('change', v, e);

		props.allowDispatch && formItem?.change?.(v);
	};

	const forceUpdate = () => {
		instance.proxy?.$forceUpdate?.();
	};

	const refresh = () => {
		if (!props.autosize) return;

		const { minRows, maxRows } = props.autosize as any;

		nextTick(() => {
			calcTextareaStyle.value = getComputedHeight({
				el: textarea.value,
				minRows,
				maxRows
			});
		});
	};

	const handleKeydown = (e: any) => {
		emit('keydown', e);
	};

	const handleKeypress = (e: any) => {
		emit('keypress', e);
	};

	const handleKeyup = (e: any) => {
		if (e.keyCode == 13) {
			emit('enter', e);
		}
		emit('keyup', e);
	};

	const handleFocus = (e: any) => {
		isFocus.value = true;
		emit('focus', e);
	};

	const handleBlur = (e: any) => {
		isFocus.value = false;

		emit('blur', e);
		props.allowDispatch && formItem?.blur?.(currentValue.value);
	};

	const handleChange = (e: any) => {
		emit('change', e);
	};

	const handleInput = (e: any) => {
		if (isOnComposition.value) return;
		let value = textarea.value!.value;

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

	const handleComposition = (e: any) => {
		if (e.type === 'compositionstart') {
			isOnComposition.value = true;
		}
		if (e.type === 'compositionend') {
			isOnComposition.value = false;
			handleInput(e);
		}
	};

	const handleResize = (e: any) => {
		contentStyle.value = {
			height: `${textarea.value ? textarea.value.offsetHeight : 0}px`
		};

		emit('resize', e);
	};

	const handlePaste = (e: ClipboardEvent) => {
		emit('paste', e, (e.clipboardData as DataTransfer).getData('text'));
	};

	const classes = computed(() => {
		return {
			'is-focus': isFocus.value,
			'is-disabled': props.disabled
		};
	});

	const listeners = computed(() => {
		return {
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
	});
	const binds = computed(() => {
		return {
			id: props.id,
			autocomplete: attrs.autocomplete,
			spellcheck: attrs.spellcheck,
			placeholder: attrs.placeholder,
			readonly: attrs.readonly,
			name: attrs.name,
			autofocus: attrs.autofocus,
			disabled: props.disabled,
			maxlength: props.maxlength,
			rows: props.rows,
			wrap: props.wrap
		};
	});

	watch(
		() => props.modelValue,
		(v) => {
			if (props.controllable || v !== currentValue.value) {
				currentValue.value = v;
				refresh();
			}
		},
		{ immediate: true }
	);

	onMounted(() => {
		Resize.on(textarea.value!, handleResize);
		refresh();
	});

	onBeforeUnmount(() => {
		Resize.off(textarea.value!, handleResize);
	});

	const exposed = useNativeEmitter(textarea);
	expose?.({
		...exposed,
		refresh
	});

	return {
		currentValue,
		isOnComposition,
		isFocus,
		calcTextareaStyle,
		contentStyle,
		classes,
		listeners,
		binds,
		currentMaxlength
	};
};
