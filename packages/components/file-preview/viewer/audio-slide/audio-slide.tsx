/** @jsxImportSource vue */

import { defineComponent, onMounted } from 'vue';
import { useReveal } from '../reveal';
import { props as slideProps } from '../slide-props';
import { useMedia } from '../use-media';

const COMPONENT_NAME = 'vc-audio-slide';

export const AudioSlide = defineComponent({
	name: COMPONENT_NAME,
	props: slideProps,
	setup(props) {
		const reveal = useReveal();
		const media = useMedia(() => props.active);

		onMounted(() => reveal?.ready());

		return () => (
			<div class="vc-audio-slide">
				<div class="vc-audio-slide__stage">
					<p class="vc-audio-slide__name">{props.row.name}</p>
					<audio
						ref={media}
						class="vc-audio-slide__media"
						src={props.row.source}
						controls
						preload="metadata"
					/>
				</div>
			</div>
		);
	}
});
