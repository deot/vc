import { getCurrentInstance, ref, computed, watch, inject } from 'vue';
import type { UploadEventMap } from '../upload/types';
import { VcError } from '../vc';
import {
	getFileType,
	IMAGE_ACCEPTS,
	VIDEO_ACCEPTS,
	AUDIO_ACCEPTS,
	DOC_ACCEPTS,
	EXCEL_ACCEPTS,
	PPT_ACCEPTS,
	PDF_ACCEPTS,
	TXT_ACCEPTS,
	HTML_ACCEPTS,
	PICKER_ITEM_KEY,
	withPickerItemKey
} from './utils';

import type { Props } from './upload-picker-props';
import type {
	PickerItem,
	PickerType,
	UploadPickerCallback
} from './types';

export const usePicker = (expose: any) => {
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;
	const { emit } = instance;
	const formItem = inject<any>('vc-form-item', {});

	const allowKeepString = computed(() => {
		return typeof props.modelValue === 'string';
	});

	const allowKeepObject = computed(() => {
		const v = props.modelValue;
		return (
			props.output === 'object'
			&& props.max === 1
			&& !Array.isArray(v)
			&& typeof v === 'object'
		);
	});

	const currentValue = ref<Record<PickerType, PickerItem[]>>({
		image: [],
		video: [],
		audio: [],
		file: [],
	});

	const currentUploadOptions = computed(() => ({
		image: {
			accept: IMAGE_ACCEPTS,
			showError: props.showError,
			...(props.uploadOptions.image || {}),
		},
		video: {
			accept: VIDEO_ACCEPTS,
			showError: props.showError,
			...(props.uploadOptions.video || {}),
		},
		audio: {
			accept: AUDIO_ACCEPTS,
			showError: props.showError,
			...(props.uploadOptions.audio || {}),
		},
		file: {
			accept: `${DOC_ACCEPTS},${EXCEL_ACCEPTS},${PPT_ACCEPTS},${PDF_ACCEPTS},${TXT_ACCEPTS},${HTML_ACCEPTS}`,
			showError: props.showError,
			...(props.uploadOptions.file || {}),
		},
	}));

	const dynamicMax = computed(() => {
		const image = currentValue.value.image || [];
		const video = currentValue.value.video || [];
		const audio = currentValue.value.audio || [];
		const file = currentValue.value.file || [];

		// 如果过滤出上传成功的文件，在上传中时，currentValue占位，达到max，upload控件仍不会隐藏，用户可以再次上传，导致会超出max
		const imageCount = image.length || 0;
		const videoCount = video.length || 0;
		const audioCount = audio.length || 0;
		const fileCount = file.length || 0;

		if (typeof props.max === 'number') {
			const curNum = imageCount + videoCount + audioCount + fileCount;
			const leftNum = props.max - curNum;
			return {
				image: leftNum,
				video: leftNum,
				audio: leftNum,
				file: leftNum,
			};
		} else if (typeof props.max === 'object') {
			const {
				image: $image,
				video: $video,
				audio: $audio,
				file: $file,
			} = props.max;
			const max: any = {};
			$image && (max.image = $image - imageCount);
			$video && (max.video = $video - videoCount);
			$audio && (max.audio = $audio - audioCount);
			$file && (max.file = $file - fileCount);
			return max;
		}
		return {};
	});

	const sync = () => {
		let v = (props.picker as any[])
			.reduce((pre, cur) => pre.concat(currentValue.value[cur] || []), [])
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

	const handleFileBefore = async (
		payload: UploadEventMap['file-before'],
		type: PickerType
	) => {
		if (props?.compressOptions?.compress && type === 'image') {
			// 图片是否压缩
			// TODO: 压缩
		}
		const onFileBefore: UploadPickerCallback['onFileBefore'] = instance.vnode.props?.onFileBefore
			|| (() => {});
		return onFileBefore({ ...payload, type });
	};

	const handleFileStart = (
		payload: UploadEventMap['file-start'],
		type: PickerType
	) => {
		const { file } = payload;
		currentValue.value[type].push(withPickerItemKey({
			...file,
			type,
			[props.keyValue.label]: file.name
		}, file.uploadId));
		emit('file-start', { ...payload, type });
	};

	const handleFileProgress = (
		{ progress, file }: UploadEventMap['file-progress'],
		type: PickerType
	) => {
		if (progress.percent <= 100) {
			currentValue.value[type] = currentValue.value[type].map((item: any) => {
				if (file.uploadId === item.uploadId) {
					return withPickerItemKey({
						...item,
						percent: progress.percent,
					}, item[PICKER_ITEM_KEY]);
				}
				return item;
			});
		}
	};

	const handleFileSuccess = (
		payload: UploadEventMap['file-success'],
		type: PickerType
	) => {
		const { response, file } = payload;
		currentValue.value[type] = currentValue.value[type].map((item) => {
			if (item.uploadId === file.uploadId) {
				const defaultItem = {
					type,
					[props.keyValue.label]: file.name,
					// 外部需要满足response中带value/source
					[props.keyValue.value]: response && typeof response === 'object'
						? Reflect.get(response, 'value') || Reflect.get(response, 'source')
						: undefined
				};
				const formatted = props.formatter?.(response, file, type);
				const result = typeof formatted === 'undefined'
					? defaultItem
					: typeof formatted === 'object'
						? { ...defaultItem, ...formatted, type }
						: { ...defaultItem, [props.keyValue.value]: formatted };
				return withPickerItemKey(result, item[PICKER_ITEM_KEY]);
			}
			return item;
		});
		emit('file-success', { ...payload, type });
	};

	const handleError = (payload: UploadEventMap['error'], type: PickerType) => {
		emit('error', { ...payload, type });
	};

	// 内部保存上传失败的文件，不传递给外层
	const handleFileError = (
		payload: UploadEventMap['file-error'],
		type: PickerType
	) => {
		if (payload.stage !== 'upload') return;

		const { cause, file } = payload;
		currentValue.value[type] = currentValue.value[type].map((item) => {
			if (item.uploadId === file.uploadId) {
				return withPickerItemKey({
					...item,
					...(cause && typeof cause === 'object' ? cause : {}),
					// 文件基础信息
					type,
					[props.keyValue.label]: file.name,
					status: 0,
					errorFlag: new Date().getTime(),
				}, item[PICKER_ITEM_KEY]);
			}
			return item;
		});
		emit('file-error', { ...payload, type });
	};

	const handleFileComplete = (
		payload: UploadEventMap['complete'],
		type: PickerType
	) => {
		sync();
		emit('complete', { ...payload, type });
	};

	const handleSortChange = (value: PickerItem[], type: PickerType) => {
		currentValue.value[type] = value;
		sync();
	};

	const handleRemove = async (index, type: PickerType) => {
		const onRemoveBefore = instance.vnode.props?.onRemoveBefore || (() => {});
		await onRemoveBefore(index, type);

		const target = currentValue.value[type];
		const item = target[index];
		if (!item) {
			throw new VcError('vc-upload-picker', '没有找到要删除的元素');
		}
		if (item.errorFlag) {
			currentValue.value[type] = target.filter(
				it => it.uploadId != item.uploadId
			);
			return;
		}
		target.splice(index, 1);

		sync();
	};

	const parseModelValue = (v) => {
		const initialData: Record<PickerType, PickerItem[]> = { image: [], video: [], audio: [], file: [] };
		if (allowKeepString.value) {
			v = (props.max === 1 ? [v] : v.split(',')).filter(i => !!i);
		} else if (allowKeepObject.value) {
			v = [v].filter(i => i && !!i[props.keyValue.value]);
		}

		if (!Array.isArray(v) || !v.length) return initialData;

		return v.reduce((pre, cur) => {
			const value = cur?.[props.keyValue.value] || (typeof cur === 'object' ? '' : cur);
			const label = cur?.[props.keyValue.label] || value.replace(/^.*\/([^/]+)$/, '$1');
			const type = cur.type || (props.picker.length === 1 ? props.picker[0] : getFileType(value)); // 长度为1时，强制类型
			switch (type) {
				case 'image':
				case 'video':
				case 'audio':
				case 'file':
					pre[type].push(withPickerItemKey({
						// 文件类型
						type,
						// 文件名
						[props.keyValue.label]: label,
						// 源文件地址
						[props.keyValue.value]: value,
						// 上传进度
						percent: null,
						// 错误标记
						errorFlag: false,
					}));
					return pre;
				default:
					return pre;
			}
		}, initialData);
	};

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = parseModelValue(v);
		},
		{ immediate: true }
	);

	expose({
		// 给enhancer (注意editor也有该方法，后续保持声明type类型)
		// // item = { value: '上传后的地址', target: '原始文件', type?: '文件类型' }
		add: (source = []) => {
			const v = parseModelValue(source);
			Object.keys(v).forEach((i: string) => {
				currentValue.value[i] = currentValue.value[i].concat(v[i]);
			});
			sync();
		},
		remove: (index, type) => handleRemove(index, type),
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
		currentUploadOptions,
		dynamicMax,

		handleRemove,
		handleFileBefore,
		handleFileStart,
		handleFileProgress,
		handleFileSuccess,
		handleFileError,
		handleError,
		handleFileComplete,
		handleSortChange,
	};
};
