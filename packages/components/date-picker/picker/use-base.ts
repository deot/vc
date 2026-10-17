import { getCurrentInstance, ref, shallowRef, watch, computed, inject } from 'vue';
import { isEqual } from 'lodash-es';
import { hasOwn } from '@deot/helper-utils';
import { useAttrs, useKeyboard } from '@deot/vc-hooks';
import type { Props } from './base-props';
import { DEFAULT_FORMATS } from '../constants';
import { TYPE_VALUE_RESOLVER_MAP, isEmpty, isSameDigits, isValidDate, value2Array } from '../helper/utils';

interface Options {
	// 键入的值是否被禁用，与面板上对应的单元格一致
	isDisabled?: (date: Date) => boolean;
}

export const useBase = (options: Options = {}) => {
	const { isDisabled } = options;
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as Props;

	const isHover = ref(false);
	const isActive = ref(false);
	// 焦点在触发器的输入框内
	const isFocus = ref(false);
	// 面板上的值，含未确定的点选、键入的预览
	const currentValue = ref<Array<string | Date>>([]);
	// 已提交的值，关闭后回到它：受控时只随 modelValue 变化（调用方可以不接受某次修改），否则为最后一次提交的值
	const committedValue = shallowRef<Array<string | Date>>([]);
	// 正在输入的文字；为 null 时输入框显示格式化后的值
	const inputText = ref<string | null>(null);
	const focusedDate = ref<Date>(props.startDate || new Date());
	const formItem = inject<any>('vc-form-item', {});
	const its = useAttrs({ merge: false });

	const getFormat = () => props.format || DEFAULT_FORMATS[props.type!];

	const formatDateText = (value: any) => {
		if (props.multiple) {
			const formatterText = TYPE_VALUE_RESOLVER_MAP.multiple.formatterText;
			return formatterText(value, getFormat());
		} else {
			const { formatter, formatterText } = (TYPE_VALUE_RESOLVER_MAP[props.type!] || TYPE_VALUE_RESOLVER_MAP.default);
			const fn = formatterText || formatter;
			return fn(value, getFormat(), props.separator);
		}
	};

	const showClear = computed(() => {
		const value = !props.multiple ? !isEmpty(currentValue.value) : currentValue.value.length > 0;
		const basic = props.clearable && !props.disabled && isHover.value;
		return value && basic;
	});
	const isConfirm = computed(() => {
		return props.confirm || props.type === 'datetime' || props.type === 'datetimerange' || props.multiple;
	});
	// 季度显示的是本地化名称、多选是逗号拼接的列表，无法从文字解析，始终只读
	const isEditable = computed(() => {
		return props.editable && !props.disabled && !props.multiple && !props.type!.includes('quarter');
	});
	const showTime = computed(() => {
		return ['datetime', 'datetimerange'].includes(props.type!);
	});
	const isRange = computed(() => {
		return props.type!.includes('range');
	});
	const isQuarter = computed(() => {
		return ['quarter'].includes(props.type!);
	});
	const isTime = computed(() => {
		return ['time', 'timerange'].includes(props.type!);
	});

	const classes = computed(() => {
		return {
			'is-disabled': props.disabled,
			'is-editable': isEditable.value,
			'vc-time-picker': isTime.value
		};
	});

	// 输入框显示的文字：关闭一开始就显示已提交的值，不等离场动画结束
	const inputValue = computed(() => {
		if (!isActive.value) return formatDateText(committedValue.value);
		return inputText.value ?? formatDateText(currentValue.value);
	});

	// 立即提交：没有确认栏，或选择即提交
	const isImmediate = () => !isConfirm.value || props.changeOnSelect;

	// 受控：传了 modelValue（v-model 或 :model-value）
	const isControlled = () => {
		const vnodeProps = instance.vnode.props || {};
		return hasOwn(vnodeProps, 'modelValue') || hasOwn(vnodeProps, 'model-value');
	};

	const formatDate = (value: Date | Date[]) => {
		if (props.multiple) {
			const formatter = TYPE_VALUE_RESOLVER_MAP.multiple.formatter;
			return formatter(value as Date[], getFormat());
		} else {
			const { formatter } = (TYPE_VALUE_RESOLVER_MAP[props.type!] || TYPE_VALUE_RESOLVER_MAP.default);
			return formatter(value, getFormat(), props.separator);
		}
	};

	const parserDate = (value: any) => {
		if (props.multiple) {
			const parser = TYPE_VALUE_RESOLVER_MAP.multiple.parser;
			return parser(value, getFormat());
		} else {
			const { parser } = (TYPE_VALUE_RESOLVER_MAP[props.type!] || TYPE_VALUE_RESOLVER_MAP.default);
			return parser(value, getFormat(), props.separator);
		}
	};

	const parseValue = (val: any) => {
		if (isEmpty(val)) {
			return [];
		}
		return parserDate(val);
	};

	// 面板的数组格式 -> 对外的值
	const toModelValue = (value: Date[]) => {
		return formatDate(isRange.value || isQuarter.value ? value : value[0]) || props.nullValue;
	};

	// 写入面板上的值；内容没变时不写，面板不必跟着重算
	const setCurrentValue = (value: Array<string | Date>) => {
		!isEqual(value, currentValue.value) && (currentValue.value = value);
	};

	// 面板回到已提交的值
	const restoreValue = () => {
		setCurrentValue([...committedValue.value]);
	};

	const reset = (v: string | string[]) => {
		currentValue.value = value2Array(v);
		committedValue.value = [...currentValue.value];
	};

	const sync = (eventName: string | string[], value: Date[]) => {
		const formatValue = toModelValue(value);
		!isControlled() && (committedValue.value = [...value]);

		emit('update:modelValue', formatValue);
		eventName = typeof eventName === 'string' ? [eventName] : eventName;
		eventName.forEach((name) => {
			emit(name, formatValue, reset);
		});

		formItem?.change?.();

		return formatValue;
	};

	const executePromise = (promiseFn: any, cb: any, param?: any) => {
		try {
			const promise = promiseFn && promiseFn(param);
			if (promise && promise.then()) {
				promise.then(() => {
					cb();
				}).catch(() => {
					return;
				});
			} else {
				cb();
			}
		} catch (error) {
			emit('error', error);
		}
	};

	// 经输入、Enter 打开；点击由 Popover 自身处理并通知
	const open = () => {
		if (isActive.value || props.disabled) return;
		isActive.value = true;
		emit('visible-change', true);
	};

	const close = () => {
		isActive.value = false;
	};

	const handlePick = (value: Date[], prevDate: Date) => {
		// 在面板上点选即结束输入
		inputText.value = null;
		// 在panel上点击时，同步focusedDate
		focusedDate.value = value[0] || prevDate || new Date();

		if ((!isConfirm.value && !isTime.value) || props.changeOnSelect) {
			setTimeout(() => { isActive.value = false; }, 100); // 添加延迟，可以让使用者看到选中效果后再关闭弹层
		}

		setCurrentValue(value);
		isImmediate() && sync('change', value);
	};

	const handleClear = () => {
		const clear = () => {
			isActive.value = false;
			currentValue.value = [];
			emit('clear', sync('change', []));
		};
		executePromise(instance.vnode.props?.onBeforeClear, clear);
	};

	const handleIconClick = (e: any) => {
		if (!showClear.value) return;
		e.stopPropagation();
		handleClear();
	};

	const handleOK = (value: Date[]) => {
		const ok = () => {
			isActive.value = false;
			sync(['change', 'ok'], value);
		};
		executePromise(instance.vnode.props?.onBeforeOk, ok, value);
	};

	// 离场动画结束后，面板回到已提交的值（未确定的点选、放弃的输入）；淡出过程中保持关闭前的样子
	const handleClose = () => {
		restoreValue();
		emit('close');
	};

	/**
	 * 键入的文字 -> 值：按类型的解析规则解析，再按显示的格式输出，两边的数字须逐个相同（没有溢出），且没有被禁用；否则为 null
	 * @param text ~
	 * @returns ~
	 */
	const parseText = (text: string) => {
		const value = value2Array(parserDate(text.trim()));
		if (value.length !== (isRange.value ? 2 : 1) || !value.every(isValidDate)) return null;
		if (!isSameDigits(text, formatDateText(value)) || value.some(date => isDisabled?.(date))) return null;
		// 范围的起止颠倒时调换
		return isRange.value ? [...value].sort((a, b) => a.getTime() - b.getTime()) : value;
	};

	// 合法时面板即时跳到该值（预览），输入框保留原样的文字，直到提交或放弃
	const handleInput = (text: string) => {
		inputText.value = text;
		open();
		const value = parseText(text);
		if (!value || isEqual(value, currentValue.value)) return;
		currentValue.value = value;
		focusedDate.value = value[0];
	};

	// 放弃输入：输入框回到格式化后的值；浮层仍打开时面板一并回到已提交的值，已关闭时由 handleClose 在离场后处理
	const revertInput = () => {
		inputText.value = null;
		isActive.value && restoreValue();
	};

	// 提交输入（立即提交模式）：合法时提交，清空了文字时等同点清除，否则放弃；value 为已解析的值，省略时解析当前的文字
	const submitInput = (value?: Date[] | null) => {
		const text = inputText.value;
		if (text === null) return;
		value === undefined && (value = parseText(text));
		if (!value && !text.trim() && props.clearable && !isEmpty(committedValue.value)) {
			inputText.value = null;
			return handleClear();
		}
		if (!value) return revertInput();
		inputText.value = null;
		setCurrentValue(value);
		!isEqual(toModelValue(value), toModelValue(committedValue.value as Date[])) && sync('change', value);
	};

	const handleEnter = () => {
		const text = inputText.value;
		if (text === null) {
			if (!isActive.value) return open();
			// 确认栏模式等同点“确定”
			return isImmediate() ? close() : handleOK(currentValue.value as Date[]);
		}
		const value = parseText(text);
		// 不合法：保持打开，等继续修改
		if (!value && text.trim()) return;
		if (isImmediate() || !value) {
			submitInput(value);
			return close();
		}
		inputText.value = null;
		handleOK(value);
	};

	/**
	 * 输入框聚焦或浮层打开期间由统一的 Keyboard 分发，返回 true 表示已处理（不再传给其他订阅与页面）
	 * @param e ~
	 * @returns ~
	 */
	const handleKeyboard = (e: KeyboardEvent) => {
		if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey || props.disabled) return false;
		switch (e.key) {
			case 'Enter':
				// 只处理触发器的输入框；长按不重复提交，按键照样消费，避免触发表单的隐式提交
				if (!isFocus.value) return false;
				!e.repeat && handleEnter();
				return true;
			case 'Escape':
				if (!isActive.value) return false;
				close();
				revertInput();
				return true;
			case 'Tab':
				// 关闭时按模式提交或放弃，焦点照常移走
				close();
				return false;
			default:
				return false;
		}
	};

	useKeyboard({ enabled: () => isActive.value || isFocus.value, handler: handleKeyboard });

	// 关闭时结束输入：立即提交模式下提交，否则放弃（与点选后不确定一致）
	watch(isActive, (v) => {
		if (v) return;
		isImmediate() ? submitInput() : revertInput();
	});

	// 已提交的值跟随 modelValue；内容没变（父组件每次渲染都新建数组、提交后写回来的值）时不处理，面板上的预览、未确定的点选不会被打断
	watch(
		() => props.modelValue,
		(v) => {
			const parsed = parseValue(v);
			const value = value2Array(parsed);
			if (isEqual(value, committedValue.value)) return;
			focusedDate.value = parsed?.[0] || props.startDate || new Date();
			committedValue.value = value;
			setCurrentValue([...value]);
		},
		{ immediate: true }
	);

	watch(
		() => props.open,
		(v) => {
			isActive.value = v;
		},
		{ immediate: true }
	);

	// 触发器输入框的监听，引用不变；落在内部的 input 上
	const inputListeners = {
		onInput: handleInput,
		onFocus: () => (isFocus.value = true),
		// 焦点离开选择器（点面板不夺焦，见 base.tsx）：立即提交模式下提交
		onBlur: () => {
			isFocus.value = false;
			isImmediate() && submitInput();
		}
	};

	return {
		its,
		isHover,
		isActive,
		isEditable,
		currentValue,
		focusedDate,
		showClear,
		classes,
		isConfirm,
		showTime,
		inputValue,
		inputListeners,

		handleIconClick,
		handlePick,
		handleClear,
		handleOK,
		handleClose
	};
};
