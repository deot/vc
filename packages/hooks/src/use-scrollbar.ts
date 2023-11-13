import { getCurrentInstance, onMounted, onBeforeUnmount, watch } from 'vue';
import type { Ref, ComputedRef, ComponentInternalInstance } from 'vue';

export const useScrollbar = (visibleRef: Ref<boolean> | ComputedRef) => {
	const instance = getCurrentInstance() as ComponentInternalInstance;
	let original = '';

	const setScrollBar = (v: boolean) => {
		if (!instance.isMounted || original === 'hidden') return;

		if (v) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.removeProperty("overflow");
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
		original = document.body.style.overflow;

		// 初始就展示弹层的情况下
		visibleRef.value && setScrollBar(true);
	});

	onBeforeUnmount(() => {
		setScrollBar(false);
	});
};
