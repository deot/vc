import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, onUnmounted, nextTick } from 'vue';
import { useScrollbar } from '@deot/vc-hooks';
import { VcInstance } from '../vc';
import type { Props } from './tour-props';
import type { TourAction, TourContext, TourEndType, TourSource, TourStepOptions } from './types';
import { getElement, waitForElement, saveFocus } from './utils';

const cache = new Set<string>();
let sequence = 0;
let activeId = 0;
let activeTour: {
	id: number;
	replace: () => Promise<boolean>;
	restoreFocus: () => void;
} | undefined;

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
	let session = new AbortController();
	let revision = 0;
	let id = 0;
	let isDisposed = false;
	let restoreFocus = () => {};
	let resolveLeave: (() => void) | undefined;
	const handleAfterLeave = () => resolveLeave?.();

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
	// 异步等待后，实例已卸载、会话已中止或已有更新的操作时放弃
	const isStale = (token: number, signal: AbortSignal) => isDisposed || signal.aborted || token !== revision;
	// 中止进行中的异步操作，并使之前的 token 失效
	const resetSession = () => {
		session.abort();
		session = new AbortController();
		return ++revision;
	};
	/**
	 * 执行异步导航：期间标记加载中，结束时仅由最新的操作复位
	 * @param task 导航任务，收到本次的 token 与 signal
	 * @returns 任务结果
	 */
	const run = async <T>(task: (token: number, signal: AbortSignal) => Promise<T>) => {
		const token = ++revision;
		const signal = session.signal;
		isLoading.value = true;
		try {
			return await task(token, signal);
		} finally {
			if (token === revision) isLoading.value = false;
		}
	};
	const getCacheKey = () => typeof props.cache === 'string' && props.cache ? props.cache : undefined;
	// 全局缓存开关关闭时不读写
	const getActiveCacheKey = () => VcInstance.options.Tour?.cache !== false ? getCacheKey() : undefined;

	useScrollbar(computed(() => isActive.value && !props.scrollable));

	const getTarget = (step: any) => {
		try {
			return getElement(step.element);
		} catch (error) {
			emitError(error, 'element');
			return null;
		}
	};

	const findStep = async (index: number, direction: number, signal: AbortSignal) => {
		for (let cursor = index; cursor >= 0 && cursor < steps.value.length; cursor += direction) {
			if (signal.aborted || isDisposed) return null;
			const step = resolveOptions(steps.value[cursor]);
			let target = getTarget(step);
			if (step.element && !target && step.waitForElement > 0) {
				target = await waitForElement(() => getTarget(step), step.waitForElement, signal);
			}
			if (signal.aborted || isDisposed) return null;
			if (step.element && !target && step.skipMissingElement) continue;
			return {
				current: cursor,
				element: target
			};
		}
		return null;
	};

	const settleHidden = (type: 'cached' | 'blocked' | 'empty') => {
		emit('update:modelValue', false);
		emit('portal-fulfilled', {
			type,
			current: null
		});
	};

	const setStep = async (step: any, initial = false) => {
		const token = revision;
		current.value = step.current;
		element.value = step.element;
		const scrollOptions = options.value.scrollIntoViewOptions;
		if (scrollOptions !== false) element.value?.scrollIntoView?.(scrollOptions);
		emit('update:current', current.value);
		await nextTick();
		if (token !== revision || !isActive.value || isDisposed) return false;
		await locate();
		if (token !== revision || !isActive.value || isDisposed) return false;
		if (initial) emit('ready', getContext());
		else emit('change', current.value, getContext());
		return true;
	};

	const handleEnd = async (type: TourEndType, source: TourSource, force = false) => {
		if (isDisposed || !isActive.value || (isLoading.value && !force)) return false;
		if (force) resetSession();
		const token = revision;
		const signal = session.signal;
		const detail = {
			...getContext(),
			type,
			source
		};
		const step = record.value;
		isLoading.value = true;
		const types = props.cacheTypes ?? VcInstance.options.Tour?.cacheTypes ?? ['finish', 'skip'];
		const key = getActiveCacheKey();
		if (!force && key && types.includes(type)) {
			try {
				const setter = VcInstance.options.Tour?.setCache;
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
		}
		if (isStale(token, signal)) return false;
		await new Promise<void>((resolve) => {
			const done = () => {
				signal.removeEventListener('abort', done);
				if (resolveLeave === done) resolveLeave = undefined;
				resolve();
			};
			resolveLeave = done;
			signal.addEventListener('abort', done, { once: true });
			isLeaving.value = true;
		});
		if (isStale(token, signal)) return false;
		isActive.value = false;
		isLoading.value = false;
		isLeaving.value = false;
		if (activeTour?.id === id) activeTour = undefined;
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

	const handleOpen = async () => {
		if (isActive.value || isDisposed) return;
		const token = resetSession();
		const signal = session.signal;
		id = ++sequence;
		isLoading.value = true;
		let initialSearch: AbortController | undefined;
		const stopInitial = watch(
			() => props.current,
			() => initialSearch?.abort(),
			{ flush: 'sync' }
		);
		const findInitial = async () => {
			let step: any;
			do {
				initialSearch = new AbortController();
				const search = initialSearch;
				const abort = () => search.abort();
				signal.aborted ? abort() : signal.addEventListener('abort', abort, { once: true });
				try {
					const initial = Math.max(0, Math.min(props.current ?? 0, steps.value.length - 1));
					step = await findStep(initial, 1, search.signal) ?? (initial > 0 ? await findStep(0, 1, search.signal) : null);
				} finally {
					signal.removeEventListener('abort', abort);
				}
			} while (initialSearch.signal.aborted && !signal.aborted && !isDisposed);
			return step;
		};
		try {
			const detail = {
				cacheKey: getCacheKey(),
				steps: [...steps.value]
			};
			for (const gate of [VcInstance.options.Tour?.onOpen, props.onOpen]) {
				const result = await gate?.(detail);
				if (isStale(token, signal)) return;
				if (result === false) return settleHidden('blocked');
			}
			const key = getActiveCacheKey();
			if (key) {
				let isCached = false;
				try {
					const getter = VcInstance.options.Tour?.getCache;
					isCached = getter ? await getter({ cacheKey: key }) : cache.has(key);
				} catch (error) {
					emitError(error, 'getCache');
				}
				if (isStale(token, signal)) return;
				if (isCached) return settleHidden('cached');
			}
			let step = await findInitial();
			if (isStale(token, signal)) return;
			if (!step) return settleHidden('empty');
			if (id < activeId) return settleHidden('blocked');
			activeId = id;
			const previousTour = activeTour;
			const previousFocus = previousTour ? saveFocus(previousTour.restoreFocus) : undefined;
			await previousTour?.replace();
			if (isStale(token, signal)) return;
			if (id < activeId) return settleHidden('blocked');
			if (initialSearch?.signal.aborted) {
				step = await findInitial();
				if (isStale(token, signal)) return;
				if (!step) return settleHidden('empty');
				if (id < activeId) return settleHidden('blocked');
			}
			restoreFocus = previousFocus || saveFocus();
			activeTour = {
				id,
				replace: () => handleEnd('close', 'replace', true),
				restoreFocus
			};
			isActive.value = true;
			// 监听在 await 之后创建，不随组件卸载停止：初始查找结束即停止，不依赖 setStep 完成
			stopInitial();
			emit('visible-change', true);
			await setStep(step, true);
		} catch (error) {
			if (!isDisposed && !signal.aborted) {
				emitError(error, 'open');
				settleHidden('blocked');
			}
		} finally {
			stopInitial();
			if (token === revision) isLoading.value = false;
		}
	};

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
		const destination = operation === 'next' ? current.value + 1 : operation === 'previous' ? current.value - 1 : null;
		if (destination !== null && destination < 0) return false;
		// 结束前先释放加载状态，handleEnd 会重新标记
		const end = (type: 'finish' | 'skip') => {
			isLoading.value = false;
			return handleEnd(type, source);
		};
		return run(async (token, signal) => {
			if (!await callAction(operation, destination, source, event)) return false;
			if (isStale(token, signal)) return false;
			if (operation === 'finish' || operation === 'skip') return end(operation);
			const step = await findStep(destination!, operation === 'previous' ? -1 : 1, signal);
			if (isStale(token, signal)) return false;
			if (!step) {
				if (operation === 'previous' || !await callAction('finish', null, source, event)) return false;
				if (isStale(token, signal)) return false;
				return end('finish');
			}
			return setStep(step);
		});
	};

	const goTo = async (index: number) => {
		const isInvalid = !Number.isInteger(index) || index < 0 || index >= steps.value.length || index === current.value;
		if (isDisposed || !isActive.value || isLoading.value || isInvalid) return false;
		return run(async (token, signal) => {
			const step = await findStep(index, index < current.value ? -1 : 1, signal);
			if (!step || isStale(token, signal)) return false;
			return setStep(step);
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
		await handleOpen();
	});
	onBeforeUnmount(() => {
		isDisposed = true;
		resetSession();
		if (activeTour?.id === id) activeTour = undefined;
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
		close: () => handleEnd('close', 'api'),
		handleClose: (source: TourSource = 'api') => handleEnd('close', source)
	};
};
