/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';

const COMPONENT_NAME = 'vc-recycle-list-item';

export const Item = defineComponent({
	name: COMPONENT_NAME,
	emits: ['resize'],
	setup(_, { emit, slots }) {
		const current = ref();
		const offsetHeight = ref(0);
		const handleResize = () => {
			const v = current.value.offsetHeight;
			const changed = offsetHeight.value != v;
			if (changed) {
				offsetHeight.value = v;
				emit('resize');
			}
		};

		onMounted(() => {
			offsetHeight.value = current.value.offsetHeight;
			Resize.on(current.value, handleResize);
		});

		onBeforeUnmount(() => {
			Resize.off(current.value, handleResize);
		});

		return () => {
			return (
				<div ref={current} class="vc-recycle-list-item">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
