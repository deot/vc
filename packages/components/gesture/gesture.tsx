/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, h } from 'vue';
import { useGesture } from '@deot/vc-hooks';
import type { GestureSwipeEvent } from '@deot/vc-hooks';
import { props as gestureProps } from './gesture-props';

const COMPONENT_NAME = 'vc-gesture';

export const Gesture = defineComponent({
	name: COMPONENT_NAME,
	props: gestureProps,
	emits: [
		'tap',
		'double-tap',
		'long-tap',
		'move-start',
		'move',
		'move-end',
		'swipe',
		'swipe-left',
		'swipe-right',
		'swipe-up',
		'swipe-down',
		'pinch-start',
		'pinch',
		'pinch-end',
		'rotate',
		'wheel'
	],
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance()!;
		// 双击、长按、滚轮会改变 tap 的时机或页面滚动，只在有监听时启用
		const hasListener = (name: string) => !!instance.vnode.props?.[name];
		const forward = (name: string) => (e: any) => emit(name as any, e);

		const gesture = useGesture({
			get threshold() { return props.threshold; },
			get flickThreshold() { return props.flickThreshold; },
			get ignore() { return props.ignore; },
			get prevent() { return props.prevent; },
			tap: forward('tap'),
			doubleTap: hasListener('onDoubleTap') ? forward('double-tap') : void 0,
			longTap: hasListener('onLongTap') ? forward('long-tap') : void 0,
			moveStart: forward('move-start'),
			move: forward('move'),
			moveEnd: forward('move-end'),
			swipe: (e: GestureSwipeEvent) => {
				emit('swipe', e);
				emit(`swipe-${e.direction}` as any, e);
			},
			pinchStart: forward('pinch-start'),
			pinch: forward('pinch'),
			pinchEnd: forward('pinch-end'),
			rotate: forward('rotate'),
			wheel: hasListener('onWheel') ? forward('wheel') : void 0
		});

		expose({ cancel: gesture.cancel });

		return () => h(
			props.tag,
			{
				class: ['vc-gesture', { 'is-prevent': props.prevent }],
				...gesture.listeners
			},
			slots.default?.()
		);
	}
});
