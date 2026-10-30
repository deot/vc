import { defineComponent, h, mergeProps, Transition } from 'vue';
import type { PropType } from 'vue';
import { VcInstance } from '../vc';
import { fade, reveal, toRect } from './reveal';
import type { RevealMotion, RevealRect } from './reveal';
import { timingOf } from './transition-props';
import type { Timing } from './transition-props';

const COMPONENT_NAME = 'vc-transition-reveal';
// 点在按钮、链接里的文字或图标上时，从整个按钮展开
const CLICKABLE = 'button, a, [role="button"]';

/**
 * 子元素从触发元素展开、缩回原处。父元素是裁切的窗口：动画期间写入 clip-path，
 * 应只包含这一个子元素，自身不缩放、不旋转
 */
export const TransitionReveal = defineComponent({
	name: COMPONENT_NAME,
	props: {
		/**
		 * 打开时从它展开，关闭时缩回它当时的位置；不传时取打开那次点击的元素。
		 * 为 null、打开时已移出文档或没有尺寸时淡入淡出；关闭前才消失的（如随下拉菜单收起的菜单项）缩回打开时它所在的位置
		 */
		triggerElement: {
			type: Object as PropType<Element | null>,
			default: undefined
		},
		/**
		 * 画面在播放的这一段里从透明淡入、关闭时淡出到透明；与 offset 一起用时不会以半透明出现或消失
		 */
		opacity: Boolean,
		/**
		 * 画面晚多少毫秒开始淡入、提前多少毫秒淡出完，窗口照常展开、缩回
		 * {enter: 80, leave: 80}
		 */
		delay: {
			type: [Number, Object] as PropType<Timing>,
			default: 0
		},
		/**
		 * 打开时间轴上靠近触发元素的一段裁掉多少毫秒：打开立即从这一刻的姿态开始，关闭停在同一个姿态结束。
		 * 'auto' 按布局算：从窗口刚离开触发元素的姿态开始，触发元素上不留残影
		 * {enter: 80, leave: 80}
		 */
		offset: {
			type: [Number, String, Object] as PropType<Timing | 'auto'>,
			default: 0
		},
		/**
		 * 与画面同一条时间轴淡入淡出的元素，如蒙层
		 */
		companion: {
			type: Object as PropType<Element | null>,
			default: null
		}
	},
	// 当不声明emits的情况下，事件存在于attrs中
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		let clicked: Element | null = null;
		// 打开时量到的触发元素位置：关闭时它已不在文档里（如随下拉菜单收起的菜单项），缩回到这里
		let opened: RevealRect | null = null;
		// 每个元素进行中的开合；v-if 切换时新旧元素各走各的
		const running = new WeakMap<Element, { motion: RevealMotion; done: () => void; isLeave: boolean }>();

		const start = (el: Element, isLeave: boolean) => {
			const target = props.triggerElement === undefined ? clicked : props.triggerElement;
			const trigger = toRect(target) || (isLeave && target ? opened : null);
			isLeave || (opened = trigger);
			const frame = el.parentElement;
			const phase = isLeave ? 'leave' : 'enter';
			const delay = timingOf(props.delay, phase);
			const offset = props.offset === 'auto' ? 'auto' : timingOf(props.offset, phase);
			const { opacity, companion } = props;
			const motion = trigger && frame && reveal({ frame, body: el, trigger, isLeave, opacity, delay, offset, companion });
			return motion || fade(el, isLeave, offset, companion);
		};

		const run = (el: Element, isLeave: boolean, done: () => void) => {
			const current = running.get(el);
			// 开合途中反向：沿原路退回
			if (current) {
				current.done = done;
				current.isLeave = isLeave;
				return current.motion.reverse();
			}
			const next = { motion: start(el, isLeave), done, isLeave };
			running.set(el, next);
			next.motion.finished.then(() => {
				running.delete(el);
				next.done();
				next.motion.cancel();
				// 缩回结束后不再引用触发元素，它被移除后可以回收；下次打开重新取
				next.isLeave && (clicked = null, opened = null);
			});
		};

		const listeners = {
			css: false,
			onBeforeEnter: () => {
				const el = VcInstance.getTriggerElement();
				clicked = el?.closest(CLICKABLE) || el;
			},
			onEnter: (el: Element, done: () => void) => run(el, false, done),
			onLeave: (el: Element, done: () => void) => run(el, true, done)
		};

		return () => h(Transition, mergeProps(attrs, listeners), slots);
	}
});
