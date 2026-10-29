/** @jsxImportSource vue */

import { computed, ref, shallowRef, getCurrentInstance, onBeforeUnmount } from 'vue';
import type { VNode } from 'vue';
import { Resize } from '@deot/helper-resize';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';
import { Icon } from '../icon';
import { useHoverPopover } from '../popover/use-hover-popover';
import { VcInstance } from '../vc';
import { useResponsive } from '../grid/hooks/use-responsive';
import { layout, resolveTracks, resolveSpan, getCellStyle } from '../grid/utils';
import type { GridLayoutCell } from '../grid/utils';
import { parse, getValue, isEmpty } from './utils';
import type { DescriptionsParsedGroup, DescriptionsParsedItem } from './utils';
import { renderBuiltin } from './render-value';
import type { Clipboard } from '../clipboard';
import type { Props } from './descriptions-props';
import type { DescriptionsContext, DescriptionsRow } from './types';

const SHARED = { shared: true };

interface LaidItem {
	item: DescriptionsParsedItem;
	context: DescriptionsContext;
	cell: GridLayoutCell;
}

/**
 * Descriptions与MDescriptions共用；两者只有复制提示不同（Clipboard / MClipboard）
 * @param options ~
 * @param options.Clipboard copy类型使用的复制组件
 * @returns render
 */
