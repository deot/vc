/** @jsxImportSource vue */

import { ref, computed, defineComponent, getCurrentInstance } from 'vue';
import * as $ from '@deot/helper-dom';
import { props as containerProps } from './container-props';
import { DEFAULT, PENDING, PULL, REFRESH } from './container-constant';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-recycle-list-container';

// TODO: 抽离
const transformKey = $.prefixStyle('transform').camel;

export const Container = defineComponent({
	name: COMPONENT_NAME,
	props: containerProps,
	emits: ['refresh'],
	setup(props, { slots }) {
		const vm = getCurrentInstance()!;
		const current = ref();
		const y = ref(0);
		const status = ref(0);

		const yStyle = computed(() => {
			if (props.inverted || !props.pullable) return;

			return {
				[transformKey]: `translateY(${y.value}px)`
			};
		});

		let startY = 0;
		let isStart = false;

		// TODO: 多个手指同时触发拉动
		const handleStart = (e: any) => {
			if (props.inverted || !props.pullable) return;

			isStart = true;

			if (!startY) {
				startY = e.touches
					? e.touches[0].screenY
					: e.screenY;
			}
		};

		const handleMove = (e: any) => {
			if (!isStart || props.inverted || !props.pullable) return;
			const allow = current.value.querySelector('.vc-recycle-list__wrapper').scrollTop == 0;
			if (!allow) return;

			const moveY = e.touches
				? e.touches[0].screenY
				: e.screenY;

			const distanceY = moveY - startY;
			if (
				distanceY > 0
				&& e.cancelable
			) {
				e.preventDefault();
				y.value = distanceY < props.pauseY * 3 ? distanceY : props.pauseY * 3 + (distanceY - props.pauseY * 3) / 5;
				if (status.value == REFRESH) return;
				if (y.value <= props.pauseY) {
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

				startY = 0;
				if (status.value == PENDING) {
					status.value = REFRESH;
					y.value = props.pauseY;
					try {
						await vm.vnode.props?.['onRefresh']?.();
					} finally {
						status.value = DEFAULT;
						y.value = 0;
					}
				} else if (status.value == REFRESH) {
					y.value = props.pauseY;
				} else {
					y.value = 0;
					status.value = DEFAULT;
				}
			}
		};
		return () => {
			return (
				<div
					ref={current}
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
								style={[yStyle.value]}
								class="vc-recycle-list__pull"
							>
								<Customer
									render={props.render}
									// @ts-ignore
									status={status.value}
									type="DOWN"
								/>
							</div>
						)
					}
					<div
						style={[yStyle.value]}
						class="vc-recycle-list__container"
					>
						{ slots.default?.() }
					</div>
				</div>
			);
		};
	}
});
