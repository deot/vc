import { ref, computed, watch, getCurrentInstance } from 'vue';
import type { SetupContext } from 'vue';
import { useKeyboard } from '@deot/vc-hooks';
import { useLocale } from '../locale';
import type { Props } from './drawer-view-props';

export type DrawerEmits = ['close', 'update:modelValue', 'visible-change', 'portal-fulfilled'];
type DrawerProps = Pick<
	Props,
	'modelValue' | 'okText' | 'cancelText' | 'footer' | 'closeWithCancel' | 'escClosable' | 'onOk' | 'onCancel'
>;

/**
 * Drawer / MDrawer 共用：显示状态、确认与取消、关闭（closeWithCancel、Esc）、离场后的事件
 * @param props ~
 * @param context ~
 * @param context.emit ~
 * @param context.expose ~
 * @returns ~
 */
export const useDrawer = (props: DrawerProps, { emit, expose }: SetupContext<DrawerEmits>) => {
	// isUnmounted 与 vnode.props（Portal 打开时 onOk / onCancel 在 vnode 上）只能从实例取
	const instance = getCurrentInstance()!;
	const isActive = ref(false);
	const { t } = useLocale();
	const okText = computed(() => props.okText ?? t('vc.Drawer.okButtonText'));
	const cancelText = computed(() => props.cancelText ?? t('vc.Drawer.cancelButtonText'));
	const hasFooter = computed(() => !!(props.footer && (cancelText.value || okText.value)));

	watch(
		() => props.modelValue,
		(v) => {
			isActive.value = v;
		},
		{ immediate: true }
	);

	// 打开时通知；关闭在离场动画结束后（handleRemove）
	watch(isActive, v => v && emit('visible-change', true));

	// 用户点击确定的回调 兼容portal设计
	const handleOk = (...rest: any[]) => {
		const ok = instance.vnode.props?.onOk || props.onOk || (() => {});
		return ok(...rest);
	};

	// 用户点击取消按钮时为取消 兼容portal设计
	const handleCancel = (...rest: any[]) => {
		const cancel = instance.vnode.props?.onCancel || props.onCancel || (() => {});
		return cancel(...rest);
	};

	/**
	 * 确定、取消按钮：执行回调，返回 Promise 时兑现后关闭；同步返回假值或 true 时关闭，其它真值保持打开
	 * @param e ~
	 * @param hook ~
	 * @returns ~
	 */
	const handleBefore = (e: any, hook: (...args: any[]) => any) => {
		if (!isActive.value) return;

		const fn = hook(e);
		if (fn && fn.then) {
			return fn.then((res: any) => {
				isActive.value = false;
				return res;
			});
		} else if (!fn || fn === true) {
			isActive.value = false;
		}
	};

	/**
	 * 关闭图标、遮罩、Esc、滑动是否允许关闭：closeWithCancel 时先经过 onCancel，规则同 handleBefore；Promise 拒绝时保持打开
	 * @param e ~
	 * @returns ~
	 */
	const shouldClose = (e?: any): boolean | Promise<boolean> => {
		if (!props.closeWithCancel) return true;
		const fn = handleCancel(e);
		return fn && fn.then
			? fn.then(() => true, () => false)
			: (!fn || fn === true);
	};

	const handleClose = (e: any, closable: boolean) => {
		if (!closable || !isActive.value) return;
		const result = shouldClose(e);
		if (result === true) {
			isActive.value = false;
		} else if (result) {
			result.then(v => v && (isActive.value = false));
		}
	};

	// 由统一的 Keyboard 分发：后打开的弹层先处理，处理后不再传给下层
	useKeyboard({
		enabled: () => isActive.value,
		flush: 'post',
		handler: (e: KeyboardEvent) => {
			if (e.isComposing || !(e.code === 'Escape' || e.key === 'Escape') || !props.escClosable) return false;
			handleClose(e, true);
			return true;
		}
	});

	/**
	 * 动画执行后关闭, 关闭事件都会被执行
	 * visible-change 由移除之后触发
	 * 同时portal-fulfilled兼容portal设计
	 */
	const handleRemove = () => {
		!instance.isUnmounted && (
			emit('close'),
			emit('portal-fulfilled'),
			emit('update:modelValue', false),
			emit('visible-change', false)
		);
	};

	expose({
		isActive, // for portal
		toggle(v?: boolean) {
			v = typeof v === 'boolean' ? v : !isActive.value;
			isActive.value = v;
		}
	});

	return {
		isActive,
		okText,
		cancelText,
		hasFooter,
		handleOk,
		handleCancel,
		handleBefore,
		shouldClose,
		handleClose,
		handleRemove
	};
};
