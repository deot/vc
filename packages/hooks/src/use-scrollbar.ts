import { onMounted, onBeforeUnmount, watch } from 'vue';
import type { Ref, ComputedRef } from 'vue';

let locks = 0;
let original = '';
let priority = '';

export const useScrollbar = (visibleRef: Ref<boolean> | ComputedRef) => {
	let isMounted = false;
	let locked = false;

	const setScrollBar = (v: boolean) => {
		if (!isMounted || v === locked) return;
		const { style } = document.body;
		locked = v;
		if (v) {
			if (locks++ === 0) {
				original = style.getPropertyValue('overflow');
				priority = style.getPropertyPriority('overflow');
				style.setProperty('overflow', 'hidden');
			}
		} else {
			if (--locks === 0) {
				original ? style.setProperty('overflow', original, priority) : style.removeProperty('overflow');
			}
		}
	};

	watch(
		() => visibleRef.value,
		(v) => {
			setScrollBar(v);
		},
		{ immediate: false }
	);

	onMounted(() => {
		isMounted = true;
		// 初始就展示弹层的情况下
		visibleRef.value && setScrollBar(true);
	});

	onBeforeUnmount(() => {
		setScrollBar(false);
	});
};
