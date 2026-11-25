import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import { VcInstance } from '../../../vc';
import { DEFAULT_SEARCH_MATCH } from '../../utils';

// searchMatch 示例共用（Select / TreeSelect / Cascader / AutoComplete）：开关里的预设与对应的分隔符
const PRESETS = {
	default: { label: '默认：空格 and，逗号 or', value: DEFAULT_SEARCH_MATCH },
	or: { label: '空格、逗号都 or', value: { or: [' ', ',', '，'] } },
	phrase: { label: '整句（{}）', value: {} },
	hash: { label: '空格 and，# 分组 or', value: { and: ' ', or: '#' } }
};

// 开关的选项：unset 表示不传 / 未配置
const toOptions = unsetLabel => [
	{ value: 'unset', label: unsetLabel },
	...Object.entries(PRESETS).map(([value, { label }]) => ({ value, label }))
];

/**
 * 两个开关：组件属性（own）与全局配置（global，写入 VcInstance.options[key]，离开页面还原）
 * @param key 全局配置的键：Select / TreeSelect / Cascader / AutoComplete
 * @param extra 其它开关，格式同 CONTROLS
 * @returns ~
 */
export const useSearchMatchControls = (key, extra = []) => {
	const CONTROLS = [
		{ key: 'own', label: '组件属性', data: toOptions('不传') },
		{ key: 'global', label: '全局配置', data: toOptions('未配置') },
		...extra
	];
	const controls = reactive(Object.fromEntries(CONTROLS.map(({ key: name, data }) => [name, data[0].value])));
	const own = computed(() => PRESETS[controls.own]?.value);
	const global = computed(() => PRESETS[controls.global]?.value);

	const original = VcInstance.options[key];
	watch(global, value => VcInstance.configure({ [key]: { ...original, searchMatch: value } }));
	onBeforeUnmount(() => VcInstance.configure({ [key]: original }));

	// 页面上展示生效的规则：组件属性 → 全局 → 默认
	const describe = match => JSON.stringify(match ?? DEFAULT_SEARCH_MATCH);
	return { CONTROLS, controls, own, global, describe };
};

// TreeSelect / Cascader 共用：三级分组
export const GROUP_DATA = ['A', 'B', 'C'].map(group => ({
	value: group,
	label: `分组 ${group}`,
	children: [1, 2, 3].map(sub => ({
		value: `${group}-${sub}`,
		label: `子分组 ${group}${sub}`,
		children: [1, 2, 3].map(n => ({ value: `${group}-${sub}-${n}`, label: `条目 ${group}${sub}-${n}` }))
	}))
}));
