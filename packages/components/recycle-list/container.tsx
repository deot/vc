/** @jsxImportSource vue */

import { ref, computed, defineComponent, getCurrentInstance } from 'vue';
import * as $ from '@deot/helper-dom';
import { props as containerProps } from './container-props';
import { DEFAULT, PENDING, PULL, REFRESH } from './container-constant';
import { Customer } from '../customer';
import { useDirectionKeys } from './use-direction-keys';

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

		const offsetStyle = computed(() => {
			if (props.inverted || !props.pullable) return;

			return {
				[transformKey]: `${K.translateAxis}(${offset.value}px)`,
			};
		});
		const pullStyle = computed(() => {
			return {
				[K.marginPullHead]: `-${props.pauseOffset}px`
			};
		});

		let start = 0;
		let isStart = false;

		// TODO: 多个手指同时触发拉动
		const handleStart = (e: any) => {
			if (props.inverted || !props.pullable) return;

			isStart = true;

			if (!start) {
				start = e.touches
					? e.touches[0][K.screenAxis]
					: e[K.screenAxis];
			}
		};

		const handleMove = (e: any) => {
			if (!isStart || props.inverted || !props.pullable) return;
			const allow = current.value.querySelector('.vc-recycle-list__wrapper')[K.scrollAxis] == 0;
			if (!allow) return;

			const move = e.touches
				? e.touches[0][K.screenAxis]
				: e[K.screenAxis];

			const distance = move - start;
			if (
				distance > 0
				&& e.cancelable
			) {
				e.preventDefault();
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
			if (!isStart || props.inverted || !props.pullable) return;
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
		return () => {
			return (
				<div
					ref={current}
					class={{ 'is-transition-none': status.value === PULL || status.value === PENDING }}
					onMousedown={handleStart}
					onMousemove={handleMove}
					onMouseup={handleEnd}
					onTouchstart={handleStart}
					onTouchmove={handleMove}
					onTouchend={handleEnd}
				>
					{
						!props.inverted && props.pullable && (
							<div
								style={[offsetStyle.value, pullStyle.value]}
								class="vc-recycle-list__pull"
							>
								<Customer
									render={props.render}
									// @ts-ignore
									status={status.value}
									type={props.vertical ? 'DOWN' : 'RIGHT'}
								/>
							</div>
						)
					}
					<div
						style={[offsetStyle.value]}
						class="vc-recycle-list__container"
					>
						{ slots.default?.() }
					</div>
				</div>
			);
		};
	}
});
