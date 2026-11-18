/** @jsxImportSource vue */

import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, defineComponent, Fragment } from 'vue';
import type { SetupContext } from 'vue';
import { Resize } from '@deot/helper-resize';
import { scrollIntoView } from '@deot/helper-dom';
import { toPx, toRem } from '@deot/vc-shared';
import { Affix as DesktopAffix } from '../affix';
import { RecycleList as DesktopRecycleList } from '../recycle-list';
import { Scroller as DesktopScroller } from '../scroller';
import { ExternalCarrier, getAxisKeys } from '../scroller/core/carrier';
import { isWindow } from '../scroller/utils';
import { findStickyIndex, getStickyTranslate } from '../scroller/core/sticky';
import { IndexBarSidebar } from './index-bar-sidebar';
import type { Props, IndexBarGroup, IndexBarValue } from './index-bar-props';

const COMPONENT_NAME = 'vc-index-bar';
const SHARED = { shared: true };
const AXIS_KEYS = getAxisKeys(true);

export interface IndexBarComponents {
	Affix: typeof DesktopAffix;
	RecycleList: typeof DesktopRecycleList;
	Scroller: typeof DesktopScroller;
}

const DESKTOP_COMPONENTS: IndexBarComponents = {
	Affix: DesktopAffix,
	RecycleList: DesktopRecycleList,
	Scroller: DesktopScroller
};

// 默认尺寸，用作虚拟列表的预估值：桌面为 px，移动端为 750 稿（与样式中的标题高、项的最小高一致）
const SIZES = {
	desktop: { title: 32, item: 40 },
	mobile: { title: 48, item: 108 }
};

// 程序化滚动结束后再屏蔽滚动驱动的高亮多久（ms）：滚动事件晚一帧到达
const LOCK_TAIL = 150;

type TitleRow = { type: 'title'; group: IndexBarGroup; groupIndex: number };
type ItemRow = { type: 'item'; group: IndexBarGroup; groupIndex: number; row: unknown; index: number };
type Row = TitleRow | ItemRow;

export type IndexBarOptions = {
	// 移动端（MIndexBar）：根节点加标记类 vcm-index-bar，尺寸由 mobile/style.scss 覆盖局部变量；数字长度为 750 稿
	mobile?: boolean;
	// 内部用到的组件，MIndexBar 传入移动端的版本（桌面端入口不引入移动端代码）
	components?: Partial<IndexBarComponents>;
};

export type IndexBarScrollToOptions = {
	// 动画时长（ms），默认 0 立即到位
	duration?: number;
};

/**
 * IndexBar 与 MIndexBar 共用
 *
 * 分组压平成一列行（标题行 + 项），普通模式直接渲染，虚拟模式交给 RecycleList，行的渲染只有一份；
 * 滚动模式同 Table：height → RecycleList 自带滚动；maxHeight → Scroller；都不设时依靠外部滚动（virtualized 时为 RecycleList fill=false）
 *
 * 吸顶标题与侧栏放在一层高度为 0 的「舞台」里，由 Affix（sticky）承载：舞台始终是真正滚动的那层内容的第一个子元素，
 * 吸附偏移、滚动链订阅、所在滚动容器都取自 Affix；舞台的实际位置就是吸附线，各模式的计算相同
 * @param props ~
 * @param context ~
 * @param options ~
 * @returns render
 */
