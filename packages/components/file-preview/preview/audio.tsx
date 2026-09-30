/** @jsxImportSource vue */

import { defineComponent, onMounted, ref, watch } from 'vue';
import { Portal } from '../../portal';
import { MPopup } from '../../popup/index.m';
import { Icon } from '../../icon';
import { useLocale } from '../../locale';
import './audio.scss';

const AudioPreviewView = defineComponent({
	name: 'vc-audio-preview',
	props: {
		src: String
	},
	emits: ['portal-fulfilled'],
	setup(props, { emit }) {
		const { t } = useLocale();
		const visible = ref(false);
		const audio = ref<HTMLAudioElement>();

		onMounted(() => (visible.value = true));
		watch(visible, v => !v && audio.value?.pause());

		return () => (
			<MPopup
				modelValue={visible.value}
				theme="dark"
				placement="center"
				wrapperClass="vc-audio-preview__wrapper"
				onUpdate:modelValue={v => (visible.value = v)}
				onClose={() => emit('portal-fulfilled')}
			>
				<div class="vc-audio-preview">
					<audio
						ref={audio}
						src={props.src}
						class="vc-audio-preview__audio"
						controls
					/>
					<button
						type="button"
						class="vc-audio-preview__close"
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

export const AudioPreview = new Portal(AudioPreviewView);
