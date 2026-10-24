/** @jsxImportSource vue */

import { defineComponent, ref, watch, computed, nextTick, inject } from 'vue';
import { isEqualWith } from 'lodash-es';
import { scrollIntoView } from '@deot/helper-dom';
import { getSelectedData } from './utils';
import { VcError } from '../vc/index';
import { Popover } from '../popover/index';
import { useLocale } from '../locale';
import { CascaderColumn } from './column';
import { Scroller } from '../scroller/index';
import { SelectTrigger } from '../select/select-trigger';
import { SelectSearch, SelectPaths } from '../select/select-search';
import { useSelect } from '../select/hooks/use-select';
import { useColumnNavigate } from '../select/hooks/use-navigate';
import { useColumnDirection } from '../select/hooks/use-column-direction';

import { toCurrentValue, toModelValue, getTreeDepth } from '../select/utils';

import type { TreeData, TreeValue, TreeLabel } from '../select/utils';
import type { SelectPath } from '../select/select-search';
import type { FormItemProvide } from '../form/types';
import { props as cascaderProps } from './cascader-props';

const COMPONENT_NAME = 'vc-cascader';

export const Cascader = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: cascaderProps,
	emits: ['update:modelValue', 'visible-change', 'ready', 'change', 'clear', 'close'],
	setup(props, { emit, slots }) {
		const { t } = useLocale();
		const formItem = inject('vc-form-item', {} as FormItemProvide);

		// loadData 用于加载子节点，搜索只在已有数据内进行
		const select = useSelect('cascader', { remote: false, navigator: () => navigator });
		const { its, isActive, searchRegex, searchMode, isSearching } = select;

		const currentValue = ref<TreeValue[]>([]);
		const rebuildData = ref<TreeData[]>([]);
		const colRef = ref({});
		const columnsRef = ref<any>();

		// 展开方向：弹层挂载时判断，见 handleReady
		const direction = useColumnDirection({
			getDirection: () => props.expandDirection,
			getPlacement: () => props.placement,
			getColumn: () => colRef.value[0]?.$el,
			// loadData 按需加载子节点，层级无法预知
			getDepth: () => (props.loadData ? Infinity : getTreeDepth(props.data))
		});

		const columns = computed(() => {
			return Array.from({ length: currentValue.value.length + 1 }).map((_, index) => index);
		});
		/**
		 * TODO: 初始化时，存在查找耗时
		 */
		const currentLabel = computed(() => {
			const { label: $label } = getSelectedData(
				props.changeOnSelect
					? currentValue.value
					: toCurrentValue(
							props.modelValue,
							{
								numerable: props.numerable,
								separator: props.separator
							}
						),
				props.data
			) || {};
			return ($label || []).filter(i => i) as TreeLabel[];
		});

		const formatLabel = computed(() => {
			return props.formatter(currentLabel.value) || props.extra;
		});

		// 自定义触发区内没有输入框，内联搜索退为弹层搜索栏
		const getSearchMode = () => {
			return slots.default && searchMode.value ? 'popover' : searchMode.value;
		};

		const setColRef = (el: any, index: number) => {
			el && (colRef.value[index] = el);
		};

		/**
		 * v-model 同步, 外部的数据改变时不会触发
		 * @param force ~
		 */
		const sync = (force?: boolean) => {
			const value = toModelValue(
				currentValue.value,
				{
					modelValue: props.modelValue,
					max: props.max,
					numerable: props.numerable,
					separator: props.separator,
					nullValue: props.nullValue
				}
			);
			(props.changeOnSelect) && (
				emit('update:modelValue', value, currentLabel.value),
				emit('change', value, currentLabel.value)
			);

			// 最后一项，自动关闭
			const lastData = rebuildData.value[currentValue.value.length];

			const isLast = !lastData || lastData.length === 0;

			(isLast || props.changeOnSelect) && (isActive.value = false);

			// 该模式下，label会变为上一个值，这里重新获取一次
			if ((force || isLast) && !props.changeOnSelect) {
				const { label: $label } = getSelectedData(currentValue.value, props.data) || {};

				emit('update:modelValue', value, $label);
				emit('change', value, $label);
			}

			formItem.change?.();
		};

		/**
		 * 单列数据
		 * @param source 数据源
		 * @returns ~
		 */
		const makeData = (source: TreeData[]): TreeData[] => {
			const data = source && source.map(i => ({
				value: i.value,
				label: i.label,
				hasChildren: !!(i.children && (i.children.length > 0 || props.loadData)),
				loading: false
			}));
			return data;
		};

		/**
		 * 调整数据
		 * @returns 每列的数据
		 */
		const makeRebuildData = (): TreeData[] => {
			if (!props.data.length) return [] as TreeData[];
			let temp: TreeData[] = props.data;
			const data = currentValue.value.slice(0).reduce((pre, cur, index) => {
				pre[index] = temp && makeData(temp);
				temp = ((temp && temp.find(i => i.value == cur)) || {}).children || [];
				return pre;
			}, [] as TreeData[]);

			temp && data.push(makeData(temp));

			return data;
		};

		/**
		 * 初始化完成后格式化数据；ready 由 useSelect 的监听抛出
		 */
		const handleReady = () => {
			rebuildData.value = makeRebuildData();

			/**
			 * 滚动到初始位置
			 * TODO: 是否移入col单独处理
			 */

			direction.update();
			nextTick(() => {
				currentValue.value.forEach((item, index) => {
					const el = colRef.value[index] && colRef.value[index].$el;
					const source = rebuildData.value[index];

					if (source && el) {
						const $instance = source.findIndex((i: TreeData) => item == i.value);
						// 列内的 Scroller 根节点即滚动容器
						const scroller = el.firstElementChild;
						const rowHeight = scroller.querySelector('.vc-cascader-column__item')?.clientHeight || 0;
						scrollIntoView(scroller, { to: $instance * rowHeight });
					}
				});
			});
		};

		const handleClear = () => {
			emit('clear');

			currentValue.value.splice(0, currentValue.value.length);
			isActive.value = false;

			sync(true);
		};

		/**
		 * 移入某项（鼠标或方向键）：展开下一级，见 useColumnNavigate 的 hover
		 * @param item 该项
		 * @param columnIndex 列
		 * @param rowIndex 行
		 */
		const handleCellChange = async (item: TreeData, columnIndex: number, rowIndex: number) => {
			const { value } = item;
			try {
				const len = currentValue.value.slice(columnIndex).length;
				currentValue.value.splice(columnIndex, len, value);

				/**
				 * TODO: 提前缓存index
				 */
				const children = currentValue.value.reduce((pre: TreeData[] | undefined, cur) => {
					const target = (pre && pre.find((i: TreeData) => i.value == cur)) || {};

					return target.children ? target.children : undefined;
				}, props.data);

				/**
				 * 异步加载数据
				 */
				if (props.loadData && children && children.length === 0) {
					rebuildData.value[columnIndex][rowIndex].loading = true;

					const res = await props.loadData();
					/**
					 * TODO: 优化，data -> cloneData?
					 */
					children.splice(0, 0, ...res);
				}

				children && rebuildData.value.splice(columnIndex + 1, len, makeData(children));

				// 清理
				if ((!children || children.length === 0) && columnIndex < rebuildData.value.length) {
					currentValue.value.splice(columnIndex + 1, len);
					rebuildData.value.splice(columnIndex + 1, len);
				}
			} catch (e) {
				throw new VcError('vc-cascader', e);
			} finally {
				rebuildData.value[columnIndex][rowIndex].loading && (
					rebuildData.value[columnIndex][rowIndex].loading = false
				);
			}
		};

		const handleCellClick = () => {
			sync();
		};

		/**
		 * 搜索结果：叶子节点可选；changeOnSelect 时任意一级可选
		 * 子节点待加载（children 为空数组且有 loadData）的节点不是叶子
		 * @param item ~
		 * @returns ~
		 */
		const isSelectable = (item: TreeData) => {
			return props.changeOnSelect || !(item.children && (item.children.length > 0 || props.loadData));
		};

		const isChecked = ({ values }: SelectPath) => {
			return values.length === currentValue.value.length && values.every((v, i) => v == currentValue.value[i]);
		};

		// 选中搜索结果：写入整条路径并提交
		const handleSelect = ({ values }: SelectPath) => {
			currentValue.value = [...values];
			rebuildData.value = makeRebuildData();

			sync(true);
			isActive.value = false;
		};

		/**
		 * 在关闭的时候，让重新打开的值一致；close 由 useSelect 的监听抛出
		 * 暂时不用rebuildData.value, ready时会再次触发
		 */
		const handleClose = () => {
			const v = toCurrentValue(props.modelValue, {
				numerable: props.numerable,
				separator: props.separator
			});
			if (!isEqualWith(currentValue.value, v)) {
				currentValue.value = [...v];
			}
		};

		// 方向键：搜索时在结果列表内移动，否则在级联列内移动（等同鼠标移入）；回车等同点击
		const { paths, searchWidth, navigator, handleMove } = useColumnNavigate({
			getPath: () => currentValue.value,
			getColumns: () => rebuildData.value as any,
			hover: handleCellChange,
			getItem: (columnIndex, rowIndex) => {
				return colRef.value[columnIndex]?.$el.querySelectorAll('.vc-cascader-column__item')[rowIndex];
			},
			enter: () => {
				currentValue.value.length && sync();
			},
			isSearching: () => isSearching.value,
			getView: () => columnsRef.value?.$el,
			isReverse: () => direction.isReverse.value
		});

		watch(
			() => props.data,
			() => {
				rebuildData.value = makeRebuildData();
			}
		);

		watch(
			() => props.modelValue,
			(v) => {
				v = toCurrentValue(v, {
					numerable: props.numerable,
					separator: props.separator
				});
				// 不使用currentValue.value = v; 避免同步修改源数据，这里有取消操作
				currentValue.value = v && v.length > 0 ? [...v] : [];
			},
			{ immediate: true }
		);

		const renderTrigger = () => {
			if (slots.default) {
				return slots.default({
					label: currentLabel.value,
					value: currentValue.value,
					active: isActive.value
				});
			}
			return (
				<SelectTrigger
					{...select.trigger.value}
					placeholder={its.value.attrs?.placeholder ?? t('vc.Cascader.placeholder')}
					text={formatLabel.value}
					clearable={props.clearable && currentValue.value.length > 0}
					onClear={handleClear}
				/>
			);
		};

		const renderHeader = () => {
			return (<SelectSearch {...select.search.value} />);
		};

		const renderColumn = (index: number) => {
			if (!rebuildData.value[index] || !rebuildData.value[index].length) return;
			return (
				<CascaderColumn
					ref={(el: any) => setColRef(el, index)}
					key={index}
					index={index}
					value={currentValue.value[index]}
					data={rebuildData.value[index] as any}
					onChange={handleMove}
					onClick={handleCellClick}
				/>
			);
		};

		const renderContent = () => {
			return isSearching.value
				? (
						<SelectPaths
							ref={paths}
							class="vc-cascader__paths"
							data={props.data}
							regex={searchRegex.value}
							path
							selectable={isSelectable}
							checked={isChecked}
							width={searchWidth.value}
							emptyText={t('vc.Cascader.noMatch')}
							onSelect={handleSelect}
						/>
					)
				: (
						<Scroller
							ref={columnsRef}
							class={['vc-cascader__columns', { 'is-reverse': direction.isReverse.value }]}
							contentClass="vc-cascader__content"
						>
							{ columns.value.map(renderColumn) }
						</Scroller>
					);
		};

		return () => {
			return (
				<Popover
					{...select.popover.value}
					placement={direction.placement.value}
					keepEdge={direction.keepEdge.value}
					// 各列在高度上限内收缩并自行滚动
					scrollable={false}
					onReady={handleReady}
					onClose={handleClose}
				>
					{{
						default: renderTrigger,
						header: getSearchMode() === 'popover' ? renderHeader : void 0,
						content: renderContent
					}}
				</Popover>
			);
		};
	}
});