export const useDescriptions = (options: { Clipboard: typeof Clipboard }) => {
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;
	const { slots } = instance;
	const current = ref<HTMLElement>();
	const responsive = useResponsive(current);
	const popover = useHoverPopover();

	const tracks = computed(() => resolveTracks(responsive.resolve(props.columns, 24)));

	// 未设置span时每行3项
	const defaultSpan = computed(() => responsive.resolve(props.span, Math.max(1, Math.floor(tracks.value.count / 3))));

	const classes = computed(() => {
		return [
			'vc-descriptions',
			`is-${props.theme}`,
			`is-${props.size}`,
			`is-${props.labelPosition}`,
			{ 'is-inline': props.inline }
		];
	});

	const bodyStyle = computed(() => ({ gridTemplateColumns: tracks.value.template }));

	const colon = computed(() => {
		if (props.labelPosition === 'top' || props.theme === 'border' || props.colon === false) return '';
		return props.colon === true ? ':' : props.colon;
	});

	// 标签在左侧时labelWidth才生效
	const isLabelAside = computed(() => props.labelPosition !== 'top' && !props.inline);
	const isAutoWidth = computed(() => isLabelAside.value && props.labelWidth === 'auto');

	/**
	 * labelWidth为auto：标签内容包一层，监听它的尺寸（不受标签格宽度影响），按项的下标记下自然宽度（含标签格的内边距与边框）；
	 * 渲染时同一列起点的标签取其中最宽的。文字、插槽内容、字体、字号变化都由尺寸监听带回
	 */
	const naturalWidths = shallowRef<Record<number, number>>({});
	const indexOf = new WeakMap<Element, number>();
	const handleLabelResize = (entries: ResizeObserverEntry[]) => {
		const next = { ...naturalWidths.value };
		let changed = false;
		entries.forEach(({ target }) => {
			const index = indexOf.get(target);
			if (index === undefined || !target.parentElement) return;
			const style = window.getComputedStyle(target.parentElement);
			const extra = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']
				.reduce((sum, key) => sum + (Number.parseFloat(style[key]) || 0), 0);
			const width = Math.ceil(target.getBoundingClientRect().width + extra);
			next[index] !== width && (next[index] = width, changed = true);
		});
		changed && (naturalWidths.value = next);
	};
	const observeLabel = (el: HTMLElement | null, index: number) => {
		if (!el) return;
		indexOf.set(el, index);
		Resize.on(el, handleLabelResize, SHARED);
	};
	onBeforeUnmount(() => Resize.disconnect(handleLabelResize));

	// 本次渲染中各列起点的标签宽度，由renderContent在渲染标签前算好
	let columnWidths: Record<number, number> = {};
	const getLabelWidthStyle = (start: number) => {
		if (!isLabelAside.value) return null;
		const { labelWidth } = props;
		const width = typeof labelWidth === 'number' ? labelWidth : isAutoWidth.value && columnWidths[start];
		return width ? { width: `${width}px` } : null;
	};

	const handleTooltip = (e: MouseEvent, context: DescriptionsContext) => {
		const { tooltip } = context.row;
		popover.open(e.currentTarget as Element, {
			theme: 'dark',
			autoWidth: false,
			// 函数由这里调用：弹层只拿得到内容，拿不到当前项
			content: typeof tooltip === 'function' ? () => tooltip(context) : tooltip
		});
	};

	/**
	 * 当前项，补上默认值；value按显式传值 → prop取值
	 * @param item ~
	 * @param index ~
	 * @returns ~
	 */
	const getContext = (item: DescriptionsParsedItem, index: number): DescriptionsContext => {
		const { row: raw } = item;
		const row = {
			...raw,
			type: raw.type || 'text',
			span: responsive.resolve(raw.span, defaultSpan.value)
		} as DescriptionsRow;
		const value = raw.value === undefined || typeof raw.value === 'function' ? getValue(props.data, raw.prop) : raw.value;
		return { value, row, index, data: props.data };
	};

	const renderLabel = ({ item, context, cell }: LaidItem) => {
		const { row } = context;
		const render = item.slots.label || slots.label;
		const hasLabel = !!render || hasCustomerValue(row.label);
		const content = [
			hasLabel && <Customer tag="span" render={render || row.label} row={row} index={context.index} data={context.data} />,
			row.tooltip && (
				<Icon
					type="o-info"
					class="vc-descriptions__tooltip"
					// @ts-ignore 落在Icon的根节点上
					onMouseenter={(e: MouseEvent) => handleTooltip(e, context)}
				/>
			),
			hasLabel && colon.value && <span class="vc-descriptions__colon">{ colon.value }</span>
		];
		return (
			<dt
				class={['vc-descriptions__label', props.labelClass, row.labelClass]}
				style={[getLabelWidthStyle(cell.start), props.labelStyle, row.labelStyle]}
			>
				{
					isAutoWidth.value
						? <span ref={(el: any) => observeLabel(el, context.index)} class="vc-descriptions__label-content">{ content }</span>
						: content
				}
			</dt>
		);
	};

	/**
	 * 值：插槽 / 函数形式的value → 全局renderValue → 内置类型；为空时显示placeholder（插槽与函数不判断）
	 * @param item ~
	 * @param context ~
	 * @returns ~
	 */
	const renderValue = (item: DescriptionsParsedItem, context: DescriptionsContext) => {
		const { row, value } = context;
		const render = item.slots.default || slots.value || (typeof row.value === 'function' ? row.value : null);
		let content: any = render ? <Customer render={render} {...context} /> : null;
		if (!render && !isEmpty(value)) {
			const custom = VcInstance.options.Descriptions?.renderValue;
			// 返回VNode时使用它，返回false或空值时使用内置类型
			content = (typeof custom === 'function' && custom({ ...context, instance }))
				|| renderBuiltin(context, { size: props.size, instance, Clipboard: options.Clipboard });
		}
		if (!content) {
			return <Customer tag="span" render={props.placeholder} {...context} />;
		}
		return [
			hasCustomerValue(row.prefix) && <Customer tag="span" render={row.prefix} {...context} />,
			content as VNode,
			hasCustomerValue(row.suffix) && <Customer tag="span" render={row.suffix} {...context} />
		];
	};

	/**
	 * 一组按24格（或轨道模板）分行，每行最后一项补满
	 * @param group ~
	 * @param offset 该组第一项在全部项中的下标
	 * @returns 可见的项及其位置
	 */
	const layoutGroup = (group: DescriptionsParsedGroup, offset: number) => {
		const contexts = group.items
			.map((item, i) => ({ item, context: getContext(item, offset + i) }))
			.filter(({ context }) => !context.row.hidden);
		const result = layout({
			columns: tracks.value.count,
			fill: true,
			items: contexts.map(({ context }) => {
				const { rowspan, colspan, hidden } = resolveSpan(props.getSpan?.(context));
				return { span: colspan ?? context.row.span, rowspan, hidden };
			})
		});
		const items = contexts
			.map((v, i) => ({ ...v, cell: result.cells[i] }))
			.filter(({ cell }) => !cell.hidden);
		return { group, items, rows: result.rows };
	};

	const renderItem = (laid: LaidItem, rows: number) => {
		const { item, context, cell } = laid;
		const { row } = context;
		return (
			<div
				key={context.index}
				class={[
					'vc-descriptions__item',
					row.class,
					{
						'is-last-column': cell.start + cell.span >= tracks.value.count,
						'is-last-row': cell.row + cell.rowspan >= rows
					}
				]}
				style={[row.style, getCellStyle(cell)]}
			>
				{ renderLabel(laid) }
				<dd
					class={['vc-descriptions__value', props.contentClass, row.contentClass]}
					style={[props.contentStyle, row.contentStyle]}
				>
					{ renderValue(item, context) }
				</dd>
			</div>
		);
	};

	const renderGroup = ({ group, items, rows }: ReturnType<typeof layoutGroup>) => {
		const hasLabel = !!group.slots.label || hasCustomerValue(group.label);
		return (
			<div class={['vc-descriptions__group', group.class]} style={group.style}>
				{
					hasLabel && (
						<div class="vc-descriptions__group-label">
							<Customer render={group.slots.label || group.label} />
						</div>
					)
				}
				<dl class="vc-descriptions__body" style={bodyStyle.value}>
					{ items.map(laid => renderItem(laid, rows)) }
				</dl>
			</div>
		);
	};

	const renderHeader = () => {
		if (!slots.title && !slots.extra && !hasCustomerValue(props.title)) return null;
		return (
			<div class="vc-descriptions__header">
				<div class="vc-descriptions__title">
					<Customer render={slots.title || props.title} />
				</div>
				{ slots.extra && <div class="vc-descriptions__extra">{ slots.extra() }</div> }
			</div>
		);
	};

	// 先排好所有组：auto时各列的标签宽度要看全部组
	const renderContent = () => {
		let offset = 0;
		const groups = parse(props.options, slots.default?.()).map((group) => {
			const laid = layoutGroup(group, offset);
			offset += group.items.length;
			return laid;
		});
		columnWidths = {};
		isAutoWidth.value && groups.forEach(({ items }) => items.forEach(({ context, cell }) => {
			const width = naturalWidths.value[context.index] || 0;
			width > (columnWidths[cell.start] || 0) && (columnWidths[cell.start] = width);
		}));
		return <div class="vc-descriptions__content">{ groups.map(renderGroup) }</div>;
	};

	return () => {
		return (
			<div ref={current} class={classes.value}>
				{ renderHeader() }
				{ renderContent() }
			</div>
		);
	};
};
