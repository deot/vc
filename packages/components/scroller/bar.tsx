/** @jsxImportSource vue */

import { computed, defineComponent, nextTick, onMounted, ref, Teleport, watch } from 'vue';
import * as $ from '@deot/helper-dom';
import { props as barProps } from './bar-props';
import { Track } from './track';
import type { TrackExposed } from './track';

const COMPONENT_NAME = 'vc-scroller-bar';
// sticky 下贴右/贴底时扣除的偏移，由 track.scss 读取
const TRACK_OFFSET = '--vc-scroller-track-offset';

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

		const isSticky = computed(() => props.mode === 'sticky' && !props.to);

		const trackBinds = computed(() => {
			return {
				always: props.always,
				thumbMinSize: props.thumbMinSize,
				thumbStyle: props.thumbStyle,
				thumbClass: props.thumbClass,
				trigger: props.trigger,
				class: [props.trackClass, { 'is-sticky': isSticky.value }]
			};
		});

		// sticky：长度与负 margin 抵消轨道在文档流中的占位；贴右/贴底依赖轨道粗细，见 track.scss
		const stickyPosX = computed(() => {
			if (!isSticky.value) return {};
			const [, , bottom, left] = props.trackOffsetX;
			return {
				width: Math.max(props.wrapperW! - left, 0) + 'px',
				marginLeft: left + 'px',
				[TRACK_OFFSET]: bottom + 'px'
			};
		});

		const stickyPosY = computed(() => {
			if (!isSticky.value) return {};
			const [top, right] = props.trackOffsetY;
			const length = Math.max(props.wrapperH! - top, 0);
			return {
				height: length + 'px',
				marginTop: -length + 'px',
				marginRight: right + 'px',
				[TRACK_OFFSET]: right + 'px'
			};
		});

		const translatePos = computed(() => {
			if (props.to || props.mode !== 'translate') return {};
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

		// 传元素时视为目标存在；传 selector 时按当前文档查找
		const setBarStatus = () => {
			if (typeof document === 'undefined' || !props.to) return;
			hasTo.value = typeof props.to === 'string'
				? !document.querySelector(props.to)
				: false;
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

		// Teleport 目标变化后轨道已移到新容器，重新解析悬停区域（未传 trigger 时即新容器）
		watch(
			() => props.to,
			() => {
				trackX.value?.refreshHover();
				trackY.value?.refreshHover();
			},
			{ flush: 'post' }
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
							stickyPosX.value,
							props.trackStyle,
							translatePos.value
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
							stickyPosY.value,
							props.trackStyle,
							translatePos.value
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
