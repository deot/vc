import {
	getCurrentInstance,
	computed,
	Transition, 
	TransitionGroup
} from 'vue';
import type { Component } from 'vue';
import type { Props } from './transition-props';

const trim = (str: string) => str.trim().replace(/\s+/g, " ");
export const useTransition = () => {
	const instance = getCurrentInstance()!;
	const attrs = instance.attrs as any;
	const props = instance.props as Props;

	const Wrapper = computed(() => {
		return (props.group ? TransitionGroup : Transition) as Component;
	});

	const classes = computed(() => {
		let modeClass = props.mode !== 'none' ? `-${props.mode}`.split('-').join(' is-') : '';
		return {
			enterActiveClass: trim(`${attrs.enterActiveClass || ''} ${props.prefix} ${modeClass} is-in`),
			leaveActiveClass: trim(`${attrs.leaveActiveClass || ''} ${props.prefix} ${modeClass} is-out`),
			moveClass: props.group ? trim(`${attrs.moveClass || ''} ${props.prefix} ${modeClass} is-move`) : undefined,
		};
	});

	const clearStyles = (el: HTMLElement) => {
		Object.keys(props.styles).forEach(key => {
			const v = props.styles[key];
			v && el.style.removeProperty(
				key.replace(/([A-Z])/g, "-$1").toLowerCase()
			);
		});
		
		el.style.removeProperty("animation-duration");
		el.style.removeProperty("animation-delay");
	};
	
	// 先脱离文档流, 不占用高度;
	const resetAbsolute = (el: HTMLElement) => {
		props.group && (el.style.position = 'absolute');
	};

	const resetOrigin = (el: HTMLElement) => {
		props.origin && (el.style.transformOrigin = props.origin);
	};

	const resetStyles = (el: HTMLElement) => {
		resetOrigin(el);

		Object.keys(props.styles).forEach(key => {
			const v = props.styles[key];
			v && (el.style[key] = v);
		});
	};
	
	// hooks
	const handleBeforeEnter = (el: HTMLElement) => {
		let duration = (props.duration as any).enter || props.duration;
		el.style.animationDuration = `${duration}ms`;

		let delay = (props.delay as any).enter || props.delay;
		el.style.animationDelay = `${delay}ms`;

		resetStyles(el);

		attrs.onBeforeEnter?.(el);
	};

	const createNext = (callback?: () => any) => {
		let hasDone = false;
		return () => {
			!hasDone && callback?.();
			hasDone = true;
		};
	};
	const handleEnter = async (el: HTMLElement, done?: () => any) => {
		let next = createNext(done);
		try {
			await attrs.onEnter?.(el, next);
		} finally {
			next();
		}
	};

	const handleAfterEnter = (el: HTMLElement) => {
		clearStyles(el);

		attrs.onAfterEnter?.(el);
	};

	const handleBeforeLeave = (el: HTMLElement) => {
		let duration = (props.duration as any).leave || props.duration;
		el.style.animationDuration = `${duration}ms`;

		let delay = (props.delay as any).leave || props.delay;
		el.style.animationDelay = `${delay}ms`;

		resetStyles(el);

		attrs.onBeforeLeave?.(el);
	};

	// 如果第二个参数为done, 且接收的话, 由用户管理结束
	const handleLeave = async (el: HTMLElement, done?: () => any) => {
		let next = createNext(done);
		try {
			resetAbsolute(el);
			await attrs.onLeave?.(el, next);
		} finally {
			next();
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
