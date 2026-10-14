import { computed, getCurrentInstance, inject, ref, watch, onBeforeUnmount } from 'vue';
import { debounce, isEqualWith } from 'lodash-es';
import { useAttrs } from '@deot/vc-hooks';
import { Keyboard } from '@deot/vc-shared';
import { VcError } from '../../vc/index';
import { createSearchRegex, toCurrentValue, toModelValue } from '../utils';
import type { Props } from '../select-props';
import type { Navigator } from './use-navigate';

type SearchMode = '' | 'inline' | 'popover';

interface Options {
	// 搜索词变化时是否调用 loadData（Cascader 的 loadData 用于加载子节点，不参与搜索）
	remote?: boolean;
	// 弹层打开时响应方向键与回车的对象；内容在弹层内，随打开才存在，按键时再取
	navigator?: () => Navigator | null | undefined;
}

/**
 * Select / TreeSelect / Cascader 共用：弹层开关、搜索词与远程搜索、键盘，以及 Popover / SelectTrigger / SelectSearch 的公共绑定
 * @param name 组件名（不含 vc- 前缀），用于类名与报错
 * @param options ~
 * @returns ~
 */
export const useSelect = (name: string, options: Options = {}) => {
	const { remote = true, navigator } = options;
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;
	const { emit } = instance;
	const its = useAttrs({ merge: false });

	// 触发器（SelectTrigger）
	const trigger = ref<any>();
	const isActive = ref(false);
	// 焦点在触发器内
	const isFocus = ref(false);
	const isLoading = ref(false);
	const searchValue = ref('');
	const searchRegex = computed(() => createSearchRegex(searchValue.value));
	// 有搜索词（只有空白、分隔符时不算）
	const isSearching = computed(() => !!searchRegex.value.highlight);

	// true 等价 'inline'：在触发器内直接输入；'popover'：弹层顶部的搜索栏
	const searchMode = computed<SearchMode>(() => {
		return props.searchable === 'popover' ? 'popover' : props.searchable ? 'inline' : '';
	});

	// 由 loadData 远程搜索：data 只是当前关键词的结果
	// loadData 是搜索回调，未开启搜索时即使传了也不调用（调用方可能总是传入，回调里再按自己的条件处理）
	const isRemote = () => remote && !!props.loadData && !!searchMode.value;

	// 远程搜索时，手上的数据是否对不上空关键词（是按某个关键词加载的）；还没加载过时为 undefined
	let isStale: boolean | undefined;

	/**
	 * 默认防抖
	 */
	const loadData = debounce(function () {
		isStale = !!searchValue.value;
		const promise = props.loadData?.(searchValue.value, instance);

		if (promise && promise.then) {
			isLoading.value = true;
			promise.finally(() => {
				isLoading.value = false;
			});
		} else {
			throw new VcError(name, 'loadData 返回值需要Promise');
		}
	}, 250, { leading: false });

	// 用户触发的打开（点击由 Popover 自身处理并通知）
	const open = () => {
		if (isActive.value || props.disabled) return;
		isActive.value = true;
		emit('visible-change', true);
	};

	const close = () => {
		isActive.value = false;
	};

	const toggle = (v?: boolean) => {
		isActive.value = typeof v === 'boolean' ? v : !isActive.value;
	};

	const handleSearch = (v: string) => {
		searchValue.value = v;
		// 弹层关闭但输入框已聚焦时，输入即打开
		v && open();
		isRemote() && loadData();
	};

	// 关闭（点击外部 / 选中 / 清空 / close / toggle）后重置搜索词，下次打开恢复完整视图，见 listeners.onClose
	// 	- 关闭不是用户发起的搜索：不调用 loadData，尚未发出的那一次也取消（否则会在关闭后发出）
	// 	- 打开时数据对不上空关键词（见 isStale；还没加载过时看有没有数据），按空关键词立即加载一次；输入而打开时只按输入的关键词搜索
	watch(isActive, (v) => {
		if (!v) {
			loadData.cancel();
		} else if (isRemote() && !searchValue.value && (isStale ?? !props.data?.length)) {
			loadData();
			loadData.flush();
		}
	});

	// 聚焦触发器内的输入框（只读或搜索）；自定义触发区时没有
	const focus = () => {
		trigger.value?.focus();
	};

	/**
	 * 弹层打开或触发器聚焦期间由统一的 Keyboard 分发，返回 true 表示已处理（不再传给其他订阅与页面）
	 * @param e ~
	 * @returns ~
	 */
	const handleKeyboard = (e: KeyboardEvent) => {
		if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return false;
		if (!isActive.value) {
			if (e.key !== 'Enter' || !isFocus.value || props.disabled) return false;
			open();
			return true;
		}

		const target = navigator?.();
		switch (e.key) {
			case 'Escape':
				close();
				// 焦点在弹层内（如树节点、弹层搜索栏）时会随弹层销毁而丢失，交还给触发器
				focus();
				return true;
			case 'Tab':
				close();
				return false;
			case 'ArrowDown':
			case 'ArrowUp':
				return target?.move?.(e.key === 'ArrowDown' ? 1 : -1) !== false;
			case 'ArrowLeft':
			case 'ArrowRight':
				// 有搜索词时左右键用于移动光标
				if (searchValue.value || !target?.shift) return false;
				return target.shift(e.key === 'ArrowRight' ? 1 : -1) !== false;
			case 'Enter':
				return target?.enter?.() !== false;
			default:
				return false;
		}
	};

	let unsubscribe: (() => void) | null = null;
	watch(
		() => isActive.value || isFocus.value,
		(v) => {
			unsubscribe?.();
			unsubscribe = v ? Keyboard.on(handleKeyboard) : null;
		}
	);
	onBeforeUnmount(() => unsubscribe?.());

	// 引用不变，不随渲染重建；组件另传的同名监听会与之合并（都执行），不必再 emit
	const listeners = {
		'onReady': () => emit('ready'),
		// 弹层关闭动画结束后才重置搜索词：淡出过程中内容保持关闭前的样子，不会先变回完整列表再消失
		// 动画结束前再次打开时沿用原来的搜索词
		'onClose': () => {
			searchValue.value = '';
			emit('close');
		},
		'onVisibleChange': () => emit('visible-change', isActive.value),
		'onUpdate:modelValue': (v: boolean) => (isActive.value = v),
		'onFocusin': () => (isFocus.value = true),
		'onFocusout': () => (isFocus.value = false)
	};

	const popover = computed(() => {
		return {
			...its.value.attrs,
			...listeners,
			modelValue: isActive.value,
			arrow: props.arrow,
			trigger: props.trigger,
			tag: props.tag,
			placement: props.placement,
			autoWidth: props.autoWidth,
			disabled: props.disabled,
			portal: props.portal,
			portalClass: [['is-padding-none', props.portalClass]],
			class: [{ 'is-disabled': props.disabled }, its.value.class, `vc-${name}`],
			style: its.value.style,
			animation: 'y'
		};
	});

	// SelectTrigger 的公共绑定；回显、占位文字、清空与移除由各组件自己传
	const triggerBinds = computed(() => {
		return {
			ref: trigger,
			name: `vc-${name}`,
			id: props.id,
			disabled: props.disabled,
			searchPlaceholder: props.searchPlaceholder,
			maxTags: props.maxTags,
			maxTagLines: props.maxTagLines,
			searchable: searchMode.value === 'inline',
			// 关闭后输入框立即显示回显；搜索词本身在弹层关闭动画结束后才重置
			searchValue: isActive.value ? searchValue.value : '',
			active: isActive.value,
			focused: isFocus.value,
			loading: isLoading.value,
			onSearch: handleSearch
		};
	});

	// SelectSearch（弹层顶部的搜索栏）的公共绑定
	const search = computed(() => {
		return {
			modelValue: searchValue.value,
			placeholder: props.searchPlaceholder,
			onSearch: handleSearch
		};
	});

	return {
		its,
		isActive,
		searchValue,
		searchRegex,
		searchMode,
		isSearching,
		isRemote,
		close,
		toggle,
		focus,
		popover,
		trigger: triggerBinds,
		search
	};
};

