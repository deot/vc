/** @jsxImportSource vue */

import { defineComponent, nextTick, onBeforeUnmount, provide, ref, shallowRef } from 'vue';
import { insetOf, reflow, toRect, waitTransition } from '../utils';
import type { Point, Rect } from '../utils';
import { props as revealProps } from './reveal-props';
import { REVEAL_KEY } from './use-reveal';
import type { RevealSubject } from './use-reveal';

const COMPONENT_NAME = 'vc-reveal';

type Pose = { clip: string; transform: string };

export type RevealExposed = {
	leave: (shift: Point) => Promise<void>;
};

/**
 * 与 PhotoSwipe 一致：打开时画面按封面铺进点中的元素，再放大到自己的位置；关闭时缩回元素现在的位置。
 * 窗口（clip-path）留在不缩放的外层，画面（transform）在内层，两者同一条缓动
 */
export const Reveal = defineComponent({
	name: COMPONENT_NAME,
	props: revealProps,
	emits: ['animate'],
	setup(props, { slots, emit, expose }) {
		const body = shallowRef<HTMLElement>();
		const pose = shallowRef<Pose | null>(null);
		const isAnimating = ref(false);
		let subject: RevealSubject = () => null;
		let isReady = false;
		let motionId = 0;

		const area = (): Rect => subject(props.viewport) || { left: 0, top: 0, width: props.viewport.w, height: props.viewport.h };

		const cover = (rect: Rect): Pose => {
			const box = area();
			const scale = Math.max(rect.width / box.width, rect.height / box.height);
			const x = rect.left + rect.width / 2 - (box.left + box.width / 2) * scale;
			const y = rect.top + rect.height / 2 - (box.top + box.height / 2) * scale;
			return {
				clip: insetOf(rect, props.viewport),
				transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`
			};
		};

		const rest = (shift: Point = { x: 0, y: 0 }): Pose => {
			const box = area();
			return {
				clip: insetOf({ ...box, left: box.left + shift.x, top: box.top + shift.y }, props.viewport),
				transform: `translate3d(${shift.x}px, ${shift.y}px, 0) scale(1)`
			};
		};

		// 起点渲染并回流后再挂过渡、写终点；新的一次或卸载会停掉上一次
		const move = async (from: Pose, to: Pose) => {
			const id = ++motionId;
			isAnimating.value = false;
			pose.value = from;
			await nextTick();
			if (id !== motionId) return false;
			reflow(body.value);
			isAnimating.value = true;
			pose.value = to;
			emit('animate');
			await waitTransition(body.value);
			if (id !== motionId) return false;
			isAnimating.value = false;
			return true;
		};

		const open = async () => {
			const rect = toRect(props.triggerElement);
			if (!rect) return emit('animate');
			if (await move(cover(rect), rest())) pose.value = null;
		};

		const leave = async (shift: Point) => {
			const rect = toRect(props.triggerElement);
			if (!rect) return emit('animate');
			await move(rest(shift), cover(rect));
		};

		provide(REVEAL_KEY, {
			ready: (fn) => {
				if (isReady) return;
				isReady = true;
				fn && (subject = fn);
				if (props.animated) return open();
			}
		});

		onBeforeUnmount(() => {
			motionId++;
		});

		expose({ leave });

		return () => (
			<div class={['vc-reveal', { 'is-animating': isAnimating.value }]} style={pose.value ? { clipPath: pose.value.clip } : void 0}>
				<div ref={body} class="vc-reveal__body" style={pose.value ? { transform: pose.value.transform } : void 0}>
					{slots.default?.()}
				</div>
			</div>
		);
	}
});
