/** @jsxImportSource vue */

import { h, defineComponent, ref, reactive, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import type { AnyFunction } from '@deot/helper-shared';
import { Message } from '../message';
import { MToast } from '../toast/index.m';
import { attrAccept } from './utils';
import { getUid } from '@deot/helper-utils';
import { VcInstance, VcError } from '../vc/index';
import { props as uploadProps } from './upload-props';
import type { UploadFile } from './types';

const COMPONENT_NAME = 'vc-upload';

export const Upload = defineComponent({
	name: COMPONENT_NAME,
	props: uploadProps,
	emits: [
		'message',
		'error',
		'begin',
		'request',
		'response',
		'file-before',
		'file-start',
		'file-progress',
		'file-success',
		'file-error',
		'complete'
	],
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance()!;
		const input$ = ref<HTMLInputElement>();
		const refreshKey = ref(getUid()); // 每次上传重置，避免历史

		const requests = reactive<any>({});
		const cycle = reactive({
			error: 0,
			success: 0,
			total: 0,
			responses: [] as any[],
			queues: [] as AnyFunction[]
		});

		let isMounted = false;
		let taskManager: any;

		const setDefaultCycle = () => {
			Object.assign(cycle, {
				error: 0,
				success: 0,
				total: 0,
				responses: [],
				queues: []
			});
		};

		const emitError = async (e: any = {}, internalMessage: string) => {
			const onMessage = instance.vnode.props?.onMessage || VcInstance.options.Upload?.onMessage || (() => {});

			const message = (await onMessage(e, internalMessage));
			e.message = message || e.message || internalMessage;

			if (props.showMessage) {
				Message.error(e.message, 2500);
			} else if (props.showToast) {
				MToast.info(e.message, 2500);
			}

			emit('error', e);

			throw new VcError('vc-upload', e);
		};

		const done = (vFile: UploadFile) => {
			cycle.total++;

			// 顺序上传
			if (
				!props.parallel
				&& cycle.queues
				&& cycle.queues.length > 0
			) {
				(cycle.queues.shift())!();
			}

			// 上传完毕
			if (cycle.total === vFile.total) {
				props.showLoading && loadingInstance?.destroy?.();
				emit('complete', { ...cycle });
				setDefaultCycle();

				// taskManager
				taskManager?.setTipsStatus(true);
			}
		};

		const cancel = (file?: UploadFile | string) => {
			if (file) {
				let uid: any;
				if (typeof file === 'object' && file.uploadId) {
					uid = file.uploadId;
				} else if (typeof file === 'string') {
					uid = file;
				}

				if (requests[uid]) {
					requests[uid].cancel();
					delete requests[uid];
				}
			} else {
				Object.keys(requests).forEach((uid) => {
					if (requests[uid]) {
						requests[uid].cancel();
					}
					delete requests[uid];
				});
			}
		};

		const post = async (vFile: UploadFile) => {
			if (!isMounted) return;
			const { mode, size } = props;
			const onRequest = instance.vnode.props?.onRequest || VcInstance.options.Upload?.onRequest || (() => {});
			const onResponse = instance.vnode.props?.onResponse || VcInstance.options.Upload?.onResponse || (() => {});
			const $mode = mode.replace(/s$/, '');

			const onError = async (originalResponse: any, internalMessage: string) => {
				delete requests[vFile.uploadId];
				cycle.error++;

				emit('file-error', originalResponse, vFile, { ...cycle }, $mode);
				emitError(originalResponse, internalMessage);
				done(vFile);
				// taskManager
				taskManager?.setValue(vFile.target, 'error', internalMessage);
			};

			const onSuccess = async (request: XMLHttpRequest) => {
				try {
					let response = await onResponse(request, options) || request;
					// 如果没有钩子处理，强制转换
					if (response === request) {
						const text = request.responseType ? request.responseText : request.response;
						try { response = JSON.parse(text); } catch { response = text; }
					}

					delete requests[vFile.uploadId];
					cycle.success++;
					cycle.responses = [...cycle.responses, response];

					emit('file-success', response, vFile, { ...cycle, }, $mode);
					done(vFile);
					// taskManager
					taskManager?.setValue(vFile.target, 'success');
				} catch (e) {
					onError(e, '上传远程失败，请重试');
				}
			};

			let options = {
				url: props.url,
				headers: props.headers,
				body: {
					...props.body,
					[props.name || VcInstance.options.Upload?.name || 'file']: vFile.target
				},
				timeout: null,
				file: vFile.target
			};
			try {
				if (size && vFile.size > size * 1024 * 1024) {
					onError({}, `上传失败，大小限制为${size}MB`);
					return;
				}

				emit('file-start', vFile, $mode);

				options = await onRequest(options, instance) || options;

				const xhr = new XMLHttpRequest();

				xhr.open('POST', options.url!);
				options.timeout && (xhr.timeout = options.timeout);

				xhr.onreadystatechange = () => {
					if (xhr.readyState !== 4 || (xhr.status === 0)) return;
					if (xhr.status >= 200 && xhr.status < 300) {
						onSuccess(xhr);
					} else {
						onError({}, `服务异常`); // 服务器返回404等
					}
				};

				xhr.onabort = (e: any) => onError(e, `上传取消`);
				xhr.ontimeout = (e: any) => onError(e, `上传超时`);
				xhr.onerror = (e: any) => onError(e, `调用异常`); // CORS等

				xhr.upload.onprogress = (e: ProgressEvent) => {
					const progress = e.loaded / e.total;
					const result = {
						progress,
						percent: +((progress * 100).toFixed(2)),
						target: e
					};
					taskManager?.setValue(vFile.target, 'progress', result);
					emit('file-progress', result, vFile, $mode);
				};

				for (const header in options.headers) {
					xhr.setRequestHeader(header, options.headers[header]);
				}

				const body = new FormData();
				for (const key in options.body) {
					body.append(key, options.body[key]);
				}

				xhr.send(body);

				requests[vFile.uploadId] = {
					cancel: () => xhr && xhr.abort()
				};
			} catch (e) {
				console.log(e);
				onError(e, '上传解析失败，请重试');
			}
		};

		const upload = async (vFile: UploadFile, fileList: File[]) => {
			const { onFileBefore = () => {} } = instance.vnode.props || {};

			try {
				const vFile$ = await onFileBefore(vFile, fileList) || vFile;

				post(vFile$);
			} catch (e: any) {
				cycle.error++;
				taskManager?.setValue(vFile.target, 'error', e?.message || '上传失败');
				done(vFile);
			}
		};

		let loadingInstance: any;
		const uploadFiles = (files: FileList) => {
			let postFiles: File[] = Array.prototype.slice.call(files);

			postFiles = postFiles.filter(
				file => attrAccept(file, props.accept)
			);

			const length = postFiles.length;

			if (length === 0) {
				emitError({}, `文件格式限制：${props.accept}`);
				return;
			} else if (length > props.max) {
				emitError({}, !props.directory ? `可选文件数量不能超过${props.max}个` : `文件夹内文件的数量不能超过${props.max}个`);
				return;
			}

			// reset
			setDefaultCycle();
			props.showLoading && (loadingInstance = Message.loading('上传中...'));
			emit('begin', postFiles);

			cycle.queues = postFiles.map((file, index) => {
				const vFile: UploadFile = {
					uploadId: getUid(),
					current: index + 1,
					total: length,
					percent: 0,
					size: file.size,
					name: file.name,
					target: file
				};
				return () => {
					upload(vFile, postFiles);
				};
			});

			// 是否启用并行操作
			props.parallel
				? cycle.queues.forEach(fn => fn())
				: (cycle.queues.shift())?.();

			// taskManager
			taskManager?.show(postFiles);
		};

		const handleClick = (e: PointerEvent) => {
			const el = input$.value!;
			if ((e.target as any).tagName === 'INPUT' || !el) {
				return;
			}

			/**
			 * 渐进增强
			 */
			let { enhancer } = VcInstance.options.Upload || {};

			enhancer = props.enhancer || enhancer || (() => false);
			const allow = enhancer(instance);
			if (allow && allow.then) {
				allow.catch(() => {
					el.click?.();
				});
				return;
			}
			allow || el.click();
		};

		const handleChange = (e: InputEvent) => {
			uploadFiles((e.target as HTMLInputElement).files!);

			refreshKey.value = getUid();
		};

		const handleFileDrop = (e: InputEvent) => {
			if (e.type === 'dragover') {
				e.preventDefault();
				return;
			}
			uploadFiles(e.dataTransfer!.files);
			e.preventDefault();
		};

		// const handleKeyDown = (e: KeyboardEvent) => {
		// 	if (e.code === 'Enter' || e.keyCode === 13) {
		// 		handleClick();
		// 	}
		// };

		onMounted(() => {
			isMounted = true;
			// if (!props.showTaskManager) return;

			// let app = TaskManager.popup({
			// 	name: getUid()
			// });

			// taskManager = app.wrapper;
		});

		onUnmounted(() => {
			isMounted = false;
			taskManager?.$emit('portal-fulfilled');
			cancel();
		});

		// class
		const classes = computed(() => {
			return [
				{
					'vc-upload': true,
					'vc-upload-disabled': props.disabled,
				}
			];
		});

		const events = computed(() => {
			return props.disabled
				? {}
				: {
						onClick: handleClick,
						// keydown: handleKeyDown,
						onDrop: handleFileDrop,
						onDragover: handleFileDrop
					};
		});
		// 上传
		const inputProps = computed(() => {
			const result = {
				ref: (el: any) => (input$.value = el),
				key: refreshKey.value,
				type: 'file',
				accept: props.accept,
				multiple: props.max > 1,
				webkitdirectory: props.directory,
				style: {
					display: 'none'
				},
				onChange: handleChange
			};
			return result;
		});

		expose({
			uploadFiles,
			click: () => {
				input$.value?.click();
			}
		});
		return () => {
			return h(
				props.tag,
				{
					class: classes.value,
					...events.value
				},
				[
					h('input', inputProps.value),
					slots?.default?.()
				]
			);
		};
	}
});
