import {
	getCurrentInstance,
	computed,
	Transition, 
	TransitionGroup
} from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import type { ComponentInternalInstance, Component } from 'vue';
import type { Props } from './transition-props';

export const useTransition = () => {
	const instance = getCurrentInstance() as ComponentInternalInstance;
	const attrs = instance.attrs as any;
	const props = instance.props as Props;

	const its = useAttrs({ standard: false });
	const Wrapper = computed(() => {
		return (props.group ? TransitionGroup : Transition) as Component;
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
		el.style.animationDuration = `${duration}s`;

		let delay = (props.delay as any).enter || props.delay;
		el.style.animationDelay = `${delay}s`;

		resetStyles(el);

		// emit('before-enter', el);
		attrs.onBeforeEnter?.(el);
	};

	const handleEnter = (el: HTMLElement) => {
		// emit('enter', el);
		attrs.onEnter?.(el);
	};

	const handleAfterEnter = (el: HTMLElement) => {
		clearStyles(el);

		// emit('after-enter', el);
		attrs.onAfterEnter?.(el);
	};

	const handleBeforeLeave = (el: HTMLElement) => {
		let duration = (props.duration as any).leave || props.duration;
		el.style.animationDuration = `${duration}s`;

		let delay = (props.delay as any).leave || props.delay;
		el.style.animationDelay = `${delay}s`;

		resetStyles(el);

		// emit('before-leave', el);
		attrs.onBeforeLeave?.(el);
	};

	// 特殊处理: 如果第二个参数为done, 且接收的话, 由用户管理结束
	const handleLeave = (el: HTMLElement) => {
		resetAbsolute(el);
		
		// emit('leave', el);
		attrs.onLeave?.(el);

	};
	const handleAfterLeave = (el: HTMLElement) => {
		clearStyles(el);

		// emit('after-leave', el);
		attrs.onAfterLeave?.(el);
	};

	return {
		Wrapper,
		resetStyles,
		resetAbsolute,
		its,
		listeners: {
			'before-enter': handleBeforeEnter,
			'enter': handleEnter,
			'after-enter': handleAfterEnter,
			'before-leave': handleBeforeLeave,
			'leave': handleLeave,
			'after-leave': handleAfterLeave
		}
	};
};
