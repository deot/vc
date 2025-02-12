/** @jsxImportSource vue */

import { computed, defineComponent, nextTick, onMounted, ref, Teleport, watch } from 'vue';
import * as $ from '@deot/helper-dom';
import { props as barProps } from './bar-props';
import { Track } from './track';
import type { TrackExposed } from './track';

const COMPONENT_NAME = 'vc-scroller-bar';

export type BarExposed = {
	scrollTo: (options?: any) => void;

	trackX: TrackExposed;
	trackY: TrackExposed;
};
export const Bar = defineComponent({
	name: COMPONENT_NAME,
	props: barProps,
	emits: ['change'],
	setup(props, { emit, expose }) {
		const hasTo = ref(true);

		const trackX = ref<TrackExposed>();
		const trackY = ref<TrackExposed>();

		const trackBinds = computed(() => {
			return {
				always: props.always,
				thumbMinSize: props.thumbMinSize,
				thumbStyle: props.thumbStyle,
				thumbClassName: props.thumbClassName,
				class: props.trackClassName
			};
		});

		const barFitPos = computed(() => {
			if (props.to || !props.fit) return {};
			const maxMoveX = props.contentW! - props.wrapperW!;
			const maxMoveY = props.contentH! - props.wrapperH!;

			const fitMoveX = props.scrollX! >= maxMoveX ? maxMoveX : props.scrollX;
			const fitMoveY = props.scrollY! >= maxMoveY ? maxMoveY : props.scrollY;

			return {
				[$.prefixStyle('transform').camel]: `translate(${fitMoveX}px, ${fitMoveY}px)`
			};
		});

		const scrollTo = (options?: any) => {
			if (!trackY.value || !trackX.value || !options) return;

			typeof options.y !== 'undefined' && trackY.value.scrollTo(options.y);
			typeof options.x !== 'undefined' && trackX.value.scrollTo(options.x);
		};

		const setBarStatus = () => {
			if (typeof document !== 'undefined' && props.to) {
				hasTo.value = !document.querySelector(props.to);
			}
		};

		onMounted(() => {
			if (!props.native) {
				nextTick(setBarStatus);
			}
		});

		watch(
			() => props.to,
			setBarStatus
		);

		expose({
			scrollTo,

			// 把这个暴露出去
			trackX,
			trackY,
		});

		return () => {
			return !props.native && (!hasTo.value || !props.to) && (
				<Teleport to={props.to} disabled={!props.to}>
					<Track
						ref={trackX}
						{
							...trackBinds.value
						}
						offset={[props.trackOffsetX[3], props.trackOffsetX[1]]}
						wrapper-size={props.wrapperW}
						content-size={props.contentW}
						style={[
							{
								left: props.trackOffsetX[3] + 'px',
								bottom: props.trackOffsetX[2] + 'px'
							},
							props.trackStyle,
							barFitPos.value
						]}
						// @ts-ignore
						onChange={v => emit('change', { x: v })}
					/>
					<Track
						ref={trackY}
						{
							...trackBinds.value
						}
						offset={[props.trackOffsetY[0], props.trackOffsetY[2]]}
						wrapper-size={props.wrapperH}
						content-size={props.contentH}
						style={[
							{
								top: props.trackOffsetY[0] + 'px',
								right: props.trackOffsetY[1] + 'px'
							},
							props.trackStyle,
							barFitPos.value
						]}
						vertical
						// @ts-ignore
						onChange={v => emit('change', { y: v })}
					/>
				</Teleport>
			);
		};
	}
});
