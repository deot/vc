/** @jsxImportSource vue */

import { computed, defineComponent, nextTick, onMounted, ref, toRaw, watch } from 'vue';
import { Portal } from '../../../portal';
import { MPickerPopup } from '../../../picker/index.m';
import { getConfirmMode } from '../../../picker/mobile/picker-popup-props';
import { pickerCoreEmits, usePickerCore } from '../../../picker/mobile/use-picker-portal';
import { MButton } from '../../../button/index.m';
import { MInputSearch } from '../../../input/index.m';
import { useLocale } from '../../../locale';
import { createSearchRegex, isMultiple, toCurrentValue, toModelValue } from '../../../select/utils';
import type { TreeValue } from '../../../select/utils';
import { MSelectSummary } from '../../../select/mobile/select-summary';
import { useRemoteSearch } from '../../../select/mobile/use-remote-search';
import { MSpin } from '../../../spin/index.m';
import { TreeSelectContent } from '../../tree-select/tree-select-content';
import { useTreeSelectValue } from '../../tree-select/use-tree-select-value';
import { MTree } from '../tree';
import { props as coreProps } from './tree-select-core-props';

const COMPONENT_NAME = 'vcm-tree-select-core';

/**
 * 移动端树选择的弹层：MPickerPopup 中依次为搜索框、汇总栏、固定高度的树（MTree）
 * 	- 弹层内的值在「确定」时提交，取消时丢弃；不需要确认时（单选且 confirm 为 false）点一个节点即提交并关闭
 * 	- 选择、搜索、回填与桌面端的树形模式相同（TreeSelectContent）
 * 	- 远程搜索（searchable + loadData）：数据为 loadData 的结果，只高亮不过滤；结果之外的已选值不受勾选影响，文字沿用上次查到的
 */
export const MTreeSelectCore = defineComponent({
	name: COMPONENT_NAME,
	props: coreProps,
	emits: [...pickerCoreEmits, 'clear'],
	setup(props, context) {
		const { emit } = context;
		const { t } = useLocale();
		const core = usePickerCore(props, context, { fields: ['labels'] });
		const list = ref<HTMLElement>();
		const keyword = ref('');

		// 弹层内的值（选中的值）：确定时提交，取消时丢弃
		const currentValue = ref<TreeValue[]>([]);
		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = toCurrentValue(v, props);
			},
			{ immediate: true }
		);

		// 远程搜索：数据为 loadData 的结果，见 useRemoteSearch
		const remote = useRemoteSearch(props, keyword);
		const data = computed(() => remote.getData());

		const { labels, apply } = useTreeSelectValue(
			{
				get data() {
					return data.value;
				},
				get checkStrategy() {
					return props.checkStrategy;
				}
			},
			// 记录表与触发区共用（经 Portal 传入时为响应式代理，取原始对象）
			{ currentValue, isRemote: remote.isRemote, shared: props.selectedNodes && toRaw(props.selectedNodes) }
		);

		// 远程搜索时数据随关键词变化：已选值或数据一变就查一次路径与文字，查到的记进记录表，结果里没有时沿用
		// （文字只在确定时用到，不立即计算的话，勾选后换了关键词再确定，就查不到之前勾选的了）
		watch(labels, () => {}, { immediate: true });

		const multiple = computed(() => isMultiple(props.max));

		// 按钮的位置：多选总是需要确定，没有指定时在顶部
		const mode = computed(() => getConfirmMode(props.confirm || multiple.value));

		const isEmpty = computed(() => !currentValue.value.length);

		// 不可清空时，一项都没选不能确定
		const isOkDisabled = computed(() => !props.clearable && isEmpty.value);

		const regex = computed(() => createSearchRegex(props.searchable ? keyword.value : ''));

		const handleOk = () => {
			if (mode.value && isOkDisabled.value) return;
			// 发出副本：外部持有的数组与弹层内的值互不影响
			const value = toModelValue(currentValue.value.slice(), props);
			core.ok(value, labels.value);
		};

		const handleChange = (_: any, state: any) => {
			apply(state.checkedValues);
		};

		// 不需要确认时（单选），点一个节点即提交并关闭（点已选中的节点也提交）
		const handleSelect = () => {
			!mode.value && handleOk();
		};

		// 清空：不需要确认时直接提交空值并关闭；否则只清空弹层内的值，由「确定」提交
		const clear = () => {
			currentValue.value = [];
			emit('clear');
			!mode.value && handleOk();
		};

		// 第一个已选节点滚到列表中间（已选节点及其祖先在打开时展开，见 TreeSelectContent）
		const scrollIntoSelected = () => {
			const el = list.value;
			const row = el?.querySelector<HTMLElement>('.vc-tree-node.is-checked');
			if (!el || !row) return;
			const offset = row.getBoundingClientRect().top - el.getBoundingClientRect().top;
			el.scrollTop += offset - (el.clientHeight - row.offsetHeight) / 2;
		};

		onMounted(() => nextTick(scrollIntoSelected));

		const renderContent = () => {
			return (
				<div class="vcm-tree-select-panel">
					{
						props.searchable && (
							<div class="vcm-tree-select-panel__search">
								<MInputSearch
									// placeholder 由 MInputSearch 透传给输入框
									{...(props.searchPlaceholder ? { placeholder: props.searchPlaceholder } : {})}
									modelValue={keyword.value}
									// @ts-ignore
									onUpdate:modelValue={(v: string) => (keyword.value = v)}
								>
									{{
										// 远程搜索加载期间：输入框右侧显示加载图标
										append: remote.loading.value ? () => (<MSpin size={28} class="vcm-tree-select-panel__loading" />) : void 0
									}}
								</MInputSearch>
							</div>
						)
					}
					<MSelectSummary
						count={currentValue.value.length}
						max={props.max}
						multiple={multiple.value}
						// 'bottom' 时「清空」在底部按钮
						clearable={props.clearable && mode.value !== 'bottom'}
						onClear={clear}
					/>
					<div ref={list} class="vcm-tree-select-panel__options">
						<TreeSelectContent
							tree={MTree}
							mobile
							value={currentValue.value}
							data={data.value}
							remote={remote.isRemote()}
							max={props.max}
							checkStrategy={props.checkStrategy}
							renderNodeLabel={props.renderNodeLabel}
							searchValue={props.searchable ? keyword.value : ''}
							searchRegex={regex.value}
							virtualized={props.virtualized}
							onChange={handleChange}
							onSelect={handleSelect}
						/>
					</div>
				</div>
			);
		};

		// 'bottom' 且可清空：「确定」前加「清空」，各占一半
		const renderClear = () => {
			return (
				<MButton
					class="vcm-picker-popup__button"
					size="large"
					round
					disabled={isEmpty.value}
					onClick={clear}
				>
					{ t('vc.Select.clearText') }
				</MButton>
			);
		};

		// 没有工具栏时，MPickerPopup 在标题栏显示标题与关闭按钮
		return () => {
			return (
				<MPickerPopup
					class={['vcm-tree-select-popup', mode.value === 'bottom' && 'is-bottom']}
					{...core.getPopupProps()}
					title={props.title}
					cancelText={props.cancelText}
					okText={props.okText}
					okDisabled={isOkDisabled.value}
					confirm={mode.value}
					onOk={handleOk}
				>
					{{
						'default': renderContent,
						'footer-extra': props.clearable ? renderClear : void 0
					}}
				</MPickerPopup>
			);
		};
	}
});

export const MTreeSelectPortal = new Portal(MTreeSelectCore, {
	promise: false
});
