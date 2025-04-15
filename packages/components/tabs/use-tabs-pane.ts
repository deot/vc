import { getCurrentInstance, computed, watch, ref, inject, onMounted, onUnmounted, onBeforeUnmount, onBeforeMount } from 'vue';

export default () => {
	const instance = getCurrentInstance()!;
	const { props } = instance;

	const currentValue = ref<any>(undefined);
	const isLoaded = ref(false);
	const tabs = inject('tabs', {}) as any;

	const isActive = computed(() => {
		const state = tabs.currentValue.value === (props.value || currentValue.value);

		// 副作用
		if (!isLoaded.value && state) {
			isLoaded.value = true;
		}

		return state;
	});

	const isReady = computed(() => {
		return !props.lazy || isLoaded.value || isActive.value;
	});

	const style = computed(() => {
		return isActive.value
			? {}
			: {
					opacity: 0,
					height: 0, // 避免重用高度
					overflow: 'hidden', // 避免内层的高度影响
				};
	});

	const refresh = () => {
		!instance.isUnmounted && tabs.refresh?.();
	};

	watch(
		() => props.value,
		(v) => {
			currentValue.value = v;
		},
		{
			immediate: true
		}
	);

	watch(
		() => [props.value, props.label],
		refresh
	);

	onMounted(refresh);
	onUnmounted(refresh);

	onBeforeMount(() => {
		tabs.add?.(instance, (v: any) => currentValue.value = v);
	});

	onBeforeUnmount(() => {
		tabs.remove?.(instance);
	});

	return {
		isLoaded,
		isActive,
		isReady,
		style,
		currentValue
	};
};
