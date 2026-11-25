/** @jsxImportSource vue */

import { computed, getCurrentInstance, onBeforeUnmount, provide, ref, shallowRef, watch } from 'vue';
import type { Component, Slots } from 'vue';
import { debounce } from 'lodash-es';
import { useKeyboard } from '@deot/vc-hooks';
import { toPx, toRem } from '@deot/vc-shared';
import { getSelectRows } from '../select/utils';
import type { SearchMatch, SelectRow, TreeData } from '../select/utils';
import { useSearchRegex } from '../select/hooks/use-search-regex';
import { useNavigate } from '../select/hooks/use-navigate';
import { SelectList } from '../select/select-list';
import { createRowRenderer, OPTION_OWNER_KEY } from '../select/select-option';
import type { OptionOwner } from '../select/select-option';
import { RecycleList } from '../recycle-list/index';
import { Spin } from '../spin/index';
import { MOBILE_CLASS } from '../popover/mobile/popover';
import type { SuggestConfig } from './suggest-props';

// 弹层内容区的最大高度：桌面端 px（同 Select）；移动端 750 稿，约 5 行。可视区放不下时由 Popover 按可视区再限高、翻转
const MAX_HEIGHT = 200;
const MOBILE_MAX_HEIGHT = 400;

// 远程加载时不在本地过滤：data 就是这个关键词的结果（服务端可能按拼音、编号等匹配，文字里不一定含关键词）
const MATCH_ALL = /(?:)/;

// 联想项为字符串、数字时转为 { label, value }
const normalize = (data: unknown[]): TreeData[] => {
	return data.map(item => (item !== null && typeof item === 'object' ? item : { label: String(item), value: item }) as TreeData);
};

export interface SuggestOptions {
	// 当前的搜索词（AutoComplete 为输入框的文字，Mention 为前缀之后的词）
	keyword: () => string;
	// 生效的搜索分隔符（AutoComplete 按 getSearchMatch 取值）；不传时为默认规则
	searchMatch?: () => SearchMatch;
	// 选中一项（点击或回车）
	pick: (item: TreeData) => void;
	// loadData 的第三个参数（如 Mention 的 { prefix }）
	loadExtra?: () => Record<string, any> | undefined;
	// 显示状态变化（调用方声明了 visible-change 时转发）
	onVisibleChange?: (visible: boolean) => void;
	// 移动端：行与加载图标换成移动端组件，不默认高亮（没有回车选中的需要）
	mobile?: boolean;
	components?: {
		RecycleList?: Component;
		Spin?: Component;
	};
}

/**
 * 联想组件（AutoComplete、Mention、Editor 的提及）共用：联想项的过滤、远程加载、键盘与列表渲染
 * 	- 列表复用 Select 的 SelectList（含 virtualized）与行渲染（createRowRenderer）；Option 经 provide 找到这里的 pick，没有选中态
 * 	- 弹层由调用方渲染（锚点不同：输入框本身、文本域光标处的节点、富文本光标处的节点），这里给出公共的弹层属性与内容；
 * 	  移动端同样是下拉，外观与尺寸换成移动端（750 稿），按可视区翻转、限高由 Popover 处理
 * 	- 打开：调用方置 active；有联想项或正在加载时才显示，没有结果时不弹出空面板
 * 	- 远程：search 经 250ms 防抖调用 loadData(keyword, instance, extra)；过期的结果丢弃；不在本地过滤，只高亮命中的文字
 * 	- 键盘（显示期间）：↑ ↓ 移动高亮，Enter 选中高亮项（没有高亮时放行），Esc 关闭，Tab 关闭并放行
 * @param config 属性（组件传 () => props；Editor 传合并了默认值的 mentionOptions）
 * @param slots option / label / optionGroup 插槽
 * @param options ~
 * @returns ~
 */
