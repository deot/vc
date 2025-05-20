import {
	getCurrentInstance,
	computed,
	Transition,
	TransitionGroup
} from 'vue';
import type { Component } from 'vue';
import type { Props } from './transition-props';

const trim = (str: string) => str.trim().replace(/\s+/g, ' ');
export const useTransition = () => {
	const instance = getCurrentInstance()!;
	const attrs = instance.attrs as any;
	const props = instance.props as Props;

	const Wrapper = computed(() => {
		return (props.group ? TransitionGroup : Transition) as Component;
	});

	/**
	 * Tips: components/transition/README.md
	 */
	const classes = computed(() => {
		const modeClass = props.mode !== 'none' ? `is-${props.mode.replace(/-/g, ' is-')}` : '';
		return {
			enterActiveClass: trim(`${attrs.enterActiveClass || ''} ${props.prefix} ${modeClass} is-in`),
			leaveActiveClass: trim(`${attrs.leaveActiveClass || ''} ${props.prefix} ${modeClass} is-out`),
			moveClass: props.group ? trim(`${attrs.moveClass || ''} ${props.prefix} ${modeClass} is-move`) : undefined,
		};
	});

	const clearStyles = (el: HTMLElement) => {
		Object.keys(props.style).forEach((key) => {
			const v = props.style[key];
			v && el.style.removeProperty(
				key.replace(/([A-Z])/g, '-$1').toLowerCase()
			);
		});

		el.style.removeProperty('animation-duration');
		el.style.removeProperty('animation-delay');
	};

	/**
	 * 先脱离文档流, 不占用高度;
	 * 配合handleLeave中next(true), group下直接移除，无移除动画
	 * @param el ~
	 */
	const resetAbsolute = (el: HTMLElement) => {
		props.group && (el.style.position = 'absolute');
	};

	const resetOrigin = (el: HTMLElement) => {
		props.origin && (el.style.transformOrigin = props.origin);
	};

	const resetStyles = (el: HTMLElement) => {
		resetOrigin(el);

		Object.keys(props.style).forEach((key) => {
			const v = props.style[key];
			v && (el.style[key] = v);
		});
	};

	// hooks
	const handleBeforeEnter = (el: HTMLElement) => {
		const duration = (props.duration as any).enter || props.duration;
		el.style.animationDuration = `${duration}ms`;

		const delay = (props.delay as any).enter || props.delay;
		el.style.animationDelay = `${delay}ms`;

		resetStyles(el);

		attrs.onBeforeEnter?.(el);
	};

	const createNext = (callback: () => any, duration: number) => {
		let hasDone = false;
		// 是否立即消费回调，外部调用默认立即消费。内部调用next(false), duration后消费
		return (immediate: boolean = true) => {
			if (hasDone) return;
			hasDone = true;
			const done = () => callback?.();

			immediate ? done() : setTimeout(done, duration);
		};
	};
	const handleEnter = async (el: HTMLElement, done: () => any) => {
		const duration = (props.duration as any).enter || props.duration;
		const next = createNext(done, duration);
		try {
			await attrs.onEnter?.(el, next);
		} finally {
			next(false);
		}
	};

	const handleAfterEnter = (el: HTMLElement) => {
		clearStyles(el);

		attrs.onAfterEnter?.(el);
	};

	const handleBeforeLeave = (el: HTMLElement) => {
		const duration = (props.duration as any).leave || props.duration;
		el.style.animationDuration = `${duration}ms`;

		const delay = (props.delay as any).leave || props.delay;
		el.style.animationDelay = `${delay}ms`;

		resetStyles(el);

		attrs.onBeforeLeave?.(el);
	};

	// 如果第二个参数为done, 且接收的话, 由用户管理结束
	const handleLeave = async (el: HTMLElement, done: () => any) => {
		const duration = (props.duration as any).leave || props.duration;
		const next = createNext(done, duration);
		try {
			resetAbsolute(el);
			await attrs.onLeave?.(el, next);
		} finally {
			// 当为组合时，立即清理，这样移除时无动画
			next(props.group ? true : false);
		}
	};
	const handleAfterLeave = (el: HTMLElement) => {
		clearStyles(el);

		attrs.onAfterLeave?.(el);
	};

	return {
		Wrapper,
		resetStyles,
		resetAbsolute,
		classes,
		createNext,
		listeners: {
			onBeforeEnter: handleBeforeEnter,
			onEnter: handleEnter,
			onAfterEnter: handleAfterEnter,
			onBeforeLeave: handleBeforeLeave,
			onLeave: handleLeave,
			onAfterLeave: handleAfterLeave
		}
	};
};
