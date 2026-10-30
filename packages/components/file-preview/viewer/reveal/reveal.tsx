/** @jsxImportSource vue */

import { defineComponent, nextTick, onBeforeUnmount, provide, ref, shallowRef } from 'vue';
import { reveal, toRect } from '../../../transition/transition-reveal/reveal';
import type { RevealMotion } from '../../../transition/transition-reveal/reveal';
import { props as revealProps } from './reveal-props';
import { REVEAL_KEY } from './use-reveal';
import type { RevealSubject } from './use-reveal';

const COMPONENT_NAME = 'vc-reveal';

export type RevealExposed = {
	leave: () => Promise<void> | undefined;
};

/**
 * 打开时画面从 triggerElement 放大到自己的位置，关闭时缩回它现在的位置；量不到时用最近一次量到的位置。
 * 外层是不缩放的窗口，内层是画面，动画见 transition/transition-reveal/reveal
 */
export const Reveal = defineComponent({
	name: COMPONENT_NAME,
	props: revealProps,
	emits: ['animate', 'wait'],
	setup(props, { slots, emit, expose }) {
		const frame = shallowRef<HTMLElement>();
		const body = shallowRef<HTMLElement>();
		let subject: RevealSubject | undefined;
		let motion: RevealMotion | null = null;
		let isReady = false;
		let isStopped = false;
		// 最近一次量到的起点：打开的那一项在调用 open 时（与点击同一刻）先量一次。
		// 起点元素之后被移除、隐藏（如图片解码期间、关闭前）时，打开、缩回都用这里
		let last = props.animated ? toRect(props.triggerElement) : null;
		// 要放大打开的那一项，开始放大前不显示：画面可能在等大图的尺寸，先露出来会是一块没裁切的整图
		const isPending = ref(props.animated);

		// 动画开始的那一拍通知查看器，蒙层和工具栏一起动；缩不回去时也通知
		const play = (isLeave: boolean) => {
			const trigger = toRect(props.triggerElement) || last;
			last = trigger;
			motion?.cancel();
			motion = trigger && frame.value && body.value
				? reveal({ frame: frame.value, body: body.value, trigger, subject: subject?.(props.viewport), isLeave })
				: null;
			isPending.value = false;
			emit('animate');
			return motion;
		};

		// ready 可能在挂载前调用，Portal 也是挂载后才把节点插入文档
		const open = async () => {
			await nextTick();
			if (isStopped) return;
			const current = play(false);
			await current?.finished;
			// 卸载或中途关闭时已经停掉，再 cancel 也无妨
			current?.cancel();
		};

		onBeforeUnmount(() => {
			isStopped = true;
			motion?.cancel();
		});

		provide(REVEAL_KEY, {
			wait: () => {
				props.animated && isPending.value && emit('wait');
			},
			ready: (fn) => {
				if (isReady) return;
				isReady = true;
				subject = fn;
				if (props.animated) return open();
			}
		});

		expose({ leave: () => play(true)?.finished });

		return () => (
			<div ref={frame} class={['vc-reveal', { 'is-pending': isPending.value }]}>
				<div ref={body} class="vc-reveal__body">
					{slots.default?.()}
				</div>
			</div>
		);
	}
});
