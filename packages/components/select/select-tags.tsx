/** @jsxImportSource vue */

import { defineComponent, ref, shallowRef, computed, watch, onMounted, onUpdated, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import { Resize } from '@deot/helper-resize';
import { Tag } from '../tag/index';
import { Scroller } from '../scroller/index';
import { useHoverPopover } from '../popover/use-hover-popover';
import { fitTags } from './utils';
import type { FitTagsResult } from './utils';

const COMPONENT_NAME = 'vc-select-tags';

// tag 外宽的下限（左右内边距 16 + 外边距 4，空文字且不可关闭），用于限制测量的候选数量
const MIN_TAG_WIDTH = 20;

export interface SelectTag {
	[key: string]: any;
	key: string | number;
	label: string;
}

interface Measured {
	key: string;
	closable: boolean;
	total: number;
	labels: string[];
	widths: number[];
	plusWidth: number;
	marginX: number;
}

const toNumber = (v: string) => parseFloat(v) || 0;

/**
 * Select / TreeSelect 多选时的标签区：按可用宽度与行数自适应折叠
 */
export const SelectTags = defineComponent({
	name: COMPONENT_NAME,
	props: {
		data: {
			type: Array as PropType<SelectTag[]>,
			default: () => ([])
		},
		maxTags: Number,
		maxTagLines: {
			type: Number,
			default: 1
		},
		closable: {
			type: Boolean,
			default: false
		}
	},
	emits: ['close'],
	setup(props, { emit }) {
		const wrapper = ref<HTMLElement>();
		const measure = ref<HTMLElement>();

		// 容器可用宽度；为 0 时（未布局 / display: none）不测量，按 maxTags 显示
		const width = ref(0);
		const measured = shallowRef<Measured | null>(null);

		const total = computed(() => props.data.length);
		const measurable = computed(() => props.maxTagLines > 0 && width.value > 0 && total.value > 0);

		// 候选数量：maxTags 为上限；测量时再按行数估算上限，避免测量过多 tag
		const limit = computed(() => {
			const max = props.maxTags ? Math.min(props.maxTags, total.value) : total.value;
			if (!measurable.value) return max;
			return Math.min(max, props.maxTagLines * Math.ceil(width.value / MIN_TAG_WIDTH) + 1);
		});

		const labels = computed(() => props.data.slice(0, limit.value).map(i => i.label));

		// 测量结果可用：关闭按钮与总数（影响 +N 宽度）一致，且候选文字是已测量文字的前缀（如变窄后候选减少时直接复用）
		const settled = computed(() => {
			const m = measured.value;
			if (!measurable.value) return true;
			return !!m
				&& m.closable === props.closable
				&& m.total === total.value
				&& labels.value.length <= m.labels.length
				&& labels.value.every((label, i) => label === m.labels[i]);
		});

		const fit = computed<FitTagsResult>((previous) => {
			if (!measurable.value) return { count: limit.value };
			// 等待测量的中间态：沿用上次结果，避免节点被增删重建（如折叠 tag 重建后，其弹层的 triggerEl 失效而错位）
			if (!settled.value) {
				return previous
					? { ...previous, count: Math.min(previous.count, limit.value) }
					: { count: limit.value };
			}
			const m = measured.value!;
			return fitTags({
				widths: m.widths.slice(0, limit.value),
				width: width.value,
				lines: props.maxTagLines,
				plusWidth: m.plusWidth,
				total: total.value
			});
		});

		const refreshWidth = () => {
			const el = wrapper.value;
			if (!el) return;
			const style = getComputedStyle(el);
			const v = el.getBoundingClientRect().width - toNumber(style.paddingLeft) - toNumber(style.paddingRight);
			width.value = Math.max(Math.floor(v), 0);
		};

		// 按测量层渲染时的依据（data-key）记录结果，而非当前状态：二者在 flush 中可能不一致
		const refreshWidths = () => {
			const el = measure.value;
			const key = el?.dataset.key;
			if (!el || !key || key === measured.value?.key) return;

			const [closable, count, texts] = JSON.parse(key);
			const items = Array.from(el.children) as HTMLElement[];
			const plus = items.pop()!;
			const style = getComputedStyle(plus);
			const marginX = toNumber(style.marginLeft) + toNumber(style.marginRight);
			const getOuterWidth = (item: HTMLElement) => Math.ceil(item.getBoundingClientRect().width + marginX);

			measured.value = {
				key,
				closable,
				total: count,
				labels: texts,
				widths: items.map(getOuterWidth),
				plusWidth: getOuterWidth(plus),
				marginX
			};
		};

		const popover = useHoverPopover();
		const hiddenTags = computed(() => props.data.slice(fit.value.count));

		// 被截断的 tag：hover 展示完整内容（content 为函数，按文本渲染）
		const handleTagEnter = (e: MouseEvent, item: SelectTag) => {
			const el = e.currentTarget as HTMLElement;
			const span = el.querySelector('.vc-tag__wrapper > span');
			if (!span || span.scrollWidth <= span.clientWidth) return;
			popover.open(el, {
				portalClass: 'vc-select-tags__tip',
				content: () => item.label
			});
		};

		// 列表内移除时锁定列表当前尺寸（本次打开期间只增不减）
		// 否则列表变小后弹层（placement: top）随之收缩、移位，鼠标落到弹层外触发 mouseleave 而关闭
		const listMinSize = ref<{ width: number; height: number } | null>(null);

		const handleListClose = (e: MouseEvent, item: SelectTag) => {
			const list = (e.target as HTMLElement).closest('.vc-select-tags__list');
			if (list) {
				const rect = list.getBoundingClientRect();
				listMinSize.value = { width: rect.width, height: rect.height };
			}
			emit('close', item);
		};

		// 折叠 tag：hover 展示被折叠的 tag 列表，可在列表内移除
		const handleCollapseEnter = (e: MouseEvent) => {
			const el = e.currentTarget as HTMLElement;
			// 列表仍在显示时（如从列表移回折叠 tag）不重建，保留锁定的尺寸
			if (popover.isActive(el)) return;
			listMinSize.value = null;
			popover.open(el, {
				portalClass: ['is-padding-none', 'vc-select-tags__popover'],
				content: () => (
					<Scroller class="vc-select-tags__scroller">
						<div
							class="vc-select-tags__list"
							style={
								listMinSize.value
									? { minWidth: `${listMinSize.value.width}px`, minHeight: `${listMinSize.value.height}px` }
									: void 0
							}
						>
							{
								hiddenTags.value.map((item) => {
									return (
										<Tag
											key={item.key}
											closable={props.closable}
											onClose={(event: MouseEvent) => handleListClose(event, item)}
										>
											{ item.label }
										</Tag>
									);
								})
							}
						</div>
					</Scroller>
				)
			});
		};

		// 移除 tag 后节点消失，不会再触发 mouseleave，先关闭弹层
		const handleClose = (item: SelectTag) => {
			popover.close();
			emit('close', item);
		};

		// 被折叠的 tag 全部移除（或全部可显示）时关闭列表；测量结果过期时的中间态不处理
		watch(
			() => settled.value && !hiddenTags.value.length,
			v => v && popover.close()
		);

		// 在本组件 DOM 更新后执行（在绘制前）
		// 不用 post watcher：其他 app 在 flush 中卸载（如关闭弹层）会提前执行 post 回调，此时 DOM 尚未更新
		onUpdated(() => {
			refreshWidths();
			// 触发弹层的 tag 被移除（如外部修改值、变窄后被折叠）时关闭弹层
			popover.sync();
		});

		onMounted(() => {
			refreshWidth();
			wrapper.value && Resize.on(wrapper.value, refreshWidth);
		});

		onBeforeUnmount(() => {
			wrapper.value && Resize.off(wrapper.value, refreshWidth);
		});

		return () => {
			const { count, shrink } = fit.value;
			const rest = total.value - count;
			// 为折叠 tag 让位的最后一个 tag
			const shrinkStyle = typeof shrink === 'number'
				? { maxWidth: `${Math.max(shrink - (measured.value?.marginX || 0), 0)}px` }
				: void 0;
			return (
				<div
					ref={wrapper}
					class={[{ 'is-nowrap': props.maxTagLines === 1 }, 'vc-select-tags']}
				>
					{
						props.data.slice(0, count).map((item, index) => {
							return (
								<Tag
									key={item.key}
									closable={props.closable}
									style={index === count - 1 ? shrinkStyle : void 0}
									// @ts-ignore
									onMouseenter={(e: MouseEvent) => handleTagEnter(e, item)}
									onClose={() => handleClose(item)}
								>
									{ item.label }
								</Tag>
							);
						})
					}
					{
						rest > 0 && (
							<Tag
								key="collapse"
								// @ts-ignore
								onMouseenter={handleCollapseEnter}
							>
								{ `+${rest}...` }
							</Tag>
						)
					}
					{
						// 测量层：仅在待测量时渲染，测量后移除
						measurable.value && !settled.value && (
							<div
								ref={measure}
								class="vc-select-tags__measure"
								data-key={JSON.stringify([props.closable, total.value, labels.value])}
								aria-hidden="true"
							>
								{
									labels.value.map((label, index) => {
										return (
											<Tag key={index} closable={props.closable}>
												{ label }
											</Tag>
										);
									})
								}
								<Tag>{ `+${total.value}...` }</Tag>
							</div>
						)
					}
				</div>
			);
		};
	}
});
