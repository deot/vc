/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { useReveal } from '../reveal';
import { props as slideProps } from '../slide-props';
import { useMedia } from '../use-media';
import type { Size } from '../utils';

const COMPONENT_NAME = 'vc-video-slide';

export const VideoSlide = defineComponent({
	name: COMPONENT_NAME,
	props: slideProps,
	setup(props) {
		const reveal = useReveal();
		const media = useMedia(() => props.active);
		const isReady = ref(false);

		// 按自己的比例居中、不超出这一页，和 max-width / max-height 一致
		const subject = (viewport: Size) => {
			const { videoWidth: w, videoHeight: h } = media.value as HTMLVideoElement;
			const scale = Math.min(1, viewport.w / w, viewport.h / h);
			return {
				left: (viewport.w - w * scale) / 2,
				top: (viewport.h - h * scale) / 2,
				width: w * scale,
				height: h * scale
			};
		};

		// 未拿到尺寸时只有默认的 300×150，不从它放大
		const handleLoadedMetadata = () => {
			isReady.value = true;
			reveal?.ready(subject);
		};

		const handleError = () => {
			isReady.value = true;
			reveal?.ready();
		};

		return () => (
			<div class="vc-video-slide">
				<video
					ref={media}
					class={['vc-video-slide__media', { 'is-ready': isReady.value }]}
					src={props.row.source}
					controls
					playsinline
					preload="metadata"
					controlslist="nodownload"
					disablePictureInPicture
					onLoadedmetadata={handleLoadedMetadata}
					onError={handleError}
				/>
			</div>
		);
	}
});
