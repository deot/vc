import { camelize, capitalize, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { Portal } from '../../portal';

/**
 * 经 Portal 打开的弹层（MPicker、MDatePicker、MCascader、MSelect 的 Core）共用的属性
 * 	- visible：是否显示，打开时为 true
 * 	- onOk / onCancel：传入时代替 ok / cancel 事件（直接调用 open 时使用）
 */
export const pickerCoreProps = {
	visible: {
		type: Boolean,
		default: true
	},
	onOk: Function as PropType<(...args: any[]) => void>,
	onCancel: Function as PropType<() => void>
};

export const pickerCoreEmits = [
	'update:modelValue',
	'update:visible',
	'change',
	'cancel',
	'ok',
	'close',
	'portal-fulfilled',
	'visible-change'
] as const;

// 只用到 emit：各组件的 emits 不同，不按 SetupContext 的事件类型约束
interface EmitContext {
	emit: (event: any, ...args: any[]) => void;
}

interface PickerCoreProps {
	visible: boolean;
	onOk?: (...args: any[]) => void;
	onCancel?: () => void;
}

/**
 * 弹层 Core 的显示状态与提交：
 * 	- ok：关闭并提交（ok，随后 update:modelValue、change）
 * 	- commit：只提交，弹层保持打开（不需要确认时，如滚轮停下）
 * 	- cancel / close：关闭，不提交
 * @param props ~
 * @param context ~
 * @returns ~
 */
export const usePickerCore = (props: PickerCoreProps, context: EmitContext) => {
	const { emit } = context;
	const isActive = ref(false);

	watch(
		() => props.visible,
		(v) => {
			isActive.value = v;
		}
	);

	watch(isActive, (v) => {
		emit('visible-change', v);
		emit('update:visible', v);
	});

	onMounted(() => {
		isActive.value = props.visible !== false;
	});

	const commit = (...args: any[]) => {
		emit('update:modelValue', ...args);
		emit('change', ...args);
	};

	const ok = (...args: any[]) => {
		isActive.value = false;
		props.onOk ? props.onOk(...args) : emit('ok', ...args);
		commit(...args);
	};

	const cancel = () => {
		isActive.value = false;
		props.onCancel ? props.onCancel() : emit('cancel');
	};

	// 关闭动画结束（MPickerPopup 的 close）
	const close = () => {
		isActive.value = false;
		emit('close');
		emit('portal-fulfilled');
	};

	// 传给 MPickerPopup 的显示状态与事件（ok 由各 Core 处理：提交前要先算出值）
	const getPopupProps = () => ({
		'modelValue': isActive.value,
		'onCancel': cancel,
		'onClose': close,
		'onUpdate:modelValue': (v: boolean) => (isActive.value = v)
	});

	return {
		isActive,
		ok,
		commit,
		cancel,
		close,
		getPopupProps
	};
};

interface PickerTriggerOptions {
	// 弹层的 Portal
	portal: Portal<any>;
	// 弹层提交的值写回触发区，返回发出的 v-model（默认原样）
	accept: (value: any) => any;
	// 原样转发的弹层事件，如 picker-change、select、clear
	forward?: string[];
}

/**
 * 触发区（MPicker、MDatePicker、MCascader、MSelect）打开弹层并同步提交的值
 * 	- 弹层的 change（确定时、或不需要确认时每次停下）：写回触发区并发出 update:modelValue、change，通知表单
 * 	- 弹层的 ok：发出 ok（先于 change）
 * 	- 卸载时销毁打开的弹层
 * @param context ~
 * @param options ~
 * @returns ~
 */
export const usePickerTrigger = (context: EmitContext, options: PickerTriggerOptions) => {
	const { emit } = context;
	const formItem = inject<any>('vc-form-item', {});
	const forward = (options.forward || []).reduce((pre, name) => {
		pre[`on${capitalize(camelize(name))}`] = (...args: any[]) => emit(name, ...args);
		return pre;
	}, {} as Record<string, (...args: any[]) => void>);
	// 打开的弹层（Portal 实例）
	let leaf: any;

	onBeforeUnmount(() => {
		leaf?.destroy?.();
	});

	/**
	 * 打开弹层
	 * @param props 弹层的属性（含 modelValue）
	 * @returns ~
	 */
	const open = (props: Record<string, any>) => {
		leaf = options.portal.popup({
			...props,
			...forward,
			onVisibleChange: (v: boolean) => emit('visible-change', v),
			onClose: () => emit('close'),
			onCancel: () => emit('cancel'),
			onOk: (value: any, ...rest: any[]) => emit('ok', options.accept(value), ...rest),
			onChange: (value: any, ...rest: any[]) => {
				const next = options.accept(value);
				emit('update:modelValue', next, ...rest);
				emit('change', next, ...rest);
				formItem?.change?.(next);
			}
		});
		return leaf;
	};

	return { open };
};

/**
 * 直接打开弹层的 open(options)：兼容 value 作为初始值，同时传入时以 modelValue 为准
 * @param portal ~
 * @returns ~
 */
export const createPickerOpen = (portal: Portal<any>) => {
	return (options: Record<string, any> = {}) => {
		const { value, modelValue, ...rest } = options;
		const hasModelValue = Object.prototype.hasOwnProperty.call(options, 'modelValue');
		return portal.popup({
			...rest,
			modelValue: hasModelValue ? modelValue : value
		});
	};
};
