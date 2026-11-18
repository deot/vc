/** @jsxImportSource vue */

import { computed, defineComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import { MIcon } from '../../icon/index.m';
import { MInputSearch } from '../../input/index.m';
import { MSpin } from '../../spin/index.m';
import { MCustomer } from '../../customer/index.m';
import { MRecycleList } from '../../recycle-list/index.m';
import { useLocale } from '../../locale';
import {
	createSearchRegex,
	flattenData,
	getLabel,
	getSelectRows,
	isMaxReached,
	isMultiple,
	toCurrentValue,
	toModelValue
} from '../utils';
import { renderHighlight } from '../select-search/highlight';
import { SelectList } from '../select-list';
import { findStickyIndex, getStickyTranslate } from '../../scroller/core/sticky';
import type { SelectListExposed } from '../select-list';
import { MSelectSummary } from './select-summary';
import { useRemoteSearch } from './use-remote-search';
import { useSelectedCache } from '../hooks/use-select';
import { props as selectViewProps } from './select-view-props';
import type { SelectRow, TreeData, TreeValue } from '../utils';

const COMPONENT_NAME = 'vcm-select-view';

/**
 * select 事件的参数：每次点选一项时触发
 */
export interface MSelectSelectPayload {
	row: TreeData;
	value: TreeValue;
	// 点选后该项是否为选中
	selected: boolean;
}

export const MSelectView = defineComponent({
	name: COMPONENT_NAME,
	props: selectViewProps,
	emits: ['update:modelValue', 'change', 'select', 'clear'],
	setup(props, { emit, slots, expose }) {
		const { t } = useLocale();
		const formItem = inject<any>('vc-form-item', {});

		// 选中的值
		const values = ref<TreeValue[]>([]);
		const keyword = ref('');
		// 行列表：滚动、定位与行的位置都经它
		const selectList = ref<SelectListExposed>();
		// 吸顶的分组标题：常驻的节点，分组、显隐与位移都直接写在节点上，不触发渲染
		const sticky = ref<HTMLElement>();

		const multiple = computed(() => isMultiple(props.max));
		const selected = computed(() => new Set(values.value));
		const isFull = computed(() => isMaxReached(props.max, values.value.length));

		// 远程搜索：数据为 loadData 的结果，见 useRemoteSearch
		const remote = useRemoteSearch(props, keyword);
		const data = computed(() => remote.getData() as TreeData[]);

		// 本地按文字过滤，远程搜索时同样生效（同桌面端；跳过过滤的选项设 filterable: false）
		const regex = computed(() => createSearchRegex(props.searchable ? keyword.value : ''));
		const rows = computed(() => getSelectRows(data.value, regex.value));
		// 分组标题所在的行与分组结束的行（其后第一行，没有时为行数），供吸顶标题使用；没有分组时为空
		const groups = computed(() => {
			const titles: number[] = [];
			const ends: number[] = [];
			rows.value.forEach((row, i) => {
				if (!row.group) return;
				titles.push(i);
				ends.push(i + row.size! + 1);
			});
			return { titles, ends };
		});
		// 铺平的选项（含分组内的），用于查找已选项的文字
		const source = computed(() => flattenData(data.value, { parent: true, cascader: true }));

		const isDisabled = (row: TreeData) => !!row.disabled || (isFull.value && !selected.value.has(row.value));

		// 每次提交都是新数组，回传的值直接解析
		watch(
			() => props.modelValue,
			(v) => {
				values.value = toCurrentValue(v, props);
			},
			{ immediate: true }
		);

		// 已选项的文字：远程搜索的结果里没有时沿用上次查到的；与触发区共用记录表（经 Portal 传入时为响应式代理，取原始对象）
		const getCached = useSelectedCache<string>(
			remote.isRemote,
			props.selectedLabels && (toRaw(props.selectedLabels) as Map<unknown, string>)
		);
		const getLabels = () => {
			const found = getCached(values.value, v => getLabel(source.value, v) as string);
			return values.value.map(v => found.get(v) ?? '');
		};

		const sync = () => {
			// 发出副本：外部持有的数组与视图内的值互不影响
			const value = toModelValue(values.value.slice(), props);
			const labels = getLabels();
			emit('update:modelValue', value, labels);
			emit('change', value, labels);
			props.allowDispatch && formItem?.change?.(value);
		};

		/**
		 * 点选一项：单选时替换（点已选中的项不变）；多选时切换，选满后未选中的项不可点
		 * @param row ~
		 */
		const handleSelect = (row: TreeData) => {
			if (isDisabled(row)) return;
			const has = selected.value.has(row.value);
			if (!multiple.value) {
				if (!has) {
					values.value = [row.value];
					sync();
				}
			} else {
				values.value = has
					? values.value.filter(v => v !== row.value)
					: [...values.value, row.value];
				sync();
			}
			emit('select', { row, value: row.value, selected: multiple.value ? !has : true } as MSelectSelectPayload);
		};

		// 点击列表：按行上的 data-index 找到该项（整个列表一个监听）
		const handleOptionsClick = (e: MouseEvent) => {
			const el = (e.target as Element).closest<HTMLElement>('.vcm-select-view__option');
			const row = el && rows.value[+el.dataset.index!];
			row && !row.group && handleSelect(row.item);
		};

		// 清空：先 clear 再提交空值（同桌面端）
		const clear = () => {
			values.value = [];
			emit('clear');
			sync();
		};

		// 第一个已选项滚到列表中间
		const scrollIntoSelected = () => {
			const index = rows.value.findIndex(row => !row.group && selected.value.has(row.item.value));
			index !== -1 && selectList.value?.scrollToIndex(index, 'center');
		};

		/**
		 * 吸顶的分组标题：一个浮层盖在列表顶部（虚拟列表中标题行会被回收，不能用 position: sticky）
		 * 	- 按标题在列表中的位置与可视区顶边计算当前分组与顶出位移，算法同 IndexBar（scroller/core/sticky）
		 * 	- 顶边越过分组的结束位置（分组之后是顶层选项）时不显示
		 * 	- 滚动时每帧最多算一次；只在值变化时写节点
		 */
		let frame = 0;
		let stickyIndex = -2;
		let stickyTranslate = 0;
		const updateSticky = () => {
			frame = 0;
			const el = sticky.value;
			const list = selectList.value;
			const { titles, ends } = groups.value;
			if (!el || !list || !titles.length) return;
			const line = list.getScrollLine();
			let index = findStickyIndex(titles.length, i => list.getRowOffset(titles[i]), line);
			const end = index === -1 ? undefined : list.getRowOffset(ends[index]);
			end !== undefined && line >= end && (index = -1);
			if (index !== stickyIndex) {
				stickyIndex = index;
				el.hidden = index === -1;
				index !== -1 && (el.textContent = String(rows.value[titles[index]].item.label ?? rows.value[titles[index]].item.value));
			}
			const translate = index === -1 ? 0 : getStickyTranslate(end, line, el.offsetHeight);
			if (translate !== stickyTranslate) {
				stickyTranslate = translate;
				el.style.transform = translate ? `translateY(${translate}px)` : '';
			}
		};
		const handleScroll = () => {
			frame || (frame = requestAnimationFrame(updateSticky));
		};
		onBeforeUnmount(() => frame && cancelAnimationFrame(frame));

		// 搜索词、数据变化后列表回到顶部（不停在原来滚到的位置）
		watch(rows, () => {
			selectList.value?.scrollTo(0);
			stickyIndex = -2;
			updateSticky();
		}, { flush: 'post' });

		onMounted(() => nextTick(() => {
			scrollIntoSelected();
			updateSticky();
		}));

		expose({
			clear,
			scrollIntoSelected,
			getLabels
		});

		const renderLabel = (row: TreeData, index: number, isSelected: boolean) => {
			const render = slots.label || props.renderLabel;
			if (render) {
				return (<MCustomer render={render} label={row.label} row={row} index={index} selected={isSelected} />);
			}
			return renderHighlight(row.label ?? row.value, regex.value);
		};

		// rowIndex：在 rows 中的位置，点击时据此找到该项；index：在选项中（不含分组标题）的位置
		const renderOption = (row: TreeData, rowIndex: number, index: number) => {
			const isSelected = selected.value.has(row.value);
			return (
				<div
					key={row.value}
					data-index={rowIndex}
					class={[
						'vcm-select-view__option',
						{ 'is-selected': isSelected, 'is-disabled': isDisabled(row) }
					]}
				>
					<div class="vcm-select-view__content">
						<div class="vcm-select-view__label">{ renderLabel(row, index, isSelected) }</div>
						{
							row.description != null && row.description !== '' && (
								<MCustomer class="vcm-select-view__description" wrap render={row.description} />
							)
						}
					</div>
					{ isSelected && (<MIcon class="vcm-select-view__icon" type="correct" />) }
				</div>
			);
		};

		// 分组标题或选项
		const renderRow = ({ row, index }: { row: SelectRow; index: number }) => {
			return row.group
				? (
						<div key={`group:${row.item.value}`} data-index={index} class="vcm-select-view__group">
							{ row.item.label ?? row.item.value }
						</div>
					)
				: renderOption(row.item, index, row.index!);
		};

		// 有分组时常驻，内容由 updateSticky 写入
		const renderSticky = () => groups.value.titles.length > 0 && (
			<div ref={sticky} class="vcm-select-view__group is-sticky" aria-hidden="true" hidden />
		);

		return () => {
			return (
				<div class={['vcm-select-view', { 'is-multiple': multiple.value }]}>
					{
						props.searchable && (
							<div class="vcm-select-view__search">
								<MInputSearch
									// placeholder 由 MInputSearch 透传给输入框
									{...(props.searchPlaceholder ? { placeholder: props.searchPlaceholder } : {})}
									modelValue={keyword.value}
									// @ts-ignore
									onUpdate:modelValue={(v: string) => (keyword.value = v)}
								>
									{{
										// 远程搜索加载期间：输入框右侧显示加载图标
										append: remote.loading.value ? () => (<MSpin size={28} class="vcm-select-view__loading" />) : void 0
									}}
								</MInputSearch>
							</div>
						)
					}
					<MSelectSummary
						count={values.value.length}
						max={props.max}
						multiple={multiple.value}
						clearable={props.clearable}
						onClear={clear}
					/>
					<div class="vcm-select-view__body">
						<div
							class="vcm-select-view__options"
							onClick={handleOptionsClick}
							// 有分组时才需要算吸顶标题
							onScroll={groups.value.titles.length ? handleScroll : void 0}
						>
							{
								rows.value.length
									? (
											<SelectList
												ref={selectList}
												data={rows.value}
												virtualized={props.virtualized}
												mobile
												recycleList={MRecycleList}
											>
												{{ default: renderRow, $stable: true }}
											</SelectList>
										)
									// 远程搜索加载期间不提示无结果
									: !remote.loading.value && (<div class="vcm-select-view__empty">{ t('vc.Select.noMatch') }</div>)
							}
						</div>
						{ renderSticky() }
					</div>
				</div>
			);
		};
	}
});
