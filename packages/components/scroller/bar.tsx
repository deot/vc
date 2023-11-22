/** @jsxImportSource vue */

import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, Teleport, watch } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as barProps } from './bar-props';
import { Track } from './track';
import type { TrackExposed } from './track';

const COMPONENT_NAME = 'vc-scroller-bar';

export type BarExposed = {
	refresh: () => void; 
	refreshSize: () => void; 
	refreshTrack: () => void;

	trackX: TrackExposed;
	trackY: TrackExposed;
};
export const Bar = defineComponent({
	name: COMPONENT_NAME,
	props: barProps,
	emits: ['refresh-size', 'refresh-track'],
	setup(props, { emit, expose }) {
		const hasTo = ref(true);
		const wrapperW = ref(0);
		const wrapperH = ref(0);

		const contentH = ref(0);
		const contentW = ref(0);

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

		// 记录当前容器(wrapper)和内容(content)宽高
		const refreshSize = () => {
			if (!props.wrapper) return;

			wrapperW.value = props.wrapper.clientWidth;
			wrapperH.value = props.wrapper.clientHeight;

			contentH.value = props.wrapper.scrollHeight;
			contentW.value = props.wrapper.scrollWidth;

			emit('refresh-size', {
				wrapperW: wrapperW.value,
				wrapperH: wrapperH.value,
				contentH: contentH.value,
				contentW: contentW.value
			});
		};

		const refreshTrack = () => {
			if (!trackY.value || !trackX.value) return;
			const { scrollTop } = props.wrapper!;
			const { scrollLeft } = props.wrapper!;

			// 取代当前组件内值变化，避免构建当前组件的虚拟Dom掉帧（解决表格数据多时问题）
			trackY.value.scrollTo(scrollTop);
			trackX.value.scrollTo(scrollLeft);

			emit('refresh-track', {
				scrollTop,
				scrollLeft
			});
		};

		const refresh = () => {
			refreshSize();
			refreshTrack();
		};

		const setBarStatus = () => {
			if (typeof document !== 'undefined' && props.to) {
				hasTo.value = !document.querySelector(props.to);
			}
		};

		onMounted(() => {
			if (!props.native) {
				nextTick(refresh);
				nextTick(setBarStatus);
			}
			if (props.autoResize) {
				Resize.on(props.wrapper!, refresh);
				Resize.on(props.content!, refresh);
			}
		});

		onBeforeUnmount(() => {
			if (props.autoResize) {
				Resize.off(props.wrapper!, refresh);
				Resize.off(props.content!, refresh);
			}
		});

		watch(
			() => props.to,
			setBarStatus
		);

		expose({ 
			refresh, 
			refreshSize, 
			refreshTrack,

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
						wrapper-size={wrapperW.value} 
						content-size={contentW.value} 
						style={[
							{
								left: props.trackOffsetX[3] + 'px',
								bottom: props.trackOffsetX[2] + 'px'
							},
							props.trackStyle
						]}
						// @ts-ignore
						onRefreshScroll={(v: number) => props.wrapper!.scrollLeft = v}
					/>
					<Track
						ref={trackY}
						{
							...trackBinds.value
						}
						offset={[props.trackOffsetY[0], props.trackOffsetY[2]]}
						wrapper-size={wrapperH.value} 
						content-size={contentH.value} 
						style={[
							{ 
								top: props.trackOffsetY[0] + 'px', 
								right: props.trackOffsetY[1] + 'px'
							},
							props.trackStyle
						]}
						vertical
						// @ts-ignore
						onRefreshScroll={(v: number) => props.wrapper!.scrollTop = v}
					/>
				</Teleport>
			);
		};
	}
});
