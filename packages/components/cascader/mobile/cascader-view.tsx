/** @jsxImportSource vue */

import { computed, defineComponent, inject, nextTick, ref, shallowRef, watch } from 'vue';
import { isEqual } from 'lodash-es';
import { MTabs, MTabsPane } from '../../tabs/index.m';
import { MIcon } from '../../icon/index.m';
import { MSpin } from '../../spin/index.m';
import { MInputSearch } from '../../input/index.m';
import { MCustomer } from '../../customer/index.m';
import { useLocale } from '../../locale';
import { createSearchRegex, getMatchedPaths } from '../../select/utils';
import { renderHighlight } from '../../select/select-search/highlight';
import { getPathRows, toCascaderPath, toCascaderValue } from '../utils';
import { scrollToCenter } from '../../select/select-list/scroll';
import { props as cascaderViewProps } from './cascader-view-props';
import type { TreeData, TreeValue } from '../../select/utils';
import type { SelectPath } from '../../select/select-search';

const COMPONENT_NAME = 'vcm-cascader-view';

/**
 * select 事件的参数：每次点选一项（或一条搜索结果）时触发
 */
export interface MCascaderSelectPayload {
	row: TreeData;
	values: TreeValue[];
	labels: string[];
	// 是否已到最后一级（没有子节点，或加载后为空）
	leaf: boolean;
}

