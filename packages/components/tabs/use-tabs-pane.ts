import { getCurrentInstance, computed, watch, ref, inject, onMounted, onUnmounted, onBeforeUnmount, onBeforeMount } from 'vue';
import type { Props } from './tabs-pane-props';

export const useTabsPane = (props: Props) => {
	// 标签页按实例登记面板，卸载判断也需要实例
	const instance = getCurrentInstance()!;

	const currentValue = ref<any>(void 0);
	const isLoaded = ref(false);
	const tabs = inject('vc-tabs', {}) as any;

	const isActive = computed(() => {
		const paneValue = typeof props.value === 'undefined'
			? currentValue.value
			: props.value;
		const state = tabs.currentValue.value === paneValue;

		// 副作用
		if (!isLoaded.value && state) {
			isLoaded.value = true;
		}

		return state;
	});

	// 未设置时继承 Tabs（同 CollapseItem）
	const lazy = computed(() => {
		return typeof props.lazy === 'boolean' ? props.lazy : (tabs.props?.lazy ?? true);
	});

	const alive = computed(() => {
		return typeof props.alive === 'boolean' ? props.alive : (tabs.props?.alive ?? true);
	});

	/**
	 * 激活时渲染；隐藏时 alive 为 false 则卸载，否则已渲染过（或不懒加载）的保留
	 * 面板容器始终保留，切换动画的位置不受影响
	 */
	const isReady = computed(() => {
		return isActive.value || (alive.value && (isLoaded.value || !lazy.value));
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
