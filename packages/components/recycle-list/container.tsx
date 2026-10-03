/** @jsxImportSource vue */

import { ref, computed, defineComponent, getCurrentInstance, onBeforeUnmount } from 'vue';
import * as $ from '@deot/helper-dom';
import { useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';
import { props as containerProps } from './container-props';
import { DEFAULT, PENDING, PULL, REFRESH, STATUS_MAP } from './container-constant';
import { Customer } from '../customer';
import { useLocale } from '../locale';
import { useDirectionKeys } from './hooks/use-direction-keys';

const COMPONENT_NAME = 'vc-recycle-list-container';

// TODO: 抽离
const transformKey = $.prefixStyle('transform').camel;

export const Container = defineComponent({
	name: COMPONENT_NAME,
	props: containerProps,
	emits: ['refresh'],
	setup(props, { slots }) {
		const { t } = useLocale();
		const renderDefault = ({ status, type }: Record<string, any>) => status === DEFAULT
			? '~'
			: STATUS_MAP[type][status] && t(`vc.RecycleList.${STATUS_MAP[type][status]}`);
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

		// 拉动中不再开始新的选区，避免选区扩展与它带来的自动滚动
		const handleSelectStart = (e: Event) => {
			isPulling.value && e.preventDefault();
		};

		const removeSelectStart = () => {
			document.removeEventListener('selectstart', handleSelectStart);
		};

		const handleStart = (e: MouseEvent | TouchEvent, point: DragPoint) => {
			if (!props.pullable) return false;

			start = point[K.screenAxis];
			// 只有鼠标拖动会带出选区
			e.type === 'mousedown' && document.addEventListener('selectstart', handleSelectStart);
			return true;
		};

		const handleMove = (e: MouseEvent | TouchEvent, point: DragPoint) => {
			// 主轴不在刷新一侧的端点时的拖动是普通滚动，不进入拉动
			if (!props.pullable || !props.canPull()) return;

			const distance = (point[K.screenAxis] - start) * sign.value;
			if (
				distance > 0
				&& e.cancelable
			) {
				e.preventDefault();
				// 鼠标拉动不是选文字：清掉按下后顺带拖出的选区
				e.type === 'mousemove' && window.getSelection()?.removeAllRanges();
				offset.value = distance < props.pauseOffset * 3 ? distance : props.pauseOffset * 3 + (distance - props.pauseOffset * 3) / 5;
				if (status.value == REFRESH) return;
				if (offset.value <= props.pauseOffset) {
					status.value = PULL;
				} else {
					status.value = PENDING;
				}
			}
		};

		// 手势结束；refresh 为 false（touchcancel、mouseup 丢失）时只回弹，不触发刷新
		const finish = async (refresh: boolean) => {
			removeSelectStart();

			if (refresh && status.value == PENDING) {
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
		};

		// 鼠标拖出列表（或选区自动滚动把列表滚走）后，移动与松开由 useDrag 在 document 上跟踪，状态不会卡在 PULL / PENDING
		const drag = useDrag({
			start: handleStart,
			move: handleMove,
			end: () => finish(true),
			cancel: () => finish(false)
		});

		onBeforeUnmount(removeSelectStart);

		// 刷新提示条：正序在容器前（起点一侧），inverted 在容器后（终点一侧）
		const renderPull = () => (
			<div
				style={[offsetStyle.value, pullStyle.value]}
				class="vc-recycle-list__pull"
			>
				<Customer
					render={props.render || renderDefault}
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
					{...drag.listeners}
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
