import { defineComponent, h } from 'vue';
import { props as transitionProps } from './transition-props';
import { useTransition } from './use-transition';

const COMPONENT_NAME = 'vc-transition-collapse';

export const TransitionCollapse = defineComponent({
	name: COMPONENT_NAME,
	props: transitionProps,
	// 当不声明emits的情况下，事件存在于attrs中
	inheritAttrs: false,
	setup(props, { slots, attrs: _attrs }) {
		const attrs = _attrs as any;
		const { Wrapper, resetStyles, resetAbsolute, createNext } = useTransition();
		const getTransitionStyle = (duration) => {
			const style = `
				${duration}ms height ease-in-out, 
				${duration}ms padding-top ease-in-out, 
				${duration}ms padding-bottom ease-in-out
			`;
			return style;
		};

		const handleBeforeEnter = (el: HTMLElement) => {
			const duration = (props.duration as any).enter || props.duration;

			el.style.transition = getTransitionStyle(duration);
			/* istanbul ignore next -- @preserve */
			if (!el.dataset) {
				// @ts-ignore
				el.dataset = {};
			}

			el.dataset.oldPaddingTop = el.style.paddingTop;
			el.dataset.oldPaddingBottom = el.style.paddingBottom;

			el.style.height = '0px';
			el.style.paddingTop = '0px';
			el.style.paddingBottom = '0px';
			resetStyles(el);

			attrs.onBeforeEnter?.(el);
		};

		const handleEnter = async (el: HTMLElement, done: () => any) => {
			const duration = (props.duration as any).enter || props.duration;
			const next = createNext(done, duration);
			try {
				el.dataset.oldOverflow = el.style.overflow;
				/* istanbul ignore next -- @preserve */
				if (el.scrollHeight !== 0) {
					el.style.height = el.scrollHeight + 'px';
					el.style.paddingTop = el.dataset.oldPaddingTop + 'px';
					el.style.paddingBottom = el.dataset.oldPaddingBottom + 'px';
				} else {
					el.style.height = '';
					el.style.paddingTop = el.dataset.oldPaddingTop + 'px';
					el.style.paddingBottom = el.dataset.oldPaddingBottom + 'px';
				}

				el.style.overflow = 'hidden';

				attrs.onEnter?.(el);
			} finally {
				next();
			}
		};

		const handleAfterEnter = (el: HTMLElement) => {
			// for safari: 删除，然后需要重置高度
			el.style.transition = '';
			el.style.height = '';
			el.style.overflow = el.dataset.oldOverflow || '';

			attrs.onAfterEnter?.(el);
		};

		const handleBeforeLeave = (el: HTMLElement) => {
			/* istanbul ignore next -- @preserve */
			if (!el.dataset) {
				// @ts-ignore
				el.dataset = {};
			}
			el.dataset.oldPaddingTop = el.style.paddingTop;
			el.dataset.oldPaddingBottom = el.style.paddingBottom;
			el.dataset.oldOverflow = el.style.overflow;

			el.style.height = el.scrollHeight + 'px';
			el.style.overflow = 'hidden';
			resetStyles(el);

			attrs.onBeforeLeave?.(el);
		};

		const handleLeave = (el: HTMLElement, done: () => any) => {
			const duration = (props.duration as any).leave || props.duration;
			const next = createNext(done, duration);
			try {
				const leaveDuration = (props.duration as any).leave || props.duration;
				/* istanbul ignore next -- @preserve */
				if (el.scrollHeight !== 0) {
					/**
					 * for safari:
					 * 在设置高度之后添加，否则它会突然跳到零高度
					 */
					el.style.transition = getTransitionStyle(leaveDuration);
					el.style.height = '0px';
					el.style.paddingTop = '0px';
					el.style.paddingBottom = '0px';
				}
				/**
				 * for group
				 */
				resetAbsolute(el);

				attrs.onLeave?.(el);
			} finally {
				next();
			}
		};

		const handleAfterLeave = (el: HTMLElement) => {
			el.style.transition = '';
			el.style.height = '';
			el.style.overflow = el.dataset.oldOverflow || '';
			el.style.paddingTop = el.dataset.oldPaddingTop || '';
			el.style.paddingBottom = el.dataset.oldPaddingBottom || '';

			attrs.onAfterLeave?.(el);
		};

		const listeners = {
			onBeforeEnter: handleBeforeEnter,
			onEnter: handleEnter,
			onAfterEnter: handleAfterEnter,
			onBeforeLeave: handleBeforeLeave,
			onLeave: handleLeave,
			onAfterLeave: handleAfterLeave
		};

		return () => {
			return h(
				Wrapper.value,
				{
					...attrs,
					...listeners,
					tag: props.tag,
					moveClass: props.group ? `${attrs.moveClass || ''} vc-transition-collapse is-move` : undefined
				},
				slots
			);
		};
	}
});
