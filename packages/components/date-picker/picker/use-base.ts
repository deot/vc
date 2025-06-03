import { getCurrentInstance, ref, watch, computed, inject } from 'vue';
import { isEqualWith } from 'lodash-es';
import { useAttrs } from '@deot/vc-hooks';
import { DEFAULT_FORMATS } from '../constants';
import { TYPE_VALUE_RESOLVER_MAP, isEmpty, value2Array } from '../helper/utils';

export const useBase = () => {
	const instance = getCurrentInstance()!;
	const { emit } = instance;
	const props = instance.props as any;

	const isHover = ref(false);
	const isActive = ref(false);
	const currentValue = ref<string | string[]>('');
	const focusedDate = ref(null);
	const formItem = inject<any>('vc-form-item', {});
	const its = useAttrs({ merge: false });
	const formatDateText = (value: any) => {
		const format = DEFAULT_FORMATS[props.type];
		if (props.multiple) {
			const formatterText = TYPE_VALUE_RESOLVER_MAP.multiple.formatterText;
			return formatterText(value, props.format || format);
		} else {
			const { formatter, formatterText } = (TYPE_VALUE_RESOLVER_MAP[props.type] || TYPE_VALUE_RESOLVER_MAP.default);
			const fn = formatterText || formatter;
			return fn(value, props.format || format, props.separator);
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
	// 展示的value
	const visibleValue = computed(() => {
		return formatDateText(currentValue.value);
	});
	const showTime = computed(() => {
		return ['datetime', 'datetimerange'].includes(props.type);
	});
	const isRange = computed(() => {
		return props.type.includes('range');
	});
	const isQuarter = computed(() => {
		return ['quarter'].includes(props.type);
	});
	const isTime = computed(() => {
		return ['time', 'timerange'].includes(props.type);
	});

	const classes = computed(() => {
		return {
			'is-disabled': props.disabled,
			'vc-time-picker': isTime.value
		};
	});

	const formatDate = (value: any) => {
		const format = DEFAULT_FORMATS[props.type];
		if (props.multiple) {
			const formatter = TYPE_VALUE_RESOLVER_MAP.multiple.formatter;
			return formatter(value, props.format || format);
		} else {
			const { formatter } = (TYPE_VALUE_RESOLVER_MAP[props.type] || TYPE_VALUE_RESOLVER_MAP.default);
			return formatter(value, props.format || format, props.separator);
		}
	};

	const parserDate = (value: any) => {
		const format = DEFAULT_FORMATS[props.type];
		if (props.multiple) {
			const parser = TYPE_VALUE_RESOLVER_MAP.multiple.parser;
			return parser(value, props.format || format);
		} else {
			const { parser } = (TYPE_VALUE_RESOLVER_MAP[props.type] || TYPE_VALUE_RESOLVER_MAP.default);
			return parser(value, props.format || format, props.separator);
		}
	};

	const parseValue = (val: any) => {
		if (isEmpty(val)) {
			return isRange.value ? [null, null] : [];
		}
		return parserDate(val);
	};

	const rest = (date: string) => {
		currentValue.value = date;
	};

	const sync = (eventName: string | string[], value: any) => {
		const date = isRange.value || isQuarter.value ? value : value[0];
		const dateString = formatDate(value);

		emit('input', date);
		emit('update:modelValue', dateString);
		eventName = typeof eventName === 'string' ? [eventName] : eventName;
		eventName.forEach((name) => {
			emit(name, dateString, rest);
		});

		formItem?.change?.(date);
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

	const handlePick = (value: any, prevDate: any) => {
		// 在panel上点击时，同步focusedDate
		focusedDate.value = value[0] || prevDate || new Date();

		if ((!isConfirm.value && !isTime.value) || props.changeOnSelect) {
			setTimeout(() => { isActive.value = false; }, 100); // 添加延迟，可以让使用者看到选中效果后再关闭弹层
		}

		currentValue.value = value;
		(!isConfirm.value || props.changeOnSelect) && sync('change', value);
	};

	const handleClear = () => {
		const clear = () => {
			const date = isRange.value ? [] : '';
			isActive.value = false;
			currentValue.value = date;
			sync('change', date);
			emit('clear', date);
		};
		executePromise(instance.vnode.props?.onBeforeClear, clear);
	};

	const handleIconClick = (e) => {
		if (!showClear.value) return;
		e.stopPropagation();
		handleClear();
	};

	const handleOK = (value: any) => {
		const ok = () => {
			isActive.value = false;
			sync(['change', 'ok'], value);
		};
		executePromise(instance.vnode.props?.onBeforeOk, ok, value);
	};

	const handleClose = () => {
		const val = parseValue(props.modelValue);
		// 是否有传value值，如果没传currentValue不回滚
		const isSetValueProp = instance.props.modelValue;
		if (!isEqualWith(currentValue.value, val) && isSetValueProp) {
			currentValue.value = value2Array(val);
		}
		emit('close');
	};

	watch(
		() => props.modelValue,
		(v) => {
			v = parseValue(v);
			focusedDate.value = v[0] || props.startDate || new Date();
			currentValue.value = value2Array(v);
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

	return {
		its,
		isHover,
		isActive,
		currentValue,
		focusedDate,
		showClear,
		classes,
		isConfirm,
		visibleValue,
		showTime,
		isRange,
		isQuarter,
		isTime,

		handleIconClick,
		handlePick,
		handleClear,
		handleOK,
		handleClose
	};
};
