/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';
import { raf } from '@deot/helper-utils';
import { props as artboardProps } from './artboard-props';

const isTouch = typeof document !== 'undefined' && 'ontouchend' in document;
const COMPONENT_NAME = 'vc-artboard';

export const Artboard = defineComponent({
	name: COMPONENT_NAME,
	props: artboardProps,
	setup(props, { emit, expose }) {
		const canvas = ref<any>(null);
		const context = ref<any>(null);

		const w = ref(0);
		const h = ref(0);
		const top = ref(0);
		const left = ref(0);
		// 鼠标或手指按压标识
		const isPressed = ref(false);

		// 存储每一步快照的点信息
		const historyPoints = ref<any[]>([]);
		// 存储撤销步骤快照的信息
		const undoSnapshots = ref<any[]>([]);
		// 存储当前步骤快照的信息
		const currentSnapshots = ref<any[]>([]);

		const init = () => {
			const $canvas = canvas.value!;
			const $context = $canvas.getContext('2d') || {};

			context.value = $context;

			const rect = $canvas.getBoundingClientRect();
			w.value = props.width || rect.width;
			h.value = props.height || rect.height;
			top.value = rect.top;
			left.value = rect.left;

			// 根据设备像素比优化canvas绘图
			const devicePixelRatio = window.devicePixelRatio;
			if (devicePixelRatio) {
				$canvas.style.width = `${w.value}px`;
				$canvas.style.height = `${h.value}px`;
				$canvas.height = h.value * devicePixelRatio;
				$canvas.width = w.value * devicePixelRatio;
				$context.scale?.(devicePixelRatio, devicePixelRatio);
			} else {
				$canvas.width = w.value;
				$canvas.height = h.value;
			}

			$context.shadowBlur = 1;
			$context.shadowColor = 'black';
			$context.lineWidth = 2;
			$context.strokeStyle = 'black';
			$context.lineCap = 'round';
			$context.lineJoin = 'round';
			Object.assign($context, props.options);
		};

		const getPoint = (e) => {
			const point = {
				x: 0,
				y: 0
			};

			if (isTouch) {
				e = e.touches[0];
			}

			point.x = e.clientX - left.value;
			point.y = e.clientY - top.value;
			historyPoints.value.push(point);

			return point;
		};

		/**
		 * 清空画布
		 */
		const redraw = () => {
			context.value.clearRect(0, 0, w.value, h.value);
		};

		const draw = (step: any) => {
			step.forEach(($point: any, index: number) => {
				if (index === 0) {
					context.value.beginPath();
					context.value.moveTo($point.x, $point.y);
				} else {
					context.value.lineTo($point.x, $point.y);
					context.value.stroke();
				}
			});
		};

		// 步骤发生变化，向外暴露change事件
		const handleChange = () => {
			const current = currentSnapshots.value.length;
			const snapshots = [...currentSnapshots.value, ...undoSnapshots.value];
			const allowRedo = current < snapshots.length;
			const allowUndo = current !== 0;

			emit('change', {
				snapshots,
				current,
				allowRedo,
				allowUndo
			});
		};

		/**
		 * 重置
		 */
		const reset = () => {
			redraw();
			undoSnapshots.value = [];
			currentSnapshots.value = [];
			handleChange();
		};

		const resetOffset = () => {
			const rect = canvas.value.getBoundingClientRect();
			top.value = rect.top;
			left.value = rect.left;
		};

		const handleMove = (e) => {
			raf(() => {
				e.preventDefault();

				if (isPressed.value && canvas.value.contains(e.target)) {
					const point = getPoint(e);
					context.value.lineTo(point.x, point.y);
					context.value.stroke();
				}
			});
		};

		const handleStart = (e) => {
			resetOffset();

			e.preventDefault();
			isPressed.value = true;
			historyPoints.value = [];

			const point = getPoint(e);
			context.value.beginPath();
			context.value.moveTo(point.x, point.y);
			handleMove(e); // 鼠标点击画点
		};

		const handleEnd = () => {
			undoSnapshots.value = [];
			currentSnapshots.value.push(historyPoints.value);
			handleChange();
		};

		const handleDrawEnd = () => {
			if (isPressed.value) {
				isPressed.value = false;
				handleEnd();
			}
		};

		/**
		 * 回退
		 */
		const undo = () => {
			if (!currentSnapshots.value.length) return;
			undoSnapshots.value.unshift(currentSnapshots.value.pop());
			redraw();

			currentSnapshots.value.forEach(draw);
			handleChange();
		};

		/**
		 * 撤销
		 */
		const redo = () => {
			if (!undoSnapshots.value.length) return;

			const step = undoSnapshots.value.shift();
			draw(step);
			currentSnapshots.value.push(step);
			handleChange();
		};

		const operateDOMEvents = (type) => {
			// 直接使用 canvas.value.addEventListener 赋值的fn执行的时候函数指向window
			const fn = type === 'add' ? document.addEventListener.bind(canvas.value) : document.removeEventListener.bind(canvas.value);

			if (isTouch) {
				fn('touchstart', handleStart);
				fn('touchmove', handleMove);
				fn('touchend', handleEnd);
			} else {
				fn('mousedown', handleStart);
				fn('mousemove', handleMove);
				fn('mouseup', handleDrawEnd);
				fn('mouseleave', handleDrawEnd);
			}
		};

		onMounted(() => {
			init();
			operateDOMEvents('add');
		});
		onBeforeUnmount(() => operateDOMEvents('remove'));

		expose({
			canvas,
			context,
			reset,
			undo,
			redo,
			redraw,
			draw
		});
		return () => {
			return (
				<div class="vc-artboard">
					<canvas ref={canvas} />
				</div>
			);
		};
	}
});