export const useSuggest = (config: () => SuggestConfig, slots: Slots, options: SuggestOptions) => {
	const { pick, loadExtra, onVisibleChange, mobile = false, components = {} } = options;
	const instance = getCurrentInstance();

	// 调用方希望打开（如输入框聚焦、光标在提及的词内）
	const active = ref(false);
	const loading = ref(false);
	// loadData 解析出的数组：作为这次的结果，data 再变化后以 data 为准
	const results = shallowRef<unknown[] | null>(null);

	// 搜索词只在文字变化时更新：同一个词的重复通知（如光标移动）不会重新过滤
	const keyword = computed(options.keyword);
	const isRemote = () => !!config().loadData;
	const source = computed(() => normalize((results.value ?? config().data ?? []) as unknown[]));
	const regex = useSearchRegex(() => keyword.value, options.searchMatch);
	const rows = computed(() => getSelectRows(source.value, isRemote() ? MATCH_ALL : regex.value));
	const visible = computed(() => active.value && (rows.value.length > 0 || loading.value));

	watch(() => config().data, () => (results.value = null));
	onVisibleChange && watch(visible, onVisibleChange);

	// 回车选中了一项：同一次按键的 keyup 不应再被当作提交（如 Input 的 enter 事件），见 consumeEnter
	let isEnterHandled = false;
	const consumeEnter = () => {
		const value = isEnterHandled;
		isEnterHandled = false;
		return value;
	};

	let seq = 0;
	// 加载的依据：关键词与 loadData 的第三个参数（如 Mention 的前缀）
	const getLoadKey = () => `${keyword.value}\u0000${JSON.stringify(loadExtra?.() ?? null)}`;
	// 最近一次按什么加载；undefined 表示还没加载过
	let loadedKey: string | undefined;

	const run = () => {
		const fn = config().loadData;
		if (!fn) return;
		const id = ++seq;
		loadedKey = getLoadKey();
		loading.value = true;
		Promise.resolve(fn(keyword.value, instance, loadExtra?.()))
			.then((response: unknown) => {
				id === seq && Array.isArray(response) && (results.value = response);
			})
			.finally(() => {
				id === seq && (loading.value = false);
			});
	};
	const load = debounce(run, 250);

	// 输入引起的搜索词变化
	const search = () => {
		isRemote() && load();
	};

	/**
	 * 打开：远程加载时，手上的数据不是按当前关键词（与前缀等）加载的（含还没加载过），立即加载一次
	 */
	const open = () => {
		active.value = true;
		if (!isRemote() || loadedKey === getLoadKey()) return;
		load.cancel();
		run();
	};

	/**
	 * 关闭：取消尚未发出的加载；已发出的照常更新结果，下次打开时不必再加载
	 */
	const close = () => {
		active.value = false;
		load.cancel();
	};

	// 失焦：关闭，并丢弃回车选中的标记（keyup 不会再回到这里）
	const blur = () => {
		close();
		isEnterHandled = false;
	};

	onBeforeUnmount(() => load.cancel());

	// 自定义整行（renderOption、option 插槽）时同样参与键盘：高亮写在行的根节点上（data-active），样式由调用方处理
	// 内容的来源只在显示期间订阅：关闭时数据、搜索词的变化不重新过滤
	const navigate = useNavigate<SelectRow>({
		getList: () => rows.value,
		isEnabled: ({ item, group }) => !group && !item.disabled,
		select: ({ item }) => pick(item),
		source: () => visible.value && rows.value,
		initial: !mobile
	});

	provide<OptionOwner>(OPTION_OWNER_KEY, { pick: (_: any, row?: any) => row && pick(row) });

	const handleKeyboard = (e: KeyboardEvent) => {
		if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return false;
		switch (e.key) {
			case 'ArrowDown':
			case 'ArrowUp':
				navigate.move(e.key === 'ArrowDown' ? 1 : -1);
				return true;
			case 'Enter':
				if (navigate.getActive() === -1) return false;
				isEnterHandled = true;
				navigate.enter();
				return true;
			case 'Escape':
				close();
				return true;
			case 'Tab':
				close();
				return false;
			default:
				return false;
		}
	};

	useKeyboard({ enabled: () => visible.value, handler: handleKeyboard });

	// 弹层的公共属性：受控打开、焦点留在输入框（点联想项不失焦）、点击外部不由弹层自己关闭（失焦时调用方关闭）
	const popover = computed(() => {
		const { placement, portal, portalClass } = config();
		return {
			'modelValue': visible.value,
			'trigger': 'custom',
			'placement': placement,
			'arrow': false,
			'portal': portal,
			'portalClass': [['is-padding-none', 'vc-suggest-wrapper', mobile && ['vcm-suggest-wrapper', MOBILE_CLASS], portalClass]],
			'animation': 'y',
			'keepFocus': true,
			'outsideClickable': false,
			'scrollerOptions': { maxHeight: mobile ? toRem(MOBILE_MAX_HEIGHT) : toPx(MAX_HEIGHT) },
			'onUpdate:modelValue': (v: boolean) => !v && close()
		};
	});

	const renderRow = createRowRenderer({
		slots,
		getRegex: () => regex.value,
		isDisabled: item => !!item.disabled,
		getRender: config
	});

	const SpinComponent = (components.Spin || Spin) as any;

	// 弹层内容：联想项；还没有结果、正在加载时为加载图标
	const renderContent = () => {
		if (!rows.value.length) {
			return (
				<div class="vc-suggest__loading">
					<SpinComponent size={mobile ? 28 : 16} />
				</div>
			);
		}
		return (
			<SelectList
				ref={navigate.setList}
				class="vc-suggest"
				data={rows.value}
				virtualized={config().virtualized}
				mobile={mobile}
				recycleList={components.RecycleList || RecycleList}
				onHover={navigate.hover}
			>
				{{ default: renderRow, $stable: true }}
			</SelectList>
		);
	};

	return {
		active,
		visible,
		search,
		open,
		close,
		blur,
		consumeEnter,
		popover,
		renderContent
	};
};
