import { onMounted, onBeforeUnmount, watch } from 'vue';
import type { Ref, ComputedRef } from 'vue';

export const useScrollbar = (visibleRef: Ref<boolean> | ComputedRef) => {
	let original = '';
	let isMounted = false;

	const setScrollBar = (v: boolean) => {
		if (!isMounted || original === 'hidden') return;
		if (v) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.removeProperty('overflow');
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
		original = document.body.style.overflow;

		// 初始就展示弹层的情况下
		visibleRef.value && setScrollBar(true);
	});

	onBeforeUnmount(() => {
		setScrollBar(false);
	});
};
