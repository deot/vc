import { getCurrentInstance, ref, computed, watch, inject } from 'vue';
import type { UploadFile } from '../upload/types';
import { recognizer, FILE_ACCEPT_MAP } from './utils';
import type { Props } from './upload-picker-props';
import { Message } from '../message';

const {
	DOC_ACCEPTS,
	EXCEL_ACCEPTS,
	PPT_ACCEPTS,
	PDF_ACCEPTS,
	TXT_ACCEPTS,
	HTML_ACCEPTS,
} = FILE_ACCEPT_MAP;

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

	const currentValue = ref({
		image: [],
		video: [],
		audio: [],
		file: [],
	});

	const currentUploadOptions = ref({
		image: {
			accept: 'image/gif,image/jpeg,image/jpg,image/png',
			...(props.uploadOptions.image || {}),
		},
		video: {
			accept: 'video/*',
			...(props.uploadOptions.video || {}),
		},
		audio: {
			accept: 'audio/*',
			...(props.uploadOptions.audio || {}),
		},
		file: {
			accept: `${DOC_ACCEPTS},${EXCEL_ACCEPTS},${PPT_ACCEPTS},${PDF_ACCEPTS},${TXT_ACCEPTS},${HTML_ACCEPTS}`,
			...(props.uploadOptions.file || {}),
		},
	});

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

	const handleFileBefore = async (vFile: UploadFile, fileList: File[], type: string) => {
		if (props?.compressOptions?.compress && type === 'image') {
			// 图片是否压缩
			// TODO: 压缩
		}
		const onFileBefore = instance.vnode.props?.onFileBefore || (() => {});
		return (await onFileBefore(vFile, fileList, type)) || vFile;
	};

	const handleFileStart = (vFile: UploadFile, type: string) => {
		currentValue.value[type].push(vFile);
		emit('file-start', vFile, type);
	};

	const handleFileProgress = (e: any, vFile: UploadFile, type: string) => {
		if (parseInt(e.percent, 10) <= 100) {
			currentValue.value[type] = currentValue.value[type].map((item: any) => {
				if (vFile.uploadId === item.uploadId) {
					return {
						...item,
						percent: e.percent,
					};
				}
				return item;
			});
		}
	};

	const handleFileSuccess = (response: any, vFile: UploadFile, cycle: any, type: any) => {
		currentValue.value[type] = currentValue.value[type].map((item) => {
			if (item.uploadId === vFile.uploadId) {
				return {
					type,
					[props.keyValue.label]: vFile.name,
					// 外部需要满足response中带value/source
					[props.keyValue.value]: response.value || response.source
				};
			}
			return item;
		});
		emit('file-success', response, vFile, cycle, type);
	};

	const handleError = (err, type) => {
		props.showMessage
		&& err.message
		&& Message.error(err.message);
		emit('error', err, type);
	};

	// 内部保存上传失败的文件，不传递给外层
	const handleFileError = (response, vFile, cycle, type) => {
		currentValue.value[type] = currentValue.value[type].map((item) => {
			if (item.uploadId === vFile.uploadId) {
				return {
					...item,
					...response,
					// 文件基础信息
					type,
					[props.keyValue.label]: vFile.name,
					errorFlag: new Date().getTime(),
				};
			}
			return item;
		});
		emit('file-error', response, vFile, cycle, type);
	};

	const handleFileComplete = (response, type) => {
		sync();
		emit('complete', response, type);
	};

	const handleDelete = async (index, type) => {
		const onRemoveBefore = instance.vnode.props?.onRemoveBefore || (() => {});
		await onRemoveBefore(index, type);

		const target = currentValue.value[type];
		const item = target[index];
		if (!item) {
			console.error('【vc-upload-picker】: 没有找到要删除的元素');
			return;
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
		const initialData = { image: [], video: [], audio: [], file: [] };
		if (allowKeepString.value) {
			v = (props.max === 1 ? [v] : v.split(',')).filter(i => !!i);
		} else if (allowKeepObject.value) {
			v = [v].filter(i => i && !!i[props.keyValue.value]);
		}

		if (!Array.isArray(v) || !v.length) return initialData;

		return v.reduce((pre, cur) => {
			const value = cur[props.keyValue.value] || (typeof cur === 'object' ? '' : cur);
			const label = cur[props.keyValue.label] || value.replace(/^.*\/([^/]+)$/, '$1');
			const type = cur.type || (props.picker.length === 1 ? props.picker[0] : recognizer(value)); // 长度为1时，强制类型
			switch (type) {
				case 'image':
				case 'video':
				case 'audio':
				case 'file':
					pre[type].push({
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
					});
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
		add: () => {},
		remove: () => {},
		reset: () => {}
	});
	return {
		currentValue,
		currentUploadOptions,
		dynamicMax,

		handleDelete,
		handleFileBefore,
		handleFileStart,
		handleFileProgress,
		handleFileSuccess,
		handleFileError,
		handleError,
		handleFileComplete,
	};
};
