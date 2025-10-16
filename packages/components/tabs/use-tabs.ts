import { getCurrentInstance, computed, watch, ref, provide, onMounted, onBeforeUnmount, nextTick, inject } from 'vue';
import { Resize } from '@deot/helper-resize';
import { getUid } from '@deot/helper-utils';
import { scrollIntoView } from '@deot/helper-dom';
import { getScroller } from '../scroller/utils';

export default (options: any = {}) => {
	// 目前只支持外置（<Affix><Tabs></Affix>）,后续集成<Tabs affixable affixOptions="{}" />(但这个与锚点无关)
	const affix = inject('vc-affix', null) as any;
	const instance = getCurrentInstance()!;
	const { props, emit } = instance;

	const tabsId = ref(getUid('tabs'));
	// tabs-children数据
	const list = ref<any[]>([]);
	// tabs-nav-item底部宽度，偏移值
	const afloatWidth = ref(0);
	const afloatOffset = ref(0);
	// 当前的active
	const currentValue = ref<any>(undefined);
	// tabs-nav滚动偏移值
	const scrollOffset = ref(0);
	// 可滚动
	const scrollable = ref(false);
	// 正在切换
	const timer = ref<any>(null);

	const getTabPaneValue = (nav: any, index: number) => {
		return typeof nav?.value === 'undefined' ? index : nav.value;
	};

	const getTabIndex = (v: any) => {
		return list.value.findIndex((nav, index) => getTabPaneValue(nav, index) === v);
	};

	const afloatStyle = computed(() => {
		const style = {
			width: `${afloatWidth.value}px`,
			transform: `translate3d(${afloatOffset.value}px, 0px, 0px)`
		};

		return style;
	});

	const contentStyle = computed(() => {
		const index = getTabIndex(currentValue.value);
		const precent = index === 0 ? '0%' : `-${index}00%`;

		const style = {
			transform: ''
		};
		if (index > -1) {
			style.transform = `translate3d(${precent}, 0px, 0px)`;
		}
		return style;
	});

	const classes = computed(() => {
		return {
			'is-animated': props.animated,
			[`is-${props.type}`]: !!props.type,
			[`is-${props.theme}`]: !!props.theme,
		};
	});

	const hasAnchor = computed(() => {
		return list.value.some(item => !!item.anchor);
	});

	/**
	 * 下层值变化：刷新tabs
	 */
	const refresh = () => {
		options?.refreshAfloat?.();
	};

	let scrollToAnchorTimer: any;
	const scrollToAnchor = (anchor: string) => {
		if (!anchor) return;
		const el = document.querySelector(anchor);
		if (!el) return;
		const scroller = getScroller(instance.vnode.el) as any;

		scrollIntoView(scroller, {
			duration: 250,
			from: scroller.scrollTop,
			to: scroller.scrollTop
				+ el.getBoundingClientRect().top
				- scroller.getBoundingClientRect().top
				- (!affix || affix.props.placement !== 'bottom' ? instance.vnode.el!.offsetHeight : 0)
				- (affix && affix.props.placement !== 'bottom' ? affix.props.offset : 0)
		});
		scrollToAnchorTimer && clearTimeout(scrollToAnchorTimer);
		scrollToAnchorTimer = setTimeout(() => scrollToAnchorTimer = null, 300);
	};

	/**
	 * 遍历所有锚点，找到第一个当前可视区顶部对齐的锚点
	 * 并切换到当前tab
	 */
	const handleAffixScroll = () => {
		if (!hasAnchor.value || scrollToAnchorTimer) return;
		const scroller = getScroller(instance.vnode.el) as any;
		const scrollTop = scroller?.scrollTop;
		if (typeof scrollTop !== 'number') return;

		for (let i = 0; i < list.value.length; i++) {
			const nav = list.value[i];
			const anchor = nav.anchor;
			if (!anchor) continue;
			const el = document.querySelector(anchor) as HTMLElement;
			if (!el) continue;
			const elTop = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
			const nextNav = list.value[i + 1];
			let nextElTop: number | undefined;
			if (nextNav && nextNav.anchor) {
				const nextEl = document.querySelector(nextNav.anchor) as HTMLElement;
				if (nextEl) {
					nextElTop = nextEl.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
				}
			}
			const allowDistance = 2; // 允许一点误差
			if (
				scrollTop >= elTop - allowDistance
				&& (typeof nextElTop === 'undefined' || scrollTop < nextElTop - allowDistance)
			) {
				if (getTabIndex(currentValue.value) !== i) {
					handleChange(i, false);
				}
				break;
			}
		}
	};

	const handleChange = (index: number, scrollTo = true) => {
		if (timer.value) return;

		timer.value = setTimeout(() => timer.value = null, 300);

		const nav = list.value[index];
		if (nav.disabled) return;

		currentValue.value = getTabPaneValue(nav, index);

		emit('update:modelValue', currentValue.value);
		emit('change', currentValue.value);
		emit('click', currentValue.value);

		scrollTo && scrollToAnchor(nav.anchor);
	};

	const handleResize = () => {
		if (instance.isUnmounted) return;
		options?.refreshScroll?.();
		options?.refreshAfloat?.();
	};

	onMounted(() => {
		Resize.on(options.wrapper.value, handleResize);
		options.scrollToActive && nextTick(options.scrollToActive);
		affix?.onScroll?.(handleAffixScroll);
	});

	onBeforeUnmount(() => {
		Resize.off(options.wrapper.value, handleResize);
		timer.value && clearTimeout(timer.value);
		affix?.offScroll?.(handleAffixScroll);
		scrollToAnchorTimer && clearTimeout(scrollToAnchorTimer);
	});

	const add = (item: any, setValue: any) => {
		if (!item) return;
		// vnode动态时排序
		nextTick(() => {
			typeof currentValue.value === 'undefined' && (
				currentValue.value = typeof item.proxy.currentValue === 'undefined'
					? 0
					: item.proxy.currentValue
			);

			if (options.content.value) {
				const index = Array
					.from(options.content.value.children)
					.filter(i => /vcm?-tabs-pane/.test((i as any).className))
					.indexOf(item.vnode.el);

				if (index != -1) {
					list.value.splice(index, 0, item.props);
					typeof item.props.value === 'undefined' && (
						setValue(index)
					);
					return;
				}
			}

			list.value.push(item.props);

			typeof item.props.value === 'undefined' && (
				setValue(list.value.length - 1)
			);
		});
	};

	// v-if时，currentValue使用index顺序会错误（建议设置name值，否则可能造成问题
	const remove = (item: any) => {
		if (!item) return;
		list.value.splice(list.value.indexOf(item.props), 1);
	};

	provide('vc-tabs', {
		props,
		currentValue,
		refresh,
		add,
		remove
	});

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = v;
		},
		{ immediate: true }
	);

	watch(
		() => currentValue.value,
		() => {
			options.refreshAfloat?.();
			options.scrollToActive?.();
		}
	);

	watch(
		() => list.value.length,
		() => {
			options.refreshAfloat?.();
			options.scrollToActive?.();
		}
	);

	return {
		tabsId,
		list,
		timer,
		afloatWidth,
		afloatOffset,
		currentValue,
		scrollOffset,
		scrollable,
		afloatStyle,
		contentStyle,
		classes,

		getTabIndex,
		getTabPaneValue,
		handleChange
	};
};
