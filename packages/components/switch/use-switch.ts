import { inject, getCurrentInstance, ref, watch, computed, h } from 'vue';
import type { SetupContext } from 'vue';
import type { Props } from './switch-props';

export const useSwitch = (props: Props, context: SetupContext<['update:modelValue', 'change', 'click']>) => {
	const { emit, expose } = context;
	// 是否传了 onClick：声明在 emits 中的监听不在 attrs 里，只能从 vnode 上读
	const instance = getCurrentInstance()!;
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>('');
	const isLoading = ref(false);

	const checked = computed(() => {
		return currentValue.value === props.checkedValue;
	});

	const classes = computed(() => {
		return {
			'is-disabled': props.disabled,
			'is-loading': isLoading.value,
			'is-checked': checked.value
		};
	});

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const reset = (value: any) => {
		currentValue.value = value === props.checkedValue
			? props.checkedValue
			: props.uncheckedValue;
	};

	/**
	 * v-model 同步, 外部的数据改变时不会触发
	 * @param e ~
	 */
	const sync = (e: any) => {
		emit('update:modelValue', currentValue.value, e, reset);
		emit('change', currentValue.value, e, reset);
		formItem?.change?.(currentValue.value);
	};

	const handleToggle = (e: Event) => {
		e.preventDefault();

		if (props.disabled || isLoading.value) {
			return false;
		}

		const callback = () => {
			const value = currentValue.value === props.checkedValue
				? props.uncheckedValue
				: props.checkedValue;

			reset(value);
			sync(e);
		};

		const { onClick } = instance.vnode.props || {};
		const fn = onClick && onClick(e, reset);

		if (fn && fn.then) {
			isLoading.value = true;
			fn.then((res: any) => {
				callback();
				return res;
			}).finally(() => {
				isLoading.value = false;
			});
		} else if (!fn) {
			callback();
		}
	};

	// 键盘：Space / Enter 与点击同样切换（沿用 click 的拦截与 Promise 加载）；按住不放时不重复切换
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
		handleToggle(e);
	};

	/**
	 * 开、关两段文字叠在同一格里，只显示当前值对应的一段：轨道宽度取较宽的一段，切换时不跳动
	 * @param name 组件类名
	 * @returns 文字节点，未设置的一段不渲染
	 */
	const renderText = (name: string) => {
		const { slots } = context;
		return [
			[props.checkedValue, slots.checked, props.checkedText],
			[props.uncheckedValue, slots.unchecked, props.uncheckedText]
		].map(([value, slot, text]) => (slot || text) && h(
			'span',
			{ class: [`${name}__text`, { 'is-hidden': currentValue.value !== value }] },
			slot ? (slot as () => any)() : text as string
		));
	};

	expose({ reset });
	return {
		currentValue,
		isLoading,
		classes,
		checked,
		handleToggle,
		handleKeydown,
		renderText,
		sync,
		reset
	};
};
