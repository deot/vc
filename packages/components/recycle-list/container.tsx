/** @jsxImportSource vue */

import { ref, computed, defineComponent, getCurrentInstance, onBeforeUnmount } from 'vue';
import * as $ from '@deot/helper-dom';
import { props as containerProps } from './container-props';
import { DEFAULT, PENDING, PULL, REFRESH } from './container-constant';
import { Customer } from '../customer';
import { useDirectionKeys } from './hooks/use-direction-keys';

const COMPONENT_NAME = 'vc-recycle-list-container';

// TODO: 抽离
const transformKey = $.prefixStyle('transform').camel;

export const Container = defineComponent({
	name: COMPONENT_NAME,
	props: containerProps,
	emits: ['refresh'],
	setup(props, { slots }) {
		const vm = getCurrentInstance()!;
		const K = useDirectionKeys();
		const current = ref();
		const offset = ref(0);
		const status = ref(0);

		// 刷新一侧：正序在主轴起点（下拉 / 右拉），inverted 在主轴终点（上拉 / 左拉），拉动方向与位移随之取反
		const sign = computed(() => (props.inverted ? -1 : 1));
		const isPulling = computed(() => status.value === PULL || status.value === PENDING);

		const offsetStyle = computed(() => {
			if (!props.pullable) return;

			return {
				[transformKey]: `${K.translateAxis}(${sign.value * offset.value}px)`,
			};
		});
		const pullStyle = computed(() => {
			return {
				[props.inverted ? K.marginPullTail : K.marginPullHead]: `-${props.pauseOffset}px`
			};
		});

		let start = 0;
		let isStart = false;

		// TODO: 多个手指同时触发拉动
		const handleStart = (e: any) => {
			if (!props.pullable) return;

			isStart = true;

			if (!start) {
				start = e.touches
					? e.touches[0][K.screenAxis]
					: e[K.screenAxis];
			}
		};

		const handleMove = (e: any) => {
			if (!isStart || !props.pullable) return;
			// 鼠标主键已松开但没收到 mouseup（右键菜单、原生拖拽等会吞掉它）：直接结束手势
			if (!e.touches && !(e.buttons & 1)) {
				handleMouseUp(e);
				return;
			}
			// 主轴不在刷新一侧的端点时的拖动是普通滚动，不进入拉动
			if (!props.canPull()) return;

			const move = e.touches
				? e.touches[0][K.screenAxis]
				: e[K.screenAxis];

			const distance = (move - start) * sign.value;
			if (
				distance > 0
				&& e.cancelable
			) {
				e.preventDefault();
				// 鼠标拉动不是选文字：清掉按下后顺带拖出的选区
				!e.touches && window.getSelection()?.removeAllRanges();
				offset.value = distance < props.pauseOffset * 3 ? distance : props.pauseOffset * 3 + (distance - props.pauseOffset * 3) / 5;
				if (status.value == REFRESH) return;
				if (offset.value <= props.pauseOffset) {
					status.value = PULL;
				} else {
					status.value = PENDING;
				}
			}
		};

		const handleEnd = async (e: any) => {
			if (!isStart || !props.pullable) return;
			if (!('ontouchend' in window) || !e.targetTouches?.length) {
				isStart = false;

				start = 0;
				if (status.value == PENDING) {
					status.value = REFRESH;
					offset.value = props.pauseOffset;
					try {
						await vm.vnode.props?.['onRefresh']?.();
					} finally {
						status.value = DEFAULT;
						offset.value = 0;
					}
				} else if (status.value == REFRESH) {
					offset.value = props.pauseOffset;
				} else {
					offset.value = 0;
					status.value = DEFAULT;
				}
			}
		};

		/**
		 * 鼠标拖动：按下后改在 document 上跟踪移动与松开
		 *
		 * 指针拖出列表（或选区自动滚动把列表滚走）后，根节点收不到 mousemove / mouseup，状态会卡在 PULL / PENDING；
		 * 触摸事件始终派发给起点元素，不需要这样处理
		 */
		const removeMouseListeners = () => {
			document.removeEventListener('mousemove', handleMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('selectstart', handleSelectStart);
		};

		// 拉动中不再开始新的选区，避免选区扩展与它带来的自动滚动
		const handleSelectStart = (e: Event) => {
			isPulling.value && e.preventDefault();
		};

		const handleMouseUp = (e: MouseEvent) => {
			removeMouseListeners();
			handleEnd(e);
		};

		const handleMouseDown = (e: MouseEvent) => {
			// 只有主键拖动才是拉动
			if (e.button !== 0) return;
			handleStart(e);
			if (!isStart) return;
			document.addEventListener('mousemove', handleMove);
			document.addEventListener('mouseup', handleMouseUp);
			document.addEventListener('selectstart', handleSelectStart);
		};

		onBeforeUnmount(removeMouseListeners);

		// 刷新提示条：正序在容器前（起点一侧），inverted 在容器后（终点一侧）
		const renderPull = () => (
			<div
				style={[offsetStyle.value, pullStyle.value]}
				class="vc-recycle-list__pull"
			>
				<Customer
					render={props.render}
					// @ts-ignore
					status={status.value}
					type={props.inverted ? K.pullTail : K.pullHead}
				/>
			</div>
		);

		return () => {
			return (
				<div
					ref={current}
					class={{ 'is-pulling': isPulling.value }}
					onMousedown={handleMouseDown}
					onTouchstart={handleStart}
					onTouchmove={handleMove}
					onTouchend={handleEnd}
				>
					{ !props.inverted && props.pullable && renderPull() }
					<div
						style={[offsetStyle.value]}
						class="vc-recycle-list__container"
					>
						{ slots.default?.() }
					</div>
					{ props.inverted && props.pullable && renderPull() }
				</div>
			);
		};
	}
});
