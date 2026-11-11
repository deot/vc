import { getCurrentInstance, ref, computed, watch, inject, nextTick, toRaw } from 'vue';
import type { SetupContext } from 'vue';
import type { UploadEventMap } from '../upload/types';
import { VcError } from '../vc';
import { attrAccept } from '../upload/utils';
import { open as openFilePreview } from '../file-preview/open';
import { FILE_TYPES, resolveFileName, resolveFileType } from '../file-preview/utils';
import { resolveLayout, splitGroup } from '../file-preview/item';
import { ACCEPTS, PICKER_ITEM_KEY, isDoneItem, withPickerItemKey } from './utils';

import type { Props, emits } from './upload-picker-props';
import type {
	PickerItem,
	PickerType,
	UploadPickerCallback
} from './types';

export type Emits = [...typeof emits];

/**
 * UploadPicker / MUploadPicker 的状态：一个按添加顺序排列的列表，每种类型一个隐藏的 Upload
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 预览打开移动端查看器
 * @returns ~
 */
export const usePicker = (props: Props, context: SetupContext<Emits>, options: { mobile?: boolean } = {}) => {
	const { emit, expose } = context;
	// 是否传了 onFileBefore / onRemoveBefore 只能从 vnode 上读；预览回调需要组件实例
	const instance = getCurrentInstance()!;
	const formItem = inject<any>('vc-form-item', {});

	const allowKeepString = computed(() => typeof props.modelValue === 'string');

	const allowKeepObject = computed(() => {
		const v = props.modelValue;
		return (
			props.output === 'object'
			&& props.max === 1
			&& !Array.isArray(v)
			&& typeof v === 'object'
		);
	});

	// 一个有序列表：按添加顺序排列，输出、预览、排序都按这个顺序；每项带 type
	const currentValue = ref<PickerItem[]>([]);

	// 有效的类型（忽略未知的 picker 值），顺序同 picker
	const types = computed(() => props.picker.filter(type => FILE_TYPES.includes(type)));

	// 各类型 Upload 的属性：默认 accept 与 showError，uploadOptions.<type> 覆盖
	const uploadOptions = computed(() => Object.fromEntries(FILE_TYPES.map(type => [type, {
		accept: ACCEPTS[type],
		showError: props.showError,
		...props.uploadOptions[type]
	}])) as Record<PickerType, Record<string, any>>);

	// 各类型还能上传的数量（不小于 0）；上传中、失败的项也占数量，避免超出 max
	// max 为对象时未配置的类型为 0，不能上传
	const remaining = computed(() => {
		const list = currentValue.value;
		const max = props.max;
		const result = {} as Record<PickerType, number>;
		types.value.forEach((type) => {
			const left = typeof max === 'number'
				? max - list.length
				: (max?.[type] || 0) - list.filter(item => item.type === type).length;
			result[type] = Math.max(0, left);
		});
		return result;
	});

	// 还有余量的类型，顺序同 picker
	const available = computed(() => types.value.filter(type => remaining.value[type] >= 1));
	const canUpload = computed(() => !props.disabled && available.value.length > 0);

	// 唯一入口一次能选的文件：accept 为还有余量的类型的并集；max 为总数（max 为数字）或各类型余量之和
	const entry = computed(() => ({
		accept: available.value.map(type => uploadOptions.value[type].accept).filter(Boolean).join(','),
		max: typeof props.max === 'number'
			? remaining.value[available.value[0]] || 0
			: available.value.reduce((sum, type) => sum + remaining.value[type], 0)
	}));

	// 布局：不传 type 时按 picker 自动选择（只有图片、视频为 grid，只有音频、文件为 list，两者都有为 group）
	const layout = computed(() => props.type || resolveLayout(types.value));

	// group 时方格、整行分开，只在列表变化时拆分
	const sections = computed(() => {
		const [media, others] = layout.value === 'group' ? splitGroup(currentValue.value, item => item.type) : [];
		return { media, others };
	});

	// 上传成功的项（预览的顺序）与各项在列表、预览中的位置；按原始对象查找，只在列表变化时计算
	const done = computed(() => currentValue.value.filter(item => isDoneItem(item, props.keyValue.value)));
	const indexes = computed(() => {
		const position = new Map<PickerItem, number>();
		const preview = new Map<PickerItem, number>();
		currentValue.value.forEach((item, index) => position.set(toRaw(item), index));
		done.value.forEach((item, index) => preview.set(toRaw(item), index));
		return { position, preview };
	});

	const sync = () => {
		let v: any = currentValue.value
			.filter(i => !i.errorFlag)
			.map((i) => {
				if (props.output === 'string') return i[props.keyValue.value];
				if (typeof props.output === 'function') return props.output(i) || i;
				return i;
			});

		if (allowKeepString.value) {
			v = v.map(i => i[props.keyValue.value] || i).join(',');
		} else if (allowKeepObject.value) {
			v = v[0] || null; // null确保后续allowKeepObject的判断
		}

		emit('update:modelValue', v);
		emit('change', v);

		formItem.change?.(v);
	};

	const findByUploadId = (uploadId: string) => currentValue.value.findIndex(item => item.uploadId === uploadId);

	// 上传成功、失败时整项换成新对象（保留主键）
	const replace = (uploadId: string, patch: (item: PickerItem) => PickerItem) => {
		const index = findByUploadId(uploadId);
		if (index < 0) return;
		const list = currentValue.value.slice();
		list[index] = withPickerItemKey(patch(list[index]), list[index][PICKER_ITEM_KEY]);
		currentValue.value = list;
	};

	// 各类型 Upload 的事件：补上 type 后转发，按类型缓存，渲染时不再新建
	const createListeners = (type: PickerType) => ({
		onFileBefore: (payload: UploadEventMap['file-before']) => {
			const onFileBefore: UploadPickerCallback['onFileBefore'] | undefined = instance.vnode.props?.onFileBefore;
			return onFileBefore?.({ ...payload, type });
		},
		onFileStart: (payload: UploadEventMap['file-start']) => {
			const { file } = payload;
			currentValue.value = currentValue.value.concat(withPickerItemKey({
				...file,
				type,
				[props.keyValue.label]: file.name
			}, file.uploadId));
			emit('file-start', { ...payload, type });
		},
		// 进度只改这一项的 percent：只有显示进度的地方更新，余量、布局不重新计算
		onFileProgress: ({ progress, file }: UploadEventMap['file-progress']) => {
			const item = currentValue.value[findByUploadId(file.uploadId)];
			if (item && progress.percent <= 100) item.percent = progress.percent;
		},
		onFileSuccess: (payload: UploadEventMap['file-success']) => {
			const { response, file } = payload;
			replace(file.uploadId, () => {
				const defaultItem = {
					type,
					[props.keyValue.label]: file.name,
					// 外部需要满足response中带value/source
					[props.keyValue.value]: response && typeof response === 'object'
						? Reflect.get(response, 'value') || Reflect.get(response, 'source')
						: undefined
				};
				const formatted = props.formatter?.(response, file, type);
				return typeof formatted === 'undefined'
					? defaultItem
					: typeof formatted === 'object'
						? { ...defaultItem, ...formatted, type }
						: { ...defaultItem, [props.keyValue.value]: formatted };
			});
			emit('file-success', { ...payload, type });
		},
		// 内部保存上传失败的文件（保留原始文件以便重试），不传递给外层
		onFileError: (payload: UploadEventMap['file-error']) => {
			if (payload.stage !== 'upload') return;
			const { cause, file } = payload;
			replace(file.uploadId, item => ({
				...item,
				...(cause && typeof cause === 'object' ? cause : {}),
				type,
				[props.keyValue.label]: file.name,
				status: 0,
				errorFlag: new Date().getTime()
			}));
			emit('file-error', { ...payload, type });
		},
		onError: (payload: UploadEventMap['error']) => emit('error', { ...payload, type }),
		onComplete: (payload: UploadEventMap['complete']) => {
			sync();
			emit('complete', { ...payload, type });
		}
	});
	const listeners = new Map<PickerType, ReturnType<typeof createListeners>>();
	const listenersOf = (type: PickerType) => {
		listeners.has(type) || listeners.set(type, createListeners(type));
		return listeners.get(type)!;
	};

	/**
	 * 排序：value 为整个列表，或 group 时某一块（方格或整行）的新顺序；只在这些项原来的位置之间换位
	 * @param value 新的顺序
	 */
	const handleSortChange = (value: PickerItem[]) => {
		const moved = new Set(value.map(item => toRaw(item)));
		let k = 0;
		currentValue.value = currentValue.value.map(item => (moved.has(toRaw(item)) ? value[k++] : item));
		sync();
	};

	const handleRemove = async (item: PickerItem) => {
		const onRemoveBefore = instance.vnode.props?.onRemoveBefore;
		onRemoveBefore && await onRemoveBefore(currentValue.value.indexOf(item), item.type);

		currentValue.value = currentValue.value.filter(it => it !== item);
		// 失败项只在内部，不触发同步
		!item.errorFlag && sync();
	};

	// 各类型的 Upload 实例（隐藏，不渲染各自的入口）：唯一入口选好的文件分发给它们，重试也用它们重新上传
	const uploaders: Partial<Record<PickerType, any>> = {};
	const uploaderRefs = new Map<PickerType, (el: any) => void>();
	const setUploader = (type: PickerType) => {
		uploaderRefs.has(type) || uploaderRefs.set(type, (el: any) => {
			uploaders[type] = el;
		});
		return uploaderRefs.get(type)!;
	};

	/**
	 * 唯一入口选好、已通过 accept 与总数校验的文件：按各类型的 accept（picker 顺序，先匹配先得）分组，交给各自的 Upload
	 * 各类型的数量上限、大小限制、onFileBefore 等由各自的 Upload 处理
	 * @param files 选中的文件
	 */
	const distribute = (files: File[]) => {
		const groups = new Map<PickerType, File[]>();
		files.forEach((file) => {
			const type = available.value.find(it => attrAccept(file, uploadOptions.value[it].accept));
			type && groups.set(type, (groups.get(type) || []).concat(file));
		});
		groups.forEach((list, type) => uploaders[type]?.uploadFiles(list));
	};

	/**
	 * 打开某一类型的原生选择：点它的 Upload，等同于点它原来的入口（会经过该 Upload 的 enhancer）
	 * @param type 文件类型
	 */
	const pick = (type: PickerType) => {
		(uploaders[type]?.$el as HTMLElement | undefined)?.click();
	};

	// 失败项保留了上传时的原始文件（target）时才能重试
	const isRetryable = (item: PickerItem) => !!item.errorFlag && item.target instanceof Blob;

	/**
	 * 重试失败项：移除该项，等可上传数量释放出来后，用原始文件重新走一遍上传（事件、onFileBefore、uploadOptions 照旧）
	 * @param item 失败项
	 */
	const handleRetry = async (item: PickerItem) => {
		if (!isRetryable(item)) return;
		currentValue.value = currentValue.value.filter(it => it !== item);
		await nextTick();
		uploaders[item.type]?.uploadFiles([item.target as File]);
	};

	// 预览所有上传成功的项（不分类型），按列表顺序
	const handlePreview = (item: PickerItem) => {
		const current = indexes.value.preview.get(toRaw(item));
		if (current === undefined) return;
		const { label, value } = props.keyValue;
		return openFilePreview({
			current,
			instance,
			data: done.value.map(row => ({ ...row, type: row.type, source: row[value], name: row[label] })),
			// MUploadPicker 打开移动端查看器
			mobile: options.mobile
		});
	};

	// modelValue 的各项：字符串按逗号分隔，单对象包成数组
	const toEntries = (v: any): any[] => {
		if (allowKeepString.value) return (props.max === 1 ? [v] : v.split(',')).filter(i => !!i);
		if (allowKeepObject.value) return [v].filter(i => i && !!i[props.keyValue.value]);
		return Array.isArray(v) ? v : [];
	};

	const parseEntry = (cur: any): PickerItem | undefined => {
		const value = cur?.[props.keyValue.value] || (typeof cur === 'object' ? '' : cur);
		const label = cur?.[props.keyValue.label] || resolveFileName(value);
		// 只有一种类型时强制为该类型
		const type = cur?.type || (types.value.length === 1 ? types.value[0] : resolveFileType(value));
		if (!FILE_TYPES.includes(type)) return;
		return withPickerItemKey({
			type,
			[props.keyValue.label]: label,
			[props.keyValue.value]: value,
			percent: null,
			errorFlag: false
		});
	};

	const parseModelValue = (v: any) => toEntries(v).map(parseEntry).filter(Boolean) as PickerItem[];

	/**
	 * 外层的值变化时与当前列表协调：
	 * - 同一对象、同一地址的项沿用原来的项（主键不变，不重新挂载；上传时得到的名称等不丢）
	 * - 上传中的项留在原位；外层原样回写刚同步出去的值（v-model 的常规用法）时，失败项也留在原位
	 * @param v modelValue
	 */
	const reconcile = (v: any) => {
		const { label: labelKey, value: valueKey } = props.keyValue;
		const prev = currentValue.value;
		const byRaw = new Map(prev.map(item => [toRaw(item), item]));
		const byValue = new Map<string, PickerItem[]>();
		prev.forEach((item) => {
			if (!isDoneItem(item, valueKey)) return;
			const list = byValue.get(item[valueKey]);
			list ? list.push(item) : byValue.set(item[valueKey], [item]);
		});
		const used = new Set<PickerItem>();
		const next: PickerItem[] = [];
		toEntries(v).forEach((cur) => {
			const same = cur && typeof cur === 'object' ? byRaw.get(toRaw(cur)) : undefined;
			if (same && !used.has(same)) {
				used.add(same);
				next.push(same);
				return;
			}
			const item = parseEntry(cur);
			if (!item) return;
			const old = byValue.get(item[valueKey])?.find(it => !used.has(it));
			if (!old) return next.push(item);
			used.add(old);
			// 外层显式改了名称时用新的项，主键沿用
			const renamed = cur && typeof cur === 'object' && cur[labelKey] && cur[labelKey] !== old[labelKey];
			next.push(renamed ? withPickerItemKey(item, old[PICKER_ITEM_KEY]) : old);
		});

		// 回写：外层的每一项都对上了原来的项，原来同步出去的项（除失败项外）也都在
		const isEcho = used.size === next.length && prev.every(item => item.errorFlag || used.has(item));
		prev.forEach((item, index) => {
			if (used.has(item) || isDoneItem(item, valueKey) || (item.errorFlag && !isEcho)) return;
			next.splice(Math.min(index, next.length), 0, item);
		});

		if (next.length === prev.length && next.every((item, index) => item === prev[index])) return;
		currentValue.value = next;
	};

	watch(() => props.modelValue, reconcile, { immediate: true });

	expose({
		// 给enhancer (注意editor也有该方法，后续保持声明type类型)
		// // item = { value: '上传后的地址', target: '原始文件', type?: '文件类型' }
		add: (source = []) => {
			currentValue.value = currentValue.value.concat(parseModelValue(source));
			sync();
		},
		remove: (position: number) => {
			const item = currentValue.value[position];
			if (!item) {
				throw new VcError('vc-upload-picker', '没有找到要删除的元素');
			}
			return handleRemove(item);
		},
		reset: (source = []) => {
			if (!(source instanceof Array)) {
				throw new VcError('vc-upload-picker', 'reset参数要为字符串数组');
			}
			currentValue.value = parseModelValue(source);
			// form表单
			formItem.change?.(currentValue.value);
		}
	});

	return {
		currentValue,
		types,
		available,
		canUpload,
		entry,
		layout,
		sections,
		indexes,
		uploadOptions,
		remaining,
		listenersOf,
		setUploader,
		distribute,
		pick,
		isRetryable,
		handleRemove,
		handleRetry,
		handlePreview,
		handleSortChange
	};
};
