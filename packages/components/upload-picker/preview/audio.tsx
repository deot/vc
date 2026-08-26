/** @jsxImportSource vue */

import { defineComponent, onMounted, ref, watch } from 'vue';
import { Portal } from '../../portal';
import { MPopup } from '../../popup/index.m';
import { Icon } from '../../icon';

const AudioPreviewView = defineComponent({
	name: 'vc-audio-preview',
	props: {
		src: String
	},
	emits: ['portal-fulfilled'],
	setup(props, { emit }) {
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
					<Icon
						type="close"
						class="vc-audio-preview__close"
						// @ts-ignore
						onClick={() => (visible.value = false)}
					/>
				</div>
			</MPopup>
		);
	}
});

export const AudioPreview = new Portal(AudioPreviewView);
