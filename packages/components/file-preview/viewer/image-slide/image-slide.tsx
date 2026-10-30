/** @jsxImportSource vue */

import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { caf, raf } from '@deot/helper-utils';
import { useLocale } from '../../../locale';
import { Spin } from '../../../spin';
import { useReveal } from '../reveal';
import { reflow } from '../utils';
import type { Point, Size } from '../utils';
import { props as imageSlideProps } from './image-slide-props';
import { useZoom } from './use-zoom';
import { frameRect, imageTransform } from './utils';

const COMPONENT_NAME = 'vc-image-slide';
// 超过该时长（ms）仍未显示时出现加载中
const LOADING_DELAY = 2000;
// 数据没给宽高时，最多等这么久（ms）拿大图的尺寸再放大：缓存里的图一两帧就有，一次放大到位；
// 走网络的通常更久，先按缩略图的比例放大，尺寸到了再过渡
const SIZE_WAIT = 100;

export type ImageSlideExposed = {
	isZoomed: boolean;
	canZoomIn: boolean;
	canZoomOut: boolean;
	toggleZoom: (origin?: Point) => void;
	zoomBy: (factor: number, origin?: Point) => void;
	zoomIn: () => void;
	zoomOut: () => void;
	rotateBy: (delta: number) => void;
	straighten: () => void;
	panBy: (dx: number, dy: number) => number;
	pinchStart: (origin: Point) => void;
	pinch: (scale: number, origin: Point) => number;
	pinchEnd: () => void;
};

export const ImageSlide = defineComponent({
	name: COMPONENT_NAME,
	props: imageSlideProps,
	setup(props, { expose }) {
		const { t } = useLocale();
		const reveal = useReveal();
		const media = shallowRef<HTMLImageElement>();
		const measured = ref<Size | null>(null);
		const isReady = ref(false);
		const isError = ref(false);
		const isLoading = ref(false);
		// 只取打开那一刻的缩略图：切走后 prop 会清空，摆放不能跟着丢
		const thumbnail = props.placeholder;

		const given = computed<Size | null>(() => {
			const w = Number(props.row.width);
			const h = Number(props.row.height);
			return w > 0 && h > 0 ? { w, h } : null;
		});
		// 依次用数据里的宽高、大图解码后的尺寸、缩略图的尺寸；有缩略图时不用等大图就能放大
		const natural = computed(() => given.value || measured.value || thumbnail?.size || null);
		const zoom = useZoom(props, natural);
		const hasPlaceholder = computed(() => !!thumbnail && !isReady.value && !isError.value);

		const mediaStyle = computed(() => {
			const frame = zoom.frame.value;
			const size = natural.value;
			return frame && size ? { transform: imageTransform(frame, zoom.rotation.value, size) } : void 0;
		});

		const subject = () => {
			const frame = zoom.frame.value;
			return frame && natural.value ? frameRect(frame, natural.value) : null;
		};

		// 没有缩略图垫底：等大图解码完再放大，期间显示加载中
		thumbnail || reveal?.wait();

		// 有缩略图垫底时立即放大（数据没给宽高时先等一下大图的尺寸，最多 SIZE_WAIT），否则等大图解码完，放大的不会是一块空白
		let opening: Promise<void> | void;
		let isOpening = false;
		const isWaiting = ref(!given.value && !!thumbnail);
		const waitTimer = isWaiting.value ? setTimeout(() => (isWaiting.value = false), SIZE_WAIT) : 0;
		watch(
			() => (hasPlaceholder.value && !isWaiting.value) || isReady.value,
			(v) => {
				if (!v || isOpening) return;
				isOpening = true;
				opening = reveal?.ready(subject);
			},
			{ immediate: true }
		);

		// 拿到大图的尺寸：还没开始放大时直接按它摆放，一次放大到位；
		// 已按缩略图摆放的，放进同一个盒子，比例不同或 fit 为 actual 时，等放大结束、窗口不再裁在缩略图的盒子上，下一拍再过渡到初始位置
		const settle = async (size: Size) => {
			if (measured.value) return;
			const prev = natural.value;
			measured.value = size;
			isWaiting.value = false;
			if (!prev || prev === natural.value) return;
			if (!isOpening) return zoom.reset();
			if (zoom.refit(prev)) return;
			await opening;
			await nextTick();
			reflow(media.value);
			zoom.reset(true);
		};

		// 下载到头部就有尺寸，逐帧看一眼，不必等整张图解码完
		let frame: ReturnType<typeof raf> | undefined;
		const watchSize = () => {
			const el = media.value;
			if (!el || given.value || measured.value || isError.value) return;
			if (el.naturalWidth) return settle({ w: el.naturalWidth, h: el.naturalHeight });
			frame = raf(watchSize);
		};
		onMounted(watchSize);

		// 解码完再换上大图，缩略图和大图不会叠着错位
		const handleLoad = async () => {
			const el = media.value!;
			if (isReady.value) return;
			await el.decode?.().catch(() => {});
			settle({ w: el.naturalWidth, h: el.naturalHeight });
			isReady.value = true;
		};

		const handleError = () => {
			isError.value = true;
			reveal?.ready();
		};

		const timer = setTimeout(() => {
			isLoading.value = true;
		}, LOADING_DELAY);

		onBeforeUnmount(() => {
			clearTimeout(timer);
			clearTimeout(waitTimer);
			frame && caf(frame);
		});

		expose({
			isZoomed: zoom.isZoomed,
			canZoomIn: zoom.canZoomIn,
			canZoomOut: zoom.canZoomOut,
			toggleZoom: zoom.toggleZoom,
			zoomBy: zoom.zoomBy,
			zoomIn: zoom.zoomIn,
			zoomOut: zoom.zoomOut,
			rotateBy: zoom.rotateBy,
			straighten: zoom.straighten,
			panBy: zoom.panBy,
			pinchStart: zoom.pinchStart,
			pinch: zoom.pinch,
			pinchEnd: zoom.pinchEnd
		});

		return () => (
			<div class="vc-image-slide">
				{
					hasPlaceholder.value && (
						<img
							class={['vc-image-slide__placeholder', { 'is-animating': zoom.isAnimating.value }]}
							src={thumbnail!.src}
							alt=""
							width={natural.value?.w}
							height={natural.value?.h}
							draggable={false}
							style={mediaStyle.value}
						/>
					)
				}
				<img
					ref={media}
					class={[
						'vc-image-slide__media',
						{
							'is-ready': isReady.value,
							'is-zoomed': zoom.isZoomed.value,
							'is-animating': zoom.isAnimating.value
						}
					]}
					src={props.row.source}
					alt={props.row.name || ''}
					width={natural.value?.w}
					height={natural.value?.h}
					draggable={false}
					style={mediaStyle.value}
					onLoad={handleLoad}
					onError={handleError}
				/>
				{ isLoading.value && !isReady.value && !isError.value && <Spin class="vc-image-slide__loading" size={32} /> }
				{ isError.value && <p class="vc-image-slide__error">{t('vc.FilePreview.loadError')}</p> }
			</div>
		);
	}
});
