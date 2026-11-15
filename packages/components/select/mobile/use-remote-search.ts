import { getCurrentInstance, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import { debounce } from 'lodash-es';

// 每个 loadData 最近一次按哪个关键词调用：弹层每次打开重新挂载，据此判断手上的数据是否对得上空关键词
const loadedKeywords = new WeakMap<Function, string>();

interface RemoteSearchProps {
	data?: unknown[];
	// 搜索回调：(keyword, instance) => Promise
	loadData?: Function;
	searchable?: boolean;
}

/**
 * 移动端选择弹层的远程搜索（MSelectView、MTreeSelect 共用），时机同桌面端 Select / TreeSelect
 * 	- searchable 且有 loadData 时生效：搜索词变化经 250ms 防抖调用 loadData(keyword, instance)，加载期间 loading 为 true
 * 	- 挂载（弹层打开）时：还没有数据，或数据是按某个关键词加载的，立即按空关键词调用一次
 * 	- 数据由调用方更新 data；Promise 解析为数组时作为这次的结果（直接打开、没有触发区转发 data 时用到），data 再变化后以 data 为准
 * 	- 卸载时取消尚未发出的那一次
 * @param props ~
 * @param keyword 搜索词
 * @returns ~
 */
export const useRemoteSearch = (props: RemoteSearchProps, keyword: Ref<string>) => {
	const instance = getCurrentInstance();
	const loading = ref(false);
	const results = shallowRef<unknown[] | null>(null);
	let seq = 0;

	const isRemote = () => !!props.loadData && !!props.searchable;

	const run = () => {
		const fn = props.loadData!;
		const value = keyword.value;
		const id = ++seq;
		loadedKeywords.set(fn, value);
		loading.value = true;
		Promise.resolve(fn(value, instance))
			.then((response: unknown) => {
				id === seq && Array.isArray(response) && (results.value = response);
			})
			.finally(() => {
				id === seq && (loading.value = false);
			});
	};

	const load = debounce(run, 250);

	watch(keyword, () => isRemote() && load());
	watch(() => props.data, () => (results.value = null));

	onMounted(() => {
		if (!isRemote() || keyword.value) return;
		const last = loadedKeywords.get(props.loadData!);
		const stale = last === undefined ? !props.data?.length : !!last;
		stale && run();
	});

	onBeforeUnmount(() => load.cancel());

	return {
		isRemote,
		loading,
		// 当前的数据：loadData 解析出的结果，否则为 data
		getData: () => (results.value ?? props.data ?? []) as any[]
	};
};
