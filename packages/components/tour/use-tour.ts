import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, onUnmounted, nextTick } from 'vue';
import { useScrollbar } from '@deot/vc-hooks';
import { VcInstance } from '../vc';
import type { Props } from './tour-props';
import type { TourAction, TourConfig, TourContext, TourEndType, TourSource, TourStepOptions } from './types';
import { getElement, waitForElement, saveFocus } from './utils';

interface ActiveTour {
	id: number;
	replace: () => Promise<boolean>;
	restoreFocus: () => void;
}

// 查找到的步骤：下标与目标（无目标或目标缺失时为 null）
interface Located {
	index: number;
	element: HTMLElement | null;
}

// 异步操作的凭据：开始更新的操作后失效，signal 用于中止等待
interface Task {
	signal: AbortSignal;
	isStale: () => boolean;
}

const cache = new Set<string>();
// 同时只展示一个引导：较新的打开替换当前引导，较旧的异步打开被拦截
const manager = {
	sequence: 0,
	// 最近通过打开检查的引导
	latest: 0,
	active: undefined as ActiveTour | undefined
};
const getConfig = (): TourConfig => VcInstance.options.Tour || {};

export const useTour = (
	props: Omit<Props, 'modelValue'>,
	emit: (...args: any[]) => void,
	locate: () => Promise<void>
) => {
	const isActive = ref(false);
	const isLeaving = ref(false);
	const isLoading = ref(false);
	const current = ref(0);
	const element = shallowRef<HTMLElement | null>(null);
	const steps = computed(() => props.steps as TourStepOptions[]);
	const record = computed(() => steps.value[current.value]);
	const isLast = computed(() => current.value === steps.value.length - 1);
	let id = 0;
	let isDisposed = false;
	let restoreFocus = () => {};

	/**
	 * 合并步骤参数，保留显式假值。
	 * @param step 当前步骤
	 * @returns 当前步骤的完整配置
	 */
	const resolveOptions = (step?: TourStepOptions): any => {
		return {
			...props,
			...Object.fromEntries(Object.entries(step || {}).filter(([, value]) => value !== undefined))
		};
	};
	const options = computed(() => resolveOptions(record.value));

	const getContext = (): TourContext => ({
		current: current.value,
		total: steps.value.length,
		step: options.value,
		element: element.value
	});
	const emitError = (error: any, phase: string) => {
		!isDisposed && emit('error', {
			error,
			phase,
			current: current.value
		});
	};

	useScrollbar(computed(() => isActive.value && !props.scrollable));

	// 每个异步操作递增 revision；中止会话与卸载同样递增，因此凭据只需比较 revision
	let session = new AbortController();
	let revision = 0;
	// 初始查找的中止控制，见 findInitial
	let search = new AbortController();
	const createTask = (): Task => {
		const token = revision;
		return {
			signal: session.signal,
			isStale: () => token !== revision
		};
	};
	// 中止进行中的异步操作（含初始查找），并使之前的凭据失效
	const resetSession = () => {
		session.abort();
		search.abort();
		session = new AbortController();
		revision++;
	};
	/**
	 * 执行异步操作：期间标记加载中，结束时仅由最新的操作复位
	 * @param fn 操作，收到本次的凭据
	 * @param reset 先中止进行中的操作
	 * @returns 操作结果
	 */
	const run = async <T>(fn: (task: Task) => Promise<T>, reset = false) => {
		reset ? resetSession() : revision++;
		const task = createTask();
		isLoading.value = true;
		try {
			return await fn(task);
		} finally {
			if (!task.isStale()) isLoading.value = false;
		}
	};

	const getCacheKey = () => typeof props.cache === 'string' && props.cache ? props.cache : undefined;
	// 全局缓存开关关闭时不读写
	const getActiveCacheKey = () => getConfig().cache !== false ? getCacheKey() : undefined;
	const readCache = async () => {
		const key = getActiveCacheKey();
		if (!key) return false;
		try {
			const getter = getConfig().getCache;
			return getter ? await getter({ cacheKey: key }) : cache.has(key);
		} catch (error) {
			emitError(error, 'getCache');
			return false;
		}
	};
	const writeCache = async (type: TourEndType) => {
		const key = getActiveCacheKey();
		const types = props.cacheTypes ?? getConfig().cacheTypes ?? ['finish', 'skip'];
		if (!key || !types.includes(type)) return;
		try {
			const setter = getConfig().setCache;
			if (setter) {
				await setter({
					cacheKey: key,
					type
				});
			} else {
				cache.add(key);
			}
		} catch (error) {
			emitError(error, 'setCache');
		}
	};

	const getTarget = (step: any) => {
		try {
			return getElement(step.element);
		} catch (error) {
			emitError(error, 'element');
			return null;
		}
	};

	// 从 index 起按 direction 查找第一个可展示的步骤：等待目标出现，目标缺失且 skipMissingElement 时跳过
	const findStep = async (index: number, direction: number, signal: AbortSignal): Promise<Located | null> => {
		for (let cursor = index; cursor >= 0 && cursor < steps.value.length; cursor += direction) {
			if (signal.aborted || isDisposed) return null;
			const stepOptions = resolveOptions(steps.value[cursor]);
			let target = getTarget(stepOptions);
			if (stepOptions.element && !target && stepOptions.waitForElement > 0) {
				target = await waitForElement(() => getTarget(stepOptions), stepOptions.waitForElement, signal);
			}
			if (signal.aborted || isDisposed) return null;
			if (stepOptions.element && !target && stepOptions.skipMissingElement) continue;
			return {
				index: cursor,
				element: target
			};
		}
		return null;
	};

	// 初始步骤：从 current 起向后查找，找不到时从第一步查找；查找期间 current 变化则中止并按最新值重新查找
	const findInitial = async (task: Task) => {
		let located: Located | null;
		do {
			search = new AbortController();
			const index = Math.max(0, Math.min(props.current ?? 0, steps.value.length - 1));
			located = await findStep(index, 1, search.signal) ?? (index > 0 ? await findStep(0, 1, search.signal) : null);
		} while (search.signal.aborted && !task.isStale());
		return located;
	};

	const settleHidden = (type: 'cached' | 'blocked' | 'empty') => {
		emit('update:modelValue', false);
		emit('portal-fulfilled', {
			type,
			current: null
		});
	};

	const release = () => {
		if (manager.active?.id === id) manager.active = undefined;
	};

	// 切到查找到的步骤并定位；首次展示通知 ready，之后通知 change
	const setStep = async (located: Located, task: Task, initial = false) => {
		current.value = located.index;
		element.value = located.element;
		const scrollOptions = options.value.scrollIntoViewOptions;
		if (scrollOptions !== false) element.value?.scrollIntoView?.(scrollOptions);
		emit('update:current', current.value);
		await nextTick();
		if (task.isStale() || !isActive.value) return false;
		await locate();
		if (task.isStale() || !isActive.value) return false;
		if (initial) emit('ready', getContext());
		else emit('change', current.value, getContext());
		return true;
	};

	// 隐藏卡片并等待退出动画结束（TransitionFade 的 afterLeave），会话中止时提前结束
	let resolveLeave: (() => void) | undefined;
	const handleAfterLeave = () => resolveLeave?.();
	const waitForLeave = (signal: AbortSignal) => new Promise<void>((resolve) => {
		const done = () => {
			signal.removeEventListener('abort', done);
			if (resolveLeave === done) resolveLeave = undefined;
			resolve();
		};
		resolveLeave = done;
		signal.addEventListener('abort', done, { once: true });
		isLeaving.value = true;
	});

	/**
	 * 结束引导：写缓存 → 等待退出动画 → 复位 → 通知
	 * @param type 结束类型
	 * @param source 触发来源
	 * @param force 中止进行中的操作，不写缓存（被替换时）
	 * @returns 是否已结束
	 */
	const end = async (type: TourEndType, source: TourSource, force = false) => {
		if (isDisposed || !isActive.value) return false;
		if (force) resetSession();
		const task = createTask();
		const detail = {
			...getContext(),
			type,
			source
		};
		const step = record.value;
		isLoading.value = true;
		if (!force) await writeCache(type);
		if (task.isStale()) return false;
		await waitForLeave(task.signal);
		if (task.isStale()) return false;
		isActive.value = false;
		isLoading.value = false;
		isLeaving.value = false;
		release();
		await nextTick();
		if (source !== 'replace') restoreFocus();
		emit('update:modelValue', false);
		emit('visible-change', false);
		if (type !== 'close') emit(type, detail);
		try {
			step?.onClose?.(detail);
		} catch (error) {
			emitError(error, 'action');
		}
		emit('close', detail);
		emit('portal-fulfilled', {
			type,
			current: detail.current
		});
		return true;
	};
	// 外部关闭：异步操作期间拒绝
	const handleClose = (source: TourSource = 'api') => isLoading.value ? Promise.resolve(false) : end('close', source);

	// 打开检查：拦截 → 缓存 → 初始步骤 → 是否已有更新的引导，通过后替换当前引导并展示
	const handleOpen = () => run(async (task) => {
		id = ++manager.sequence;
		// 查找初始步骤并确认没有更新的引导；不展示时结算并返回 null
		const claim = async () => {
			const located = await findInitial(task);
			if (task.isStale()) return null;
			if (!located) settleHidden('empty');
			else if (id < manager.latest) settleHidden('blocked');
			else return located;
			return null;
		};
		try {
			const detail = {
				cacheKey: getCacheKey(),
				steps: [...steps.value]
			};
			for (const gate of [getConfig().onOpen, props.onOpen]) {
				const result = await gate?.(detail);
				if (task.isStale()) return;
				if (result === false) return settleHidden('blocked');
			}
			const isCached = await readCache();
			if (task.isStale()) return;
			if (isCached) return settleHidden('cached');
			let located = await claim();
			if (!located) return;
			manager.latest = id;
			const previous = manager.active;
			const previousFocus = previous ? saveFocus(previous.restoreFocus) : undefined;
			await previous?.replace();
			if (task.isStale()) return;
			if (id < manager.latest) return settleHidden('blocked');
			// 等待替换期间 current 变化，按最新值重新查找
			if (search.signal.aborted) {
				located = await claim();
				if (!located) return;
			}
			restoreFocus = previousFocus || saveFocus();
			manager.active = {
				id,
				replace: () => end('close', 'replace', true),
				restoreFocus
			};
			isActive.value = true;
			emit('visible-change', true);
			await setStep(located, task, true);
		} catch (error) {
			if (!task.isStale()) {
				emitError(error, 'open');
				settleHidden('blocked');
			}
		}
	}, true);

	const callAction = async (action: TourAction, next: number | null, source: TourSource, event?: Event) => {
		const button = options.value[`${action}ButtonOptions`];
		if (button?.disabled) return false;
		try {
			const detail = {
				...getContext(),
				next,
				source
			};
			return await button?.onClick?.(event, detail) !== false;
		} catch (error) {
			emitError(error, 'action');
			return false;
		}
	};

	const handleAction = async (action: TourAction, source: TourSource = 'api', event?: Event) => {
		if (isDisposed || !isActive.value || isLoading.value) return false;
		const operation = action === 'next' && isLast.value ? 'finish' : action;
		const direction = operation === 'previous' ? -1 : 1;
		const destination = operation === 'next' || operation === 'previous' ? current.value + direction : null;
		if (destination !== null && destination < 0) return false;
		return run(async (task) => {
			if (!await callAction(operation, destination, source, event) || task.isStale()) return false;
			if (operation === 'finish' || operation === 'skip') return end(operation, source);
			const located = await findStep(destination!, direction, task.signal);
			if (task.isStale()) return false;
			if (located) return setStep(located, task);
			// 后续步骤全部缺失（被跳过）：按完成处理
			if (operation === 'previous' || !await callAction('finish', null, source, event) || task.isStale()) return false;
			return end('finish', source);
		});
	};

	const goTo = async (index: number) => {
		const isInvalid = !Number.isInteger(index) || index < 0 || index >= steps.value.length || index === current.value;
		if (isDisposed || !isActive.value || isLoading.value || isInvalid) return false;
		return run(async (task) => {
			const located = await findStep(index, index < current.value ? -1 : 1, task.signal);
			if (!located || task.isStale()) return false;
			return setStep(located, task);
		});
	};

	const refresh = async () => {
		if (!isActive.value || isDisposed) return;
		const target = getTarget(options.value);
		if (options.value.element && !target && options.value.skipMissingElement && !isLoading.value) {
			await handleAction('next');
			return;
		}
		element.value = target;
		await nextTick();
		await locate();
	};

	// 打开前：current 变化时同步中止初始查找（不必等到目标等待超时），见 findInitial
	watch(
		() => props.current,
		() => search.abort(),
		{ flush: 'sync' }
	);

	// 打开后：current 变化时切步，未能切换时回写实际下标
	watch(
		() => props.current,
		async (value) => {
			if (value === undefined || !isActive.value) return;
			if (!await goTo(value) && !isDisposed && isActive.value && Object.is(props.current, value) && value !== current.value) {
				emit('update:current', current.value);
			}
		}
	);

	watch(
		() => isActive.value ? getTarget(options.value) : null,
		(target) => {
			if (isActive.value && target !== element.value) void refresh();
		}
	);

	onMounted(async () => {
		await nextTick();
		!isDisposed && await handleOpen();
	});
	onBeforeUnmount(() => {
		isDisposed = true;
		resetSession();
		release();
	});
	onUnmounted(() => {
		if (isActive.value) restoreFocus();
	});

	return {
		isActive,
		isLeaving,
		isLoading,
		handleAfterLeave,
		current,
		element,
		steps,
		isLast,
		options,
		record,
		getContext,
		handleAction,
		refresh,
		// 实例方法与插槽中的导航方法
		api: {
			next: () => handleAction('next'),
			previous: () => handleAction('previous'),
			goTo,
			finish: () => handleAction('finish'),
			skip: () => handleAction('skip')
		},
		// 不接收参数，插槽中 @click="close" 时事件对象不会被当作 source
		close: () => handleClose(),
		handleClose
	};
};