/**
 * 已选值在 data 里对应的信息（文字、路径等）
 * 远程搜索时 data 只是当前关键词的结果，已选值可能不在其中：记住上次查到的，查不到时沿用；只保留当前已选值的记录
 * @param isEnabled 是否沿用上次查到的（远程搜索时）
 * @returns 取值函数：values 为当前已选值，find 从当前 data 里查
 */
export const useSelectedCache = <T>(isEnabled: () => boolean) => {
	let cache = new Map<unknown, T>();

	return (values: unknown[], find: (value: any) => T | undefined | '') => {
		const isKept = isEnabled();
		const next = new Map<unknown, T>();
		values.forEach((value) => {
			const item = find(value) || (isKept ? cache.get(value) : void 0);
			item && next.set(value, item);
		});
		cache = next;
		return next;
	};
};

/**
 * Select / TreeSelect 共用：选中值与 v-model 的转换、同步、清空
 * @param select useSelect 的返回值
 * @returns ~
 */
export const useSelectValue = (select: ReturnType<typeof useSelect>) => {
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;
	const { emit } = instance;
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<Array<string | number>>([]);
	const multiple = computed(() => props.max > 1);

	/**
	 * v-model 同步, 外部的数据改变时不会触发
	 * @param labels 当前选中项的文字，随值一并抛出
	 */
	const sync = (labels: string[]) => {
		const v = toModelValue(currentValue.value, {
			modelValue: props.modelValue,
			max: props.max,
			numerable: props.numerable,
			separator: props.separator,
			nullValue: props.nullValue
		});
		emit('update:modelValue', v, labels);
		emit('change', v, labels);

		// form表单
		formItem?.change?.(currentValue.value);
	};

	const handleClear = () => {
		emit('clear');

		currentValue.value = [];
		select.isActive.value = false;

		sync([]);
	};

	watch(
		() => props.modelValue,
		(v) => {
			v = toCurrentValue(v, {
				numerable: props.numerable,
				separator: props.separator
			});
			if (isEqualWith(v, currentValue.value)) return;

			currentValue.value = v;
		},
		{ immediate: true }
	);

	return {
		currentValue,
		multiple,
		sync,
		handleClear
	};
};
