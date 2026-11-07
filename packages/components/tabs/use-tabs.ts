import { getCurrentInstance, computed, watch, ref, provide, onMounted, onBeforeUnmount, nextTick, inject } from 'vue';
import { scrollIntoView } from '@deot/helper-dom';
import { getScroller, getViewportRect } from '../scroller/utils';

export default (options: any = {}) => {
	// 目前只支持外置（<Affix><Tabs></Affix>）,后续集成<Tabs affixable affixOptions="{}" />(但这个与锚点无关)
	const affix = inject('vc-affix', null) as any;
	const instance = getCurrentInstance()!;
	const { props, emit } = instance;

	// tabs-children数据
	const list = ref<any[]>([]);
	// 面板实例，键为 list 中的 props
	const panes = new WeakMap<object, any>();
	// 滑块在排列方向上的长度与偏移
	const afloatWidth = ref(0);
	const afloatOffset = ref(0);
	// 当前的active
	const currentValue = ref<any>(undefined);
	// 连续点击的间隔限制
	let timer: any;

	const getTabPaneValue = (nav: any, index: number) => {
		return typeof nav?.value === 'undefined' ? index : nav.value;
	};

	const getTabIndex = (v: any) => {
		return list.value.findIndex((nav, index) => getTabPaneValue(nav, index) === v);
	};

	// 标签栏在左右两侧时纵向排列（只有桌面端有 placement）
	const isVertical = computed(() => {
		return props.placement === 'left' || props.placement === 'right';
	});

	const afloatStyle = computed(() => {
		const length = `${afloatWidth.value}px`;
		const offset = `${afloatOffset.value}px`;
		return isVertical.value
			? { height: length, transform: `translate3d(0px, ${offset}, 0px)` }
			: { width: length, transform: `translate3d(${offset}, 0px, 0px)` };
	});

	let motion: Animation | undefined;

	/**
	 * animated：进入的面板沿标签栏的排列方向滑入并淡入（标签栏在上下时横向，在左右时纵向）
	 * 切到后面的标签从后方（右 / 下）进入，切到前面的从前方进入；离开的面板直接隐藏
	 * @param el 进入的面板
	 * @param direction 1 为向后切换，-1 为向前
	 */
	const animate = (el: HTMLElement | undefined, direction: number) => {
		const content = options.content.value as HTMLElement | undefined;
		if (!el?.animate || !content) return;
		motion?.cancel();

		const offset = `${direction * 24}px`;
		const transform = isVertical.value ? `translate3d(0px, ${offset}, 0px)` : `translate3d(${offset}, 0px, 0px)`;
		const current = el.animate(
			[{ opacity: 0, transform }, { opacity: 1, transform: 'none' }],
			{ duration: 300, easing: 'cubic-bezier(.35, 0, .25, 1)' }
		);

		motion = current;
		// 滑动期间内容区裁切溢出，页面不会出现临时的滚动条；直接改类名，不触发重新渲染
		content.classList.add('is-switching');
		// 被下一次切换取消时，由下一次负责收尾
		current.finished.catch(() => {}).then(() => {
			if (motion !== current) return;
			motion = undefined;
			content.classList.remove('is-switching');
		});
	};

	const classes = computed(() => {
		return {
			'is-animated': props.animated,
			[`is-${props.type}`]: !!props.type,
			[`is-${props.size}`]: !!props.size,
			[`is-${props.placement}`]: !!props.placement,
			'is-vertical': isVertical.value,
			[`is-${props.theme}`]: !!props.theme,
		};
	});

	const hasAnchor = computed(() => {
		return list.value.some(item => !!item.anchor);
	});

	// 渲染完成后刷新滑块并让选中项可见
	const sync = () => {
		options.refreshAfloat?.();
		options.scrollToActive?.();
	};

	/**
	 * 面板的值或标签变化、尺寸变化：同一轮只刷新一次
	 */
	let isRefreshing = false;
	const refresh = () => {
		if (isRefreshing) return;
		isRefreshing = true;
		nextTick(() => {
			isRefreshing = false;
			!instance.isUnmounted && sync();
		});
	};

	let scrollToAnchorTimer: any;
	const scrollToAnchor = (anchor: string) => {
		if (!anchor) return;
		const el = document.querySelector(anchor);
		if (!el) return;
		const scroller = getScroller(instance.vnode.el) as any;
		// 以滚动容器去掉边框与 padding 后的可视区为参照（与 Affix 的 sticky 吸附线一致）
		const viewport = getViewportRect(scroller);

		scrollIntoView(scroller, {
			duration: 250,
			from: scroller.scrollTop,
			to: scroller.scrollTop
				+ (el.getBoundingClientRect().top - viewport.top) / viewport.scale
				- (!affix || affix.props.placement !== 'bottom' ? instance.vnode.el!.offsetHeight : 0)
				// 吸附偏移取 px（MAffix 的 offset 为 750 稿）
				- (affix && affix.props.placement !== 'bottom' ? affix.getOffset() : 0)
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
		const viewport = getViewportRect(scroller);
		// 锚点在滚动内容中的位置（CSS px）
		const getElTop = (target: HTMLElement) => (target.getBoundingClientRect().top - viewport.top) / viewport.scale + scrollTop;

		for (let i = 0; i < list.value.length; i++) {
			const nav = list.value[i];
			const anchor = nav.anchor;
			if (!anchor) continue;
			const el = document.querySelector(anchor) as HTMLElement;
			if (!el) continue;
			const elTop = getElTop(el);
			const nextNav = list.value[i + 1];
			let nextElTop: number | undefined;
			if (nextNav && nextNav.anchor) {
				const nextEl = document.querySelector(nextNav.anchor) as HTMLElement;
				if (nextEl) {
					nextElTop = getElTop(nextEl);
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
		if (timer) return;

		timer = setTimeout(() => timer = null, 300);

		const nav = list.value[index];
		if (nav.disabled) return;

		currentValue.value = getTabPaneValue(nav, index);

		emit('update:modelValue', currentValue.value);
		emit('change', currentValue.value);
		emit('click', currentValue.value);

		scrollTo && scrollToAnchor(nav.anchor);
	};

	const handleRemove = (index: number) => {
		const nav = list.value[index];
		if (!nav) return;
		emit('tab-remove', getTabPaneValue(nav, index), index);
	};

	onMounted(() => {
		affix?.onScroll?.(handleAffixScroll);
	});

	onBeforeUnmount(() => {
		motion?.cancel();
		timer && clearTimeout(timer);
		affix?.offScroll?.(handleAffixScroll);
		scrollToAnchorTimer && clearTimeout(scrollToAnchorTimer);
	});

	const add = (item: any, setValue: any) => {
		if (!item) return;
		panes.set(item.props, item);
		// vnode动态时排序
		nextTick(() => {
			typeof currentValue.value === 'undefined' && (
				currentValue.value = typeof item.proxy.currentValue === 'undefined'
					? 0
					: item.proxy.currentValue
			);

			if (options.content.value) {
				const index = Array
					.from(options.content.value.children as HTMLCollection)
					.filter(i => /vcm?-tabs-pane/.test(i.className))
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

	// 选中项或标签数量变化：渲染完成后刷新；切换选中项时播放面板动画（首次选中，即原值不在列表中时不播放）
	watch(
		[() => currentValue.value, () => list.value.length],
		([v], [old]) => {
			sync();
			if (!props.animated || v === old) return;
			const from = getTabIndex(old);
			const to = getTabIndex(v);
			if (from === -1 || to === -1) return;
			animate(panes.get(list.value[to])?.vnode.el, to > from ? 1 : -1);
		},
		{ flush: 'post' }
	);

	return {
		list,
		afloatWidth,
		afloatOffset,
		currentValue,
		isVertical,
		afloatStyle,
		classes,
		refresh,

		getTabIndex,
		getTabPaneValue,
		handleChange,
		handleRemove
	};
};
