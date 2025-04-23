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
	emits: ['resize', 'change'],
	setup(_, { emit, slots }) {
		const K = useDirectionKeys();
		const current = ref();
		const offsetSize = ref(0);

		let hasInitial = false;
		const handleResize = () => {
			const v = current.value.getBoundingClientRect()[K.size];
			const changed = offsetSize.value != v;
			if (changed) {
				offsetSize.value = v;
				hasInitial && emit('resize', v);
				emit('change', v);
			}

			hasInitial = true;
		};

		onMounted(() => {
			Resize.on(current.value, handleResize); // 首次会执行一次
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
