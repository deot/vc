/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';
import { useDirectionKeys } from './use-direction-keys';

const COMPONENT_NAME = 'vc-recycle-list-item';

export const Item = defineComponent({
	name: COMPONENT_NAME,
	props: {
		vertical: {
			type: Boolean,
			default: true
		}
	},
	emits: ['resize'],
	setup(_, { emit, slots }) {
		const K = useDirectionKeys();
		const current = ref();
		const offsetSize = ref(0);
		const handleResize = () => {
			const v = current.value[K.offsetSize];
			const changed = offsetSize.value != v;
			if (changed) {
				offsetSize.value = v;
				emit('resize');
			}
		};

		onMounted(() => {
			offsetSize.value = current.value[K.offsetSize];
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