export const MCascaderView = defineComponent({
	name: COMPONENT_NAME,
	props: cascaderViewProps,
	emits: ['update:modelValue', 'change', 'select', 'clear'],
	setup(props, { emit, slots, expose }) {
		const { t } = useLocale();
		const formItem = inject<any>('vc-form-item', {});

		// 当前浏览的路径（各级的 value）
		const path = ref<TreeValue[]>([]);
		// 当前标签：第几级
		const active = ref(0);
		// 正在加载子节点的一项
		const loadingRow = shallowRef<TreeData>();
		const keyword = ref('');
		// 各级选项列表，按级的下标
		const lists: Array<HTMLElement | null> = [];
		// 最近一次发出的值：v-model 回传时不再重新解析
		let emitted: any;
		// 最近一次点选：加载期间又点了别的项时，以最后一次为准
		let token = 0;

		// 有子节点，或子节点待加载
		const hasChildren = (row: TreeData) => !!(row.children && (row.children.length > 0 || props.loadData));

		// 路径上各级的数据；找不到的一级之后不再计算
		// data 不一定是响应式的：loadData 写入 children 后，给 path 换一个新数组来重新计算
		const rows = computed(() => getPathRows(path.value, props.data as TreeData[]));

		const labels = computed(() => rows.value.map(row => row.label as string));

		// 各级的选项：到路径的下一级为止，子节点为空（含待加载）时不显示该级
		const columns = computed(() => {
			const result: TreeData[][] = [];
			const data = props.data as TreeData[];
			if (!data.length) return result;
			result.push(data);
			rows.value.forEach((row) => {
				row.children?.length && result.push(row.children);
			});
			return result;
		});

		// 路径是否已到最后一级
		const isComplete = computed(() => {
			const last = rows.value[rows.value.length - 1];
			return !!last && rows.value.length === path.value.length && !hasChildren(last);
		});

		const isSearching = computed(() => props.searchable && !!keyword.value.trim());
		const regex = computed(() => createSearchRegex(keyword.value));

		// 搜索结果：只列最后一级；changeOnSelect 时任意一级（同桌面端）
		const results = computed(() => {
			if (!isSearching.value) return [];
			return getMatchedPaths(props.data as TreeData[], {
				regex: regex.value,
				path: true,
				selectable: row => props.changeOnSelect || !hasChildren(row)
			});
		});

		// 停在已选的最后一级；还有下一级时停在待选的一级
		const resetActive = () => {
			active.value = Math.max(0, isComplete.value ? path.value.length - 1 : columns.value.length - 1);
		};

		const setPath = (v: any) => {
			path.value = [...toCascaderPath(v, props, path.value)];
			resetActive();
		};

		const sync = (values: TreeValue[]) => {
			const value = toCascaderValue(values, props);
			emitted = value;
			emit('update:modelValue', value, labels.value);
			emit('change', value, labels.value);
			props.allowDispatch && formItem?.change?.(value);
		};

		// 选到最后一级（或 changeOnSelect 时任意一级）提交，再通知 select：监听方（如弹层）拿到的已是新值
		const commit = (row: TreeData, values: TreeValue[], leaf: boolean) => {
			(leaf || props.changeOnSelect) && sync(values);
			const payload: MCascaderSelectPayload = { row, values, labels: labels.value, leaf };
			emit('select', payload);
		};

		/**
		 * 点选某一级的一项：截断后面的层级；有待加载的子节点时先加载
		 * @param row 该项
		 * @param level 第几级
		 */
		const handleSelect = async (row: TreeData, level: number) => {
			if (row.disabled) return;
			const current = ++token;
			const values = [...path.value.slice(0, level), row.value];
			path.value = values;

			if (props.loadData && row.children && !row.children.length) {
				loadingRow.value = row;
				try {
					const children = await props.loadData({ row, values, labels: labels.value });
					Array.isArray(children) && row.children.length === 0 && row.children.push(...children);
					// 各级重新计算（data 不一定是响应式的）
					path.value = [...path.value];
				} finally {
					loadingRow.value === row && (loadingRow.value = void 0);
				}
				if (current !== token) return;
			}

			const leaf = !row.children?.length;
			commit(row, values, leaf);
			active.value = leaf ? level : level + 1;
		};

		// 选中一条搜索结果：写入整条路径
		const handleResult = ({ item, values }: SelectPath) => {
			if (item.disabled) return;
			++token;
			path.value = [...values];
			keyword.value = '';
			commit(item, path.value, !hasChildren(item));
			resetActive();
			// 层级可能不变（watch 不触发）：路径换了，等各级更新后滚到新的选中项
			nextTick(scrollIntoSelected);
		};

		// 点击列表：按行上的 data-index 找到该项（每个列表一个监听）
		const getIndex = (e: MouseEvent) => {
			const el = (e.target as Element).closest<HTMLElement>('.vcm-cascader-view__option');
			return el ? +el.dataset.index! : -1;
		};

		const handleOptionsClick = (e: MouseEvent, level: number) => {
			const row = columns.value[level]?.[getIndex(e)];
			row && handleSelect(row, level);
		};

		const handleResultsClick = (e: MouseEvent) => {
			const data = results.value[getIndex(e)];
			data && handleResult(data);
		};

		// 清空：回到第一级并提交空值（同桌面端，先 clear 再提交）
		const handleClear = () => {
			++token;
			loadingRow.value = void 0;
			path.value = [];
			active.value = 0;
			emit('clear');
			sync([]);
		};

		// 把当前一级的选中项滚到列表中间
		const scrollIntoSelected = () => {
			const list = lists[active.value];
			// 换了分支的一级没有选中项：回到顶部
			list && scrollToCenter(list, list.querySelector<HTMLElement>('.vcm-cascader-view__option.is-selected'));
		};

		// 同桌面端：不深度监听，值整体替换时才重新解析
		watch(
			() => props.modelValue,
			(v) => {
				if (emitted !== void 0 && isEqual(v, emitted)) return;
				setPath(v);
			},
			{ immediate: true }
		);

		watch(
			() => props.data,
			() => {
				emitted = void 0;
				setPath(props.modelValue);
			}
		);

		// 切换层级时把选中项滚到中间；面板首次激活时才渲染，等它渲染后再滚动
		// 进出搜索不滚动：标签栏与列表一直保留，回来时还在原来的位置
		watch(
			active,
			() => nextTick(scrollIntoSelected),
			{ immediate: true, flush: 'post' }
		);

		expose({
			// 浏览的路径与它是否已到最后一级，供弹层判断「确定」能否点击
			getPath: () => path.value,
			isComplete: () => isComplete.value
		});

		const renderCheck = () => (<MIcon class="vcm-cascader-view__icon" type="correct" />);

		// 选项与搜索结果共用的行：点击由所在列表按 data-index 处理
		const renderOption = (key: any, index: number, selected: boolean, disabled: boolean, content: any, suffix: any) => {
			return (
				<div
					key={key}
					data-index={index}
					class={['vcm-cascader-view__option', { 'is-selected': selected, 'is-disabled': disabled }]}
				>
					<span class="vcm-cascader-view__label">{ content }</span>
					{ suffix }
				</div>
			);
		};

		const renderOptions = (list: TreeData[], level: number) => {
			const render = slots.label || props.renderLabel;
			const current = path.value[level];
			return (
				<div
					ref={(el: any) => (lists[level] = el)}
					class="vcm-cascader-view__options"
					onClick={(e: MouseEvent) => handleOptionsClick(e, level)}
				>
					{
						list.map((row, index) => {
							const selected = current === row.value;
							return renderOption(
								row.value,
								index,
								selected,
								!!row.disabled,
								render
									? (<MCustomer render={render} label={row.label} row={row} index={index} selected={selected} />)
									: row.label,
								loadingRow.value === row
									? (<MSpin class="vcm-cascader-view__loading" size={32} />)
									: selected && renderCheck()
							);
						})
					}
				</div>
			);
		};

		const renderResults = () => {
			const list = results.value;
			const current = path.value.join(',');
			return (
				<div class="vcm-cascader-view__options is-results" onClick={handleResultsClick}>
					{
						list.length
							? list.map(({ item, labels: texts, values }, index) => {
									const key = values.join(',');
									const selected = key === current;
									const last = texts.length - 1;
									return renderOption(
										key,
										index,
										selected,
										!!item.disabled,
										texts.map((text, i) => [renderHighlight(text, regex.value), i !== last ? ' / ' : null]),
										selected && renderCheck()
									);
								})
							: (<div class="vcm-cascader-view__empty">{ t('vc.Cascader.noMatch') }</div>)
					}
				</div>
			);
		};

		// 已选的级显示所选项的文字，待选的一级显示 placeholder
		const renderTabLabel = ({ index }: { index: number }) => {
			const row = rows.value[index];
			return row
				? (<span class="vcm-cascader-view__tab">{ row.label }</span>)
				: (<span class="vcm-cascader-view__placeholder">{ props.placeholder ?? t('vc.Cascader.placeholder') }</span>);
		};

		const renderPanes = () => columns.value.map((list, level) => (
			<MTabsPane key={level} value={level} label={String(rows.value[level]?.label ?? '')}>
				{ renderOptions(list, level) }
			</MTabsPane>
		));

		const renderClear = () => {
			return props.clearable && path.value.length
				? (<div class="vcm-cascader-view__clear" onClick={handleClear}>{ t('vc.Cascader.clearText') }</div>)
				: null;
		};

		const renderTabs = () => {
			return (
				<MTabs
					class="vcm-cascader-view__tabs"
					modelValue={active.value}
					average={false}
					animated
					swipeable
					// @ts-ignore
					onUpdate:modelValue={(v: number) => (active.value = v)}
				>
					{{
						default: renderPanes,
						label: renderTabLabel,
						append: renderClear,
						// 插槽只在 MTabs 内读取状态：视图重新渲染（如键入搜索）时不带着各级面板重新渲染
						$stable: true
					}}
				</MTabs>
			);
		};

		return () => {
			return (
				<div class="vcm-cascader-view">
					{
						props.searchable && (
							<div class="vcm-cascader-view__search">
								<MInputSearch
									// placeholder 由 MInputSearch 透传给输入框
									{...(props.searchPlaceholder ? { placeholder: props.searchPlaceholder } : {})}
									modelValue={keyword.value}
									// @ts-ignore
									onUpdate:modelValue={(v: string) => (keyword.value = v)}
								/>
							</div>
						)
					}
					<div class={['vcm-cascader-view__body', { 'is-searching': isSearching.value }]}>
						{ renderTabs() }
						{ isSearching.value && renderResults() }
					</div>
				</div>
			);
		};
	}
});
