/** @jsxImportSource vue */

import { computed, defineComponent } from 'vue';
import type { VNode } from 'vue';
import { Icon } from '../../icon';
import { Spin } from '../../spin';
import { useLocale } from '../../locale';
import { VcInstance } from '../../vc';
import { props as viewerProps } from './viewer-props';
import { useViewer } from './use-viewer';
import type { Slide } from './use-viewer';
import { thumbnailOf } from './utils';
import { AudioSlide } from './audio-slide';
import { FileSlide } from './file-slide';
import { ImageSlide } from './image-slide';
import type { ImageSlideExposed } from './image-slide';
import { Reveal } from './reveal';
import type { RevealExposed } from './reveal';
import { VideoSlide } from './video-slide';

const COMPONENT_NAME = 'vc-file-viewer';

export const FileViewer = defineComponent({
	name: COMPONENT_NAME,
	props: viewerProps,
	emits: ['portal-fulfilled'],
	setup(props, { emit }) {
		const { t } = useLocale();
		const viewer = useViewer(props, () => emit('portal-fulfilled'));
		const { activeReveal, activeImage, current, count, imageOptions } = viewer;
		const isImage = computed(() => viewer.row.value?.type === 'image');
		const closeSlide = () => {
			void viewer.close();
		};
		const setReveal = (vm: unknown) => {
			activeReveal.value = vm as RevealExposed | null;
		};
		const setImage = (vm: unknown) => {
			activeImage.value = vm as ImageSlideExposed | null;
		};

		const renderContent = (slide: Slide) => {
			const row = props.data[slide.index];
			if (row.type === 'image') {
				return (
					<ImageSlide
						ref={slide.isActive ? setImage : void 0}
						row={row}
						active={slide.isActive}
						fit={imageOptions.value.fit}
						max={imageOptions.value.max}
						min={imageOptions.value.min}
						viewport={viewer.viewport.value}
						placeholder={slide.isAnimated && imageOptions.value.placeholder ? thumbnailOf(slide.triggerElement) : void 0}
					/>
				);
			}
			if (row.type === 'video') return <VideoSlide row={row} active={slide.isActive} />;
			if (row.type === 'audio') return <AudioSlide row={row} active={slide.isActive} />;
			return <FileSlide row={row} active={slide.isActive} />;
		};

		// 全局 renderSlide 返回 VNode 时替换该页，返回 false 或空值时用内置页
		const renderSlide = (slide: Slide) => {
			const render = VcInstance.options.FilePreview?.renderSlide;
			const row = props.data[slide.index];
			const custom = typeof render === 'function' && render({
				type: row.type,
				row,
				index: slide.index,
				active: slide.isActive,
				close: closeSlide,
				instance: props.instance ?? null
			});
			if (custom) return custom as VNode;
			return (
				<Reveal
					ref={slide.isActive ? setReveal : void 0}
					animated={slide.isAnimated}
					viewport={viewer.viewport.value}
					triggerElement={slide.triggerElement}
					onAnimate={viewer.handleAnimate}
					onWait={viewer.handleWait}
				>
					{renderContent(slide)}
				</Reveal>
			);
		};

		return () => {
			return (
				<div ref={viewer.root} class={viewer.classes.value} role="dialog" aria-modal="true" tabindex={-1}>
					<div class="vc-file-viewer__bg" style={viewer.bgStyle.value} />
					{ viewer.isLoading.value && <Spin class="vc-file-viewer__loading" size={32} /> }
					<div
						ref={viewer.stage}
						class={['vc-file-viewer__stage', { 'is-sliding': viewer.isSliding.value }]}
						style={viewer.stageStyle.value}
						{...viewer.listeners}
					>
						{
							viewer.slides.value.map(slide => (
								<div
									key={slide.key}
									class={['vc-file-viewer__slide', { 'is-active': slide.isActive }]}
									data-index={slide.index}
									style={slide.style}
								>
									{renderSlide(slide)}
								</div>
							))
						}
					</div>
					<div class="vc-file-viewer__bar">
						<div class="vc-file-viewer__counter" aria-live="polite">{`${current.value + 1} / ${count.value}`}</div>
						{
							viewer.hasPrev.value && (
								<button
									type="button"
									class="vc-file-viewer__tool vc-file-viewer__prev"
									aria-label={t('vc.FilePreview.prev')}
									onClick={() => viewer.go(-1)}
								>
									<Icon type="left" />
								</button>
							)
						}
						{
							viewer.hasNext.value && (
								<button
									type="button"
									class="vc-file-viewer__tool vc-file-viewer__next"
									aria-label={t('vc.FilePreview.next')}
									onClick={() => viewer.go(1)}
								>
									<Icon type="right" />
								</button>
							)
						}
						{
							isImage.value && (
								<div class="vc-file-viewer__cluster">
									<button
										type="button"
										class="vc-file-viewer__tool vc-file-viewer__rotate-left"
										aria-label={t('vc.FilePreview.rotateLeft')}
										onClick={() => activeImage.value?.rotateBy(-90)}
									>
										<Icon type="rotate-left" />
									</button>
									<button
										type="button"
										class="vc-file-viewer__tool vc-file-viewer__rotate-right"
										aria-label={t('vc.FilePreview.rotateRight')}
										onClick={() => activeImage.value?.rotateBy(90)}
									>
										<Icon type="rotate-right" />
									</button>
									<span class="vc-file-viewer__split" aria-hidden="true" />
									<button
										type="button"
										class="vc-file-viewer__tool vc-file-viewer__zoom-out"
										aria-label={t('vc.FilePreview.zoomOut')}
										disabled={!activeImage.value?.canZoomOut}
										onClick={() => activeImage.value?.zoomOut()}
									>
										<span class="vc-file-viewer__lens" />
									</button>
									<button
										type="button"
										class="vc-file-viewer__tool vc-file-viewer__zoom-in"
										aria-label={t('vc.FilePreview.zoomIn')}
										disabled={!activeImage.value?.canZoomIn}
										onClick={() => activeImage.value?.zoomIn()}
									>
										<span class="vc-file-viewer__lens is-plus" />
									</button>
								</div>
							)
						}
						<button
							type="button"
							class="vc-file-viewer__tool vc-file-viewer__close"
							aria-label={t('vc.FilePreview.close')}
							onClick={closeSlide}
						>
							<Icon type="close" />
						</button>
					</div>
				</div>
			);
		};
	}
});