export const useIndexBar = (
	props: Props,
	context: SetupContext<['update:modelValue', 'change']>,
	options: IndexBarOptions = {}
) => {
	const { slots, emit, expose } = context;
	const { mobile = false } = options;
	const { Affix, RecycleList, Scroller } = { ...DESKTOP_COMPONENTS, ...options.components };
	const name = mobile ? `${COMPONENT_NAME} vcm-index-bar` : COMPONENT_NAME;
	const toLength = mobile ? toRem : toPx;
	const sizes = mobile ? SIZES.mobile : SIZES.desktop;

	const root = ref<HTMLElement>();
	const content = ref<HTMLElement>(); // 普通模式的行容器
	const stage = ref<HTMLElement>();
	const sticky = ref<HTMLElement>();
	const affix = shallowRef<any>();
	const list = shallowRef<any>(); // RecycleList 实例

	const current = ref<IndexBarValue | undefined>(props.modelValue ?? props.data[0]?.value);
	// 吸附线所在的分组（下标）：吸顶标题显示它，始终随滚动；current 在侧栏、程序化滚动期间不跟随滚动
	const stickyIndex = ref(0);

	const usesList = computed(() => !!props.height || (!props.maxHeight && props.virtualized));

	// 压平：标题行 + 项；titleRows[i] 为第 i 个分组标题所在的行号
	const flat = computed(() => {
		const rows: Row[] = [];
		const titleRows: number[] = [];
		props.data.forEach((group, groupIndex) => {
			titleRows.push(rows.length);
			rows.push({ type: 'title', group, groupIndex });
			(group.children || []).forEach((row, index) => {
				rows.push({ type: 'item', group, groupIndex, row, index });
			});
		});
		return { rows, titleRows };
	});

	const groupIndexOf = (value?: IndexBarValue) => props.data.findIndex(group => group.value === value);

	const setCurrent = (value: IndexBarValue) => {
		if (value === current.value) return;
		current.value = value;
		emit('update:modelValue', value);
		emit('change', value);
	};

	// -------------------------------------------------------------------
	// 标题位置：以行容器顶部为原点的 CSS px
	// -------------------------------------------------------------------

	const getContentElement = (): HTMLElement | undefined => {
		if (!usesList.value) return content.value;
		return root.value?.querySelector<HTMLElement>('.vc-recycle-list__content') || undefined;
	};

	// 普通模式：首次需要时量出全部标题并缓存，行容器尺寸或数据变化时作废
	let titleOffsets: number[] | null = null;
	const measureTitles = (el: HTMLElement) => {
		const rect = el.getBoundingClientRect();
		const scale = (el.offsetHeight && rect.height / el.offsetHeight) || 1;
		const titles = el.querySelectorAll<HTMLElement>(':scope > .vc-index-bar__title');
		titleOffsets = Array.from(titles, title => (title.getBoundingClientRect().top - rect.top) / scale);
		return titleOffsets;
	};

	/**
	 * 第 index 个分组标题的位置；虚拟模式读 RecycleList 的排版结果（设置了 estimateSize，全部行一次构建，均有位置）
	 * @param index 分组下标
	 * @param el 行容器
	 * @returns 位置，未知时为 undefined
	 */
	const getTitleOffset = (index: number, el: HTMLElement) => {
		if (usesList.value) {
			const raw = list.value?.store?.states.rebuildData[flat.value.titleRows[index]]?.raw;
			return raw && raw.position >= 0 ? raw.position as number : undefined;
		}
		return (titleOffsets || measureTitles(el))[index];
	};

	// -------------------------------------------------------------------
	// 滚动驱动：当前分组、吸顶标题的顶出、侧栏可见段
	// -------------------------------------------------------------------

	let lockTimer: any;
	let dragging = false;
	const isLocked = () => dragging || !!lockTimer;
	const lock = (duration: number) => {
		lockTimer && clearTimeout(lockTimer);
		lockTimer = setTimeout(() => lockTimer = null, duration + LOCK_TAIL);
	};

	// 已写到 DOM 的值：吸顶标题不换元素（换组只换内容），写过的 transform / is-active 保留，只在变化时重写
	let visibleSize = -1;
	let stickyTranslate = NaN;
	let stickyActive: boolean | null = null;
	watch(sticky, () => {
		stickyTranslate = NaN;
		stickyActive = null;
	});

	/**
	 * 先集中读几何，再写样式；只在值变化时写
	 */
	const update = () => {
		const el = getContentElement();
		const stageEl = stage.value;
		const rootEl = root.value;
		if (!el || !stageEl || !rootEl || !props.data.length) return;

		const rect = el.getBoundingClientRect();
		// 未参与布局（display: none、尚未挂到文档）：不计算，避免全部位置为 0 时误选最后一组
		if (!rect.height) return;
		const stageRect = stageEl.getBoundingClientRect();
		const rootRect = rootEl.getBoundingClientRect();
		const scale = (el.offsetHeight && rect.height / el.offsetHeight) || 1;
		const scroller = affix.value?.getScroller?.();
		const viewportBottom = !scroller || isWindow(scroller)
			? window.innerHeight
			: (scroller as HTMLElement).getBoundingClientRect().bottom;

		// 吸附线在行容器中的位置：舞台的自然位置就是行容器顶部，被 sticky 带下来的距离即滚过的距离
		const line = (stageRect.top - rect.top) / scale;
		const active = line > 0.5;
		// 允许 1px 误差：跳转到的标题恰好停在吸附线上
		const index = Math.max(0, findStickyIndex(props.data.length, i => getTitleOffset(i, el), line + 1));
		const next = index + 1 < props.data.length ? getTitleOffset(index + 1, el) : rect.height / scale;
		const translate = getStickyTranslate(next, line, sticky.value?.offsetHeight || 0);
		const visible = Math.max(0, (Math.min(viewportBottom, rootRect.bottom) - stageRect.top) / scale);

		stickyIndex.value = index;
		if (sticky.value) {
			if (translate !== stickyTranslate) {
				stickyTranslate = translate;
				sticky.value.style.transform = translate ? `translateY(${translate}px)` : '';
			}
			if (active !== stickyActive) {
				stickyActive = active;
				sticky.value.classList.toggle('is-active', active);
			}
		}
		if (Math.abs(visible - visibleSize) >= 0.5) {
			visibleSize = visible;
			stageEl.style.setProperty('--vc-index-bar-visible', `${visible}px`);
		}

		!isLocked() && setCurrent(props.data[index].value);
	};

	/**
	 * 滚动到分组：标题停在吸附线上；滚动期间（及之后一小段）不按滚动改当前分组，
	 * 到不了吸附线的分组（列表末尾）也保持为指定的分组
	 * @param value 分组的 value
	 * @param options$ ~
	 */
	const jumpTo = (value: IndexBarValue, options$: IndexBarScrollToOptions = {}) => {
		const { duration = 0 } = options$;
		const index = groupIndexOf(value);
		const el = getContentElement();
		const scroller = affix.value?.getScroller?.();
		if (index < 0 || !el || !scroller) return;
		const offset = getTitleOffset(index, el);
		if (offset === undefined) return;

		const carrier = new ExternalCarrier(scroller, AXIS_KEYS);
		const target = Math.min(
			Math.max(0, carrier.getElementBounds(el).start + offset - (affix.value.getOffset?.() || 0)),
			Math.max(0, carrier.scrollSize - carrier.clientSize)
		);

		lock(duration);
		if (!duration) {
			carrier.setMainOffset(target);
		} else if (carrier.scroller) {
			(carrier.scroller as any).scrollTo({ y: target, duration });
		} else {
			scrollIntoView(carrier.target, { from: carrier.mainOffset, to: target, duration });
		}
	};

	// 对外：滚动并设为当前分组（触发 update:modelValue / change）
	const scrollTo = (value: IndexBarValue, options$?: IndexBarScrollToOptions) => {
		if (groupIndexOf(value) < 0) return;
		jumpTo(value, options$);
		setCurrent(value);
	};

	const refresh = () => {
		titleOffsets = null;
		list.value?.refreshLayout?.();
		update();
	};

	// -------------------------------------------------------------------
	// 订阅：滚动与尺寸变化都由舞台的 Affix 回调；普通模式另外监听行容器尺寸
	// -------------------------------------------------------------------

	watch(affix, (v, old) => {
		old?.offScroll?.(update);
		v?.onScroll?.(update, { first: true });
	}, { flush: 'post' });

	const handleContentResize = () => {
		titleOffsets = null;
		update();
	};
	watch(content, (v, old) => {
		old && Resize.off(old, handleContentResize);
		v && Resize.on(v, handleContentResize, SHARED);
	}, { flush: 'post' });

	watch(flat, () => {
		titleOffsets = null;
		if (groupIndexOf(current.value) < 0 && props.data.length) {
			setCurrent(props.data[0].value);
		}
	}, { flush: 'post' });

	watch(() => props.modelValue, (v) => {
		if (v === undefined || v === current.value) return;
		current.value = v;
		jumpTo(v);
	});

	// 初始分组不是第一个时，挂载后滚动到它
	onMounted(() => {
		const { modelValue } = props;
		if (modelValue === undefined || modelValue === props.data[0]?.value) return;
		jumpTo(modelValue);
	});

	onBeforeUnmount(() => {
		affix.value?.offScroll?.(update);
		content.value && Resize.off(content.value, handleContentResize);
		lockTimer && clearTimeout(lockTimer);
	});

	expose({ scrollTo, refresh });

	// -------------------------------------------------------------------
	// 渲染
	// -------------------------------------------------------------------

	const renderTitleContent = (group: IndexBarGroup) => (
		slots.title ? slots.title({ group }) : (group.label ?? group.value)
	);

	const renderRow = (row: Row) => {
		if (row.type === 'title') {
			return (<div class="vc-index-bar__title">{ renderTitleContent(row.group) }</div>);
		}
		if (slots.default) return slots.default({ row: row.row, group: row.group, index: row.index });
		const label = row.row && typeof row.row === 'object' ? (row.row as any).label : row.row;
		return (<div class="vc-index-bar__item">{ label }</div>);
	};

	const estimateSize = ({ row }: { row: Row }) => {
		if (row.type === 'title') return sizes.title;
		const { estimateSize: size } = props;
		if (typeof size === 'function') return size({ row: row.row, group: row.group, index: row.index });
		return size ?? sizes.item;
	};

	const handleSelect = (value: IndexBarValue) => scrollTo(value);

	// 舞台单独成组件：吸顶分组、当前分组变化只重绘舞台，不重绘整列行
	const Stage = defineComponent({
		name: 'vc-index-bar-stage',
		setup: () => () => renderStage()
	});

	const renderStage = () => {
		const group = props.data[stickyIndex.value];
		return (
			<Affix ref={affix} fixed={false} offset={props.offset} zIndex={2} class="vc-index-bar__affix">
				<div ref={stage} class="vc-index-bar__stage">
					{
						props.sticky && group && (
							<div ref={sticky} class="vc-index-bar__title vc-index-bar__sticky">
								{ renderTitleContent(group) }
							</div>
						)
					}
					<IndexBarSidebar
						data={props.data}
						modelValue={current.value}
						tip={props.tip}
						onSelect={handleSelect}
						onDragstart={() => { dragging = true; }}
						onDragend={() => {
							dragging = false;
							lock(0);
						}}
					>
						{{
							item: slots.sidebar,
							tip: slots.tip
						}}
					</IndexBarSidebar>
				</div>
			</Affix>
		);
	};

	// 行尺寸校正后位置变了，吸顶与当前分组跟着更新（RecycleList 的 emits 写作 'row-resize'，JSX 类型只认 onRow-resize，经展开传入）
	const listListeners = { onRowResize: update };
	const renderList = (fill: boolean) => (
		<RecycleList
			ref={list}
			class="vc-index-bar__list"
			data={flat.value.rows}
			disabled={true}
			fill={fill}
			estimateSize={estimateSize}
			{...listListeners}
		>
			{{
				default: ({ row }: { row: Row }) => renderRow(row),
				header: fill ? () => <Stage /> : undefined
			}}
		</RecycleList>
	);

	const renderContent = () => (
		<div ref={content} class="vc-index-bar__content">
			{
				flat.value.rows.map(row => (
					<Fragment key={row.type === 'title' ? `t${row.groupIndex}` : `${row.groupIndex}-${row.index}`}>
						{ renderRow(row) }
					</Fragment>
				))
			}
		</div>
	);

	return () => {
		const { height, maxHeight } = props;
		if (height) {
			return (
				<div ref={root} class={[name, 'is-scrollable']} style={{ height: typeof height === 'number' ? toLength(height) : height }}>
					{ renderList(true) }
				</div>
			);
		}
		if (maxHeight) {
			return (
				<div ref={root} class={[name, 'is-scrollable']}>
					<Scroller class="vc-index-bar__scroller" maxHeight={maxHeight}>
						<Stage />
						{ renderContent() }
					</Scroller>
				</div>
			);
		}
		return (
			<div ref={root} class={name}>
				<Stage />
				{ props.virtualized ? renderList(false) : renderContent() }
			</div>
		);
	};
};
