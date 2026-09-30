/** @jsxImportSource vue */

import { defineComponent, onMounted, ref, watch } from 'vue';
import { Portal } from '../../portal';
import { MPopup } from '../../popup/index.m';
import { Icon } from '../../icon';
import { useLocale } from '../../locale';
import './video.scss';

const VideoPreviewView = defineComponent({
	name: 'vc-video-preview',
	props: {
		src: String
	},
	emits: ['portal-fulfilled'],
	setup(props, { emit }) {
		const { t } = useLocale();
		const visible = ref(false);
		const video = ref<HTMLVideoElement>();

		onMounted(() => (visible.value = true));
		watch(visible, v => !v && video.value?.pause());

		return () => (
			<MPopup
				modelValue={visible.value}
				theme="dark"
				placement="center"
				wrapperClass="vc-video-preview__wrapper"
				onUpdate:modelValue={v => (visible.value = v)}
				onClose={() => emit('portal-fulfilled')}
			>
				<div class="vc-video-preview">
					<video
						ref={video}
						src={props.src}
						class="vc-video-preview__video"
						controls
						playsinline
						controlslist="nodownload"
						disablePictureInPicture
					/>
					<button
						type="button"
						class="vc-video-preview__close"
						aria-label={t('vc.FilePreview.close')}
						onClick={() => (visible.value = false)}
					>
						<Icon type="close" />
					</button>
				</div>
			</MPopup>
		);
	}
});

export const VideoPreview = new Portal(VideoPreviewView);
