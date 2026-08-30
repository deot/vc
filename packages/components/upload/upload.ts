/** @jsxImportSource vue */

import { h, defineComponent, ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { appendFormValue, attrAccept, toUploadError } from './utils';
import { getUid } from '@deot/helper-utils';
import { VcInstance, VcError } from '../vc/index';
import { props as uploadProps } from './upload-props';
import type {
	UploadCallback,
	UploadEnhancer,
	UploadFeedback,
	UploadFile,
	UploadProgress,
	UploadRequestOptions
} from './types';
import { UploadCycle } from './cycle';
import type { UploadCycleLeaf } from './cycle';

const COMPONENT_NAME = 'vc-upload';

export const createUpload = (feedback: UploadFeedback) => defineComponent({
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

		let isMounted = false;
		const cycle = new UploadCycle(props, { emit }, feedback);

		const emitError = async (value: unknown = {}, message: string) => {
			const cause = toUploadError(value);
			const onMessage: UploadCallback['onMessage'] = instance.vnode.props?.onMessage
				|| VcInstance.options.Upload?.onMessage
				|| (() => {});

			const customMessage = await onMessage({ cause, message });
			const resolvedMessage = typeof customMessage === 'string'
				? customMessage
				: cause.message || message;
			cause.message = resolvedMessage;

			if (props.showError) {
				feedback.error(resolvedMessage, 2500);
			}

			emit('error', { cause });

			throw new VcError('vc-upload', cause);
		};

		const post = async (file: UploadFile, leaf: UploadCycleLeaf) => {
			if (!isMounted) return;
			const { size } = props;
			const onRequest: UploadCallback['onRequest'] = instance.vnode.props?.onRequest
				|| VcInstance.options.Upload?.onRequest
				|| (() => {});
			const onResponse: UploadCallback['onResponse'] = instance.vnode.props?.onResponse
				|| VcInstance.options.Upload?.onResponse
				|| (() => {});

			const finishClaimedError = (cause: unknown, message: string) => {
				if (leaf.canceled) return;

				leaf.error(file, cause, message);
				emitError(cause, message);
			};

			const onError = (cause: unknown, message: string) => {
				if (!leaf.claimSettlement(file)) return;
				finishClaimedError(cause, message);
			};

			const onSuccess = async (request?: XMLHttpRequest) => {
				if (!leaf.claimSettlement(file)) return;

				let response: unknown;
				try {
					const hookResponse = await onResponse({
						request,
						requestOptions
					});
					response = typeof hookResponse === 'undefined'
						? request
						: hookResponse;

					// 如果没有钩子处理，强制转换
					if (request && response === request) {
						const text = request.responseType ? request.responseText : request.response;
						try { response = JSON.parse(text); } catch { response = text; }
					}
				} catch (e) {
					finishClaimedError(e, '上传远程失败，请重试');
					return;
				}
				if (leaf.canceled) return;

				leaf.success(file, response);
			};

			let requestOptions: UploadRequestOptions = {
				url: props.url,
				headers: props.headers,
				body: {
					...props.body,
					[props.name || VcInstance.options.Upload?.name || 'file']: file.target
				},
				timeout: null,
				file: file.target
			};
			try {
				if (size && file.size > size * 1024 * 1024) {
					onError({}, `上传失败，大小限制为${size}MB`);
					return;
				}

				leaf.emit('file-start', {
					file
				});
				if (!isMounted || leaf.canceled) return;

				requestOptions = await onRequest({ requestOptions, instance }) || requestOptions;
				if (!isMounted || leaf.canceled) return;

				const { url } = requestOptions;
				if (typeof url === 'undefined') {
					onSuccess();
					return;
				}

				const xhr = new XMLHttpRequest();

				xhr.open('POST', url);
				requestOptions.timeout && (xhr.timeout = requestOptions.timeout);

				xhr.onreadystatechange = () => {
					if (xhr.readyState !== 4 || (xhr.status === 0)) return;
					if (xhr.status >= 200 && xhr.status < 300) {
						onSuccess(xhr);
					} else {
						onError({}, `服务异常`); // 服务器返回404等
					}
				};

				xhr.onabort = e => onError(e, `上传取消`);
				xhr.ontimeout = e => onError(e, `上传超时`);
				xhr.onerror = e => onError(e, `调用异常`); // CORS等

				xhr.upload.onprogress = (e: ProgressEvent) => {
					if (leaf.isSettled(file)) return;

					const progress = e.loaded / e.total;
					const result: UploadProgress = {
						progress,
						percent: +((progress * 100).toFixed(2)),
						target: e
					};
					file.percent = result.percent;
					leaf.emit('file-progress', {
						progress: result,
						file
					});
				};

				for (const header in requestOptions.headers) {
					xhr.setRequestHeader(header, requestOptions.headers[header]);
				}

				const body = new FormData();
				for (const key in requestOptions.body) {
					appendFormValue(body, key, requestOptions.body[key]);
				}

				if (!leaf.registerRequest(file, {
					cancel: () => xhr.abort()
				})) return;

				xhr.send(body);
			} catch (e: unknown) {
				console.log(e);
				onError(e, '上传解析失败，请重试');
			}
		};

		const upload = async (file: UploadFile, rawFiles: File[], leaf: UploadCycleLeaf) => {
			if (!isMounted || leaf.canceled) return;

			const onFileBefore: UploadCallback['onFileBefore'] = instance.vnode.props?.onFileBefore
				|| (() => {});

			try {
				const processedFile = await onFileBefore({ file, rawFiles });
				if (!isMounted || leaf.canceled) return;

				const processed = leaf.processFile(file, processedFile);
				if (processed) post(processed, leaf);
			} catch (e: unknown) {
				const message = e
					&& typeof e === 'object'
					&& 'message' in e
					&& typeof e.message === 'string'
					? e.message
					: '上传失败';
				leaf.finishPreflightError(file, message, e);
			}
		};

		const uploadFiles = (inputFiles: FileList | File[]) => {
			const rawFiles = Array.from(inputFiles).filter(
				file => attrAccept(file, props.accept)
			);

			const length = rawFiles.length;

			if (length === 0) {
				emitError({}, `文件格式限制：${props.accept}`);
				return;
			} else if (length > props.max) {
				emitError({}, !props.directory ? `可选文件数量不能超过${props.max}个` : `文件夹内文件的数量不能超过${props.max}个`);
				return;
			}

			const files = rawFiles.map((file, index): UploadFile => ({
				uploadId: getUid(),
				current: index + 1,
				total: length,
				percent: 0,
				size: file.size,
				name: file.name,
				target: file
			}));
			const leaf = cycle.create({
				rawFiles,
				files
			});
			if (!leaf) return;

			leaf.emit('begin', {
				rawFiles,
				files
			});
			if (!isMounted || !cycle.has(leaf)) return;

			leaf.setQueues(files.map((file) => {
				return () => {
					upload(file, rawFiles, leaf);
				};
			}));
			leaf.start();
		};

		const handleClick = (e: PointerEvent) => {
			const el = input$.value;
			if (e.target instanceof HTMLInputElement || !el) {
				return;
			}

			/**
			 * 渐进增强
			 */
			let enhancer: UploadEnhancer | undefined = VcInstance.options.Upload?.enhancer;

			enhancer = props.enhancer || enhancer || (() => false);
			const skip = enhancer(instance);
			if (skip && typeof skip !== 'boolean') {
				let skip$ = false;
				skip
					.then((v) => {
						skip$ = typeof v === 'undefined' ? true : !!v;
						return v;
					})
					.finally(() => {
						skip$ || el.click?.();
					});
				return;
			}
			skip || el.click();
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
		});

		onUnmounted(() => {
			isMounted = false;
			cycle.destroy();
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
				ref: (el: Element | ComponentPublicInstance | null) => {
					input$.value = el instanceof HTMLInputElement ? el : undefined;
				},
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
