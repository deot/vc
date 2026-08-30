// @vitest-environment jsdom

import { vi } from 'vitest';
import {
	Message,
	MToast,
	MUpload,
	Portal,
	Upload,
	VcInstance
} from '@deot/vc-components';
import type {
	UploadCallback,
	UploadCycleResult,
	UploadFile,
	UploadFileBeforeResult,
	UploadRequestOptions
} from '../types';

import { UploadTaskView, UploadTask } from '../task';
import { UploadTaskContext } from '../task/context';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const flush = async () => {
	for (let i = 0; i < 8; i++) {
		await nextTick();
		await Promise.resolve();
	}
};

const expectPending = async (target: PromiseLike<unknown>) => {
	let settled = false;
	target.then(
		() => {
			settled = true;
		},
		() => {
			settled = true;
		}
	);
	await flush();
	expect(settled).toBe(false);
};

const createFile = (name = 'a.png', type = 'image/png', size?: number) => {
	const file = new File(['hello world'], name, { type });
	if (typeof size === 'number') {
		Object.defineProperty(file, 'size', { value: size, configurable: true });
	}
	return file;
};

class MockXHR {
	static instances: MockXHR[] = [];

	upload: any = {};
	readyState = 0;
	status = 0;
	response: any = '';
	responseText = '';
	responseType = '';
	timeout = 0;
	onreadystatechange: any = null;
	onabort: any = null;
	ontimeout: any = null;
	onerror: any = null;
	method = '';
	url = '';
	body: any = null;
	headers: Record<string, string> = {};
	aborted = false;

	constructor() {
		MockXHR.instances.push(this);
	}

	open(method: string, url: string) {
		this.method = method;
		this.url = url;
	}

	setRequestHeader(key: string, value: string) {
		this.headers[key] = value;
	}

	send(body: any) {
		this.body = body;
	}

	abort() {
		this.aborted = true;
		this.onabort?.({});
	}

	// helpers
	emitProgress(loaded: number, total: number) {
		this.upload?.onprogress?.({ loaded, total });
	}

	emitResponse(status: number, text = '') {
		this.readyState = 4;
		this.status = status;
		this.response = text;
		this.responseText = text;
		this.onreadystatechange?.();
	}
}

describe('index.ts', () => {
	afterEach(() => {
		UploadTask.destroy();
		Portal.clearAll();
		document.body.innerHTML = '';
		VcInstance.options.Upload = undefined as any;
		MockXHR.instances = [];
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('basic', () => {
		expect(typeof Upload).toBe('object');
		expect(typeof Upload.open).toBe('function');
		expect(typeof MUpload).toBe('object');
		expect(typeof MUpload.open).toBe('function');
		expect(Reflect.has(Upload, 'Task')).toBe(false);
		expect(Reflect.get(Upload, 'props')).toHaveProperty('showError');
		expect(Reflect.get(MUpload, 'props')).toHaveProperty('showError');
		expect(Reflect.get(Upload, 'props')).not.toHaveProperty('onFileBefore');
		expect(Reflect.get(Upload, 'props')).not.toHaveProperty('onComplete');
		expect(Reflect.get(Upload, 'emits')).toEqual([
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
		]);
	});

	it('Upload.open 正常完成时 resolve，被替换或销毁时保持 pending', async () => {
		const completed = Upload.open({ silent: true });
		completed.wrapper?.uploadFiles([createFile('completed.png')]);
		await expect(completed).resolves.toMatchObject({ succeeded: 1, failed: 0, total: 1 });

		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const canceled = Upload.open({ silent: true, url: 'https://x.com/upload' });
		canceled.wrapper?.uploadFiles([createFile('canceled.png')]);
		await flush();
		expect(MockXHR.instances).toHaveLength(1);

		const replacement = Upload.open({ silent: true });
		expect(MockXHR.instances[0].aborted).toBe(true);
		await expectPending(canceled);

		replacement.destroy();
		await expectPending(replacement);
	});

	it('MUpload.open 使用移动端 Loading 且不影响桌面 Portal', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const destroy = vi.fn();
		const toastLoading = vi.spyOn(MToast, 'loading')
			.mockReturnValue({ destroy } as any);
		const messageLoading = vi.spyOn(Message, 'loading');
		const desktop = Upload.open({
			silent: true,
			url: 'https://x.com/upload'
		});
		desktop.wrapper?.uploadFiles([createFile('desktop.png')]);
		await flush();
		expect(MockXHR.instances).toHaveLength(1);

		const mobile = MUpload.open({
			silent: true,
			showLoading: true
		});

		mobile.wrapper?.uploadFiles([createFile('mobile.png')]);
		await expect(mobile).resolves.toMatchObject({ succeeded: 1, total: 1 });
		expect(toastLoading).toHaveBeenCalledWith('上传中...');
		expect(messageLoading).not.toHaveBeenCalled();
		expect(destroy).toHaveBeenCalledTimes(1);
		expect(MockXHR.instances[0].aborted).toBe(false);

		desktop.destroy();
		expect(MockXHR.instances[0].aborted).toBe(true);
		await expectPending(desktop);
	});

	it('Upload.open 隔离组件 name/tag，且不同 name 仍替换同一 Portal', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const first = Upload.open({
			silent: true,
			url: 'https://x.com/upload',
			name: 'avatar',
			tag: 'section'
		});
		first.wrapper?.uploadFiles([createFile('avatar.png')]);
		await flush();

		expect(first.wrapper?.$el.tagName).toBe('SECTION');
		expect(MockXHR.instances[0].body.get('avatar')).toBeInstanceOf(File);
		const second = Upload.open({
			silent: true,
			url: 'https://x.com/upload',
			name: 'document'
		});

		expect(MockXHR.instances[0].aborted).toBe(true);
		await expectPending(first);
		second.destroy();
		await expectPending(second);
	});

	it('Upload.open 全部失败时 reject，部分成功时 resolve', async () => {
		const failed = Upload.open({
			silent: true,
			onFileBefore: () => false
		});
		failed.wrapper?.uploadFiles([createFile('failed.png')]);
		await expect(failed).rejects.toMatchObject({ succeeded: 0, failed: 1, total: 1 });

		const mixed = Upload.open({
			silent: true,
			max: 2,
			onFileBefore: ({ file }) => file.current === 1 ? false : undefined
		});
		mixed.wrapper?.uploadFiles([
			createFile('failed.png'),
			createFile('success.png')
		]);
		await expect(mixed).resolves.toMatchObject({ succeeded: 1, failed: 1, total: 2 });
	});

	it('create', () => {
		const wrapper = mount(() => (<Upload />));

		expect(wrapper.classes()).toContain('vc-upload');
		expect(wrapper.element.tagName.toLowerCase()).toBe('span');
	});
});

describe('Upload 渲染 & props', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		VcInstance.options.Upload = undefined as any;
		vi.restoreAllMocks();
	});

	it('tag 支持自定义标签', () => {
		const wrapper = mount(Upload, { props: { tag: 'div' } as any });
		expect(wrapper.element.tagName.toLowerCase()).toBe('div');
		expect(wrapper.classes()).toContain('vc-upload');
	});

	it('disabled: 添加 vc-upload-disabled 且不绑定事件', async () => {
		const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const wrapper = mount(Upload, { props: { disabled: true } as any });

		expect(wrapper.classes()).toContain('vc-upload-disabled');

		await wrapper.trigger('click');
		expect(clickSpy).not.toHaveBeenCalled();
	});

	it('input: max>1 时 multiple 为真, directory 时 webkitdirectory 为真', () => {
		const wrapper = mount(Upload, {
			props: { max: 3, directory: true, accept: 'image/*' } as any
		});
		const input = wrapper.find('input');
		expect(input.exists()).toBe(true);
		expect(input.attributes('type')).toBe('file');
		expect(input.attributes('accept')).toBe('image/*');
		expect(input.attributes('multiple')).toBeDefined();
	});

	it('input: max=1 时 multiple 为假', () => {
		const wrapper = mount(Upload, { props: { max: 1 } as any });
		const input = wrapper.find('input');
		expect(input.attributes('multiple')).toBeUndefined();
	});

	it('渲染默认插槽内容', () => {
		const wrapper = mount(Upload, {
			slots: { default: () => (<button class="trigger">上传</button>) }
		});
		expect(wrapper.find('.trigger').exists()).toBe(true);
		expect(wrapper.find('.trigger').text()).toBe('上传');
	});
});

describe('Upload 触发点击', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		VcInstance.options.Upload = undefined as any;
		vi.restoreAllMocks();
	});

	it('点击容器会触发 input.click', async () => {
		const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const wrapper = mount(Upload);

		await wrapper.trigger('click');
		expect(clickSpy).toHaveBeenCalledTimes(1);
	});

	it('expose click() 会触发 input.click', async () => {
		const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const wrapper = mount(Upload);

		(wrapper.vm as any).click();
		expect(clickSpy).toHaveBeenCalledTimes(1);
	});

	it('target 为 INPUT 时不再重复触发 click', async () => {
		const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const wrapper = mount(Upload);

		await wrapper.find('input').trigger('click');
		expect(clickSpy).not.toHaveBeenCalled();
	});

	it('enhancer 同步返回 true 时阻止 input.click', async () => {
		const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const enhancer = vi.fn(() => true);
		const wrapper = mount(Upload, { props: { enhancer } as any });

		await wrapper.trigger('click');
		expect(enhancer).toHaveBeenCalledTimes(1);
		expect(clickSpy).not.toHaveBeenCalled();
	});

	it('enhancer 返回 Promise<false> 时最终触发 input.click', async () => {
		const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const enhancer = vi.fn(() => Promise.resolve(false));
		const wrapper = mount(Upload, { props: { enhancer } as any });

		await wrapper.trigger('click');
		await flush();
		expect(clickSpy).toHaveBeenCalledTimes(1);
	});

	it('enhancer 返回 Promise<undefined> 视为 skip, 不触发 input.click', async () => {
		const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
		const enhancer = vi.fn(() => Promise.resolve(undefined));
		const wrapper = mount(Upload, { props: { enhancer } as any });

		await wrapper.trigger('click');
		await flush();
		expect(clickSpy).not.toHaveBeenCalled();
	});
});

describe('Upload 文件校验 (accept / max / size)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		VcInstance.options.Upload = undefined as any;
		vi.restoreAllMocks();
	});

	it('文件类型不匹配 accept: 触发 error 且 Message.error', async () => {
		const errorSpy = vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const wrapper = mount(Upload, {
			props: { accept: 'image/*', onError } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.txt', 'text/plain')]);
		await flush();

		expect(onError).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalled();
		const { cause } = onError.mock.calls[0][0];
		expect(cause.message).toContain('文件格式限制');
	});

	it('Upload showError=false 时只派发 error', async () => {
		const errorSpy = vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				accept: 'image/*',
				showError: false,
				onError
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.txt', 'text/plain')]);
		await flush();

		expect(errorSpy).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it('onMessage 返回空字符串时保留显式自定义文案', async () => {
		const errorSpy = vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				accept: 'image/*',
				onMessage: () => '',
				onError
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('empty-message.txt', 'text/plain')]);
		await flush();

		expect(errorSpy).toHaveBeenCalledWith('', 2500);
		expect(onError).toHaveBeenCalledWith({ cause: expect.objectContaining({ message: '' }) });
	});

	it('文件数量超过 max: 触发 error', async () => {
		vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const wrapper = mount(Upload, {
			props: { max: 1, onError } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png'), createFile('b.png')]);
		await flush();

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls[0][0].cause.message).toContain('数量不能超过');
	});

	it('文件夹模式数量超限: 提示文案区分文件夹', async () => {
		vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const wrapper = mount(Upload, {
			props: { max: 1, directory: true, onError } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png'), createFile('b.png')]);
		await flush();

		expect(onError.mock.calls[0][0].cause.message).toContain('文件夹内文件的数量');
	});

	it('MUpload 默认使用 MToast 提示，showError=false 时只派发事件', async () => {
		const messageSpy = vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const toastSpy = vi.spyOn(MToast, 'info').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const wrapper = mount(MUpload, {
			props: { accept: 'image/*', onError } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.txt', 'text/plain')]);
		await flush();

		expect(messageSpy).not.toHaveBeenCalled();
		expect(toastSpy).toHaveBeenCalledWith('文件格式限制：image/*', 2500);
		expect(onError).toHaveBeenCalledTimes(1);

		await wrapper.setProps({ showError: false });
		(wrapper.vm as any).uploadFiles([createFile('b.txt', 'text/plain')]);
		await flush();
		expect(toastSpy).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledTimes(2);
	});

	it('文件大小超过 size: 触发 file-error 与 error', async () => {
		vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const onFileError = vi.fn();
		const wrapper = mount(Upload, {
			props: { size: 1, onError, onFileError } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('big.png', 'image/png', 2 * 1024 * 1024)]);
		await flush();

		expect(onFileError).toHaveBeenCalledTimes(1);
		expect(onFileError.mock.calls[0][0]).toBeDefined();
		expect(onError).toHaveBeenCalled();
	});
});

describe('Upload 上传生命周期', () => {
	beforeEach(() => {
		MockXHR.instances = [];
	});

	afterEach(() => {
		document.body.innerHTML = '';
		VcInstance.options.Upload = undefined as any;
		MockXHR.instances = [];
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('无 url: 直接走 onSuccess, 依次触发 begin/file-start/file-success/complete', async () => {
		const onBegin = vi.fn();
		const onFileStart = vi.fn();
		const onFileSuccess = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: { onBegin, onFileStart, onFileSuccess, onComplete } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		expect(onBegin).toHaveBeenCalledTimes(1);
		expect(onFileStart).toHaveBeenCalledTimes(1);
		expect(onFileSuccess).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ succeeded: 1, total: 1, failed: 0 });
	});

	it('Cycle、Task 与外部事件共用对象 payload', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const taskEmit = vi.spyOn(UploadTaskContext.prototype, 'emit');
		const events: string[] = [];
		const onBegin = vi.fn<NonNullable<UploadCallback['onBegin']>>(() => {
			events.push('begin');
		});
		const onFileStart = vi.fn<NonNullable<UploadCallback['onFileStart']>>(() => {
			events.push('file-start');
		});
		const onFileProgress = vi.fn<NonNullable<UploadCallback['onFileProgress']>>(() => {
			events.push('file-progress');
		});
		const onFileSuccess = vi.fn<NonNullable<UploadCallback['onFileSuccess']>>(() => {
			events.push('file-success');
		});
		const onComplete = vi.fn<NonNullable<UploadCallback['onComplete']>>(() => {
			events.push('complete');
		});
		const source = createFile('contract.png');
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				onBegin,
				onFileStart,
				onFileProgress,
				onFileSuccess,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([source]);
		await flush();
		const xhr = MockXHR.instances[0];
		xhr.emitProgress(1, 2);
		xhr.emitResponse(200, JSON.stringify({ ok: true }));
		await flush();

		const file = onFileStart.mock.calls[0][0].file;
		const taskBegin = taskEmit.mock.calls.find(([eventName]) => eventName === 'begin');
		expect(taskBegin?.[1]).toBe(onBegin.mock.calls[0][0]);
		expect(onBegin.mock.calls[0]).toHaveLength(1);
		expect(onBegin.mock.calls[0][0].rawFiles).toEqual([source]);
		expect(onBegin.mock.calls[0][0].rawFiles[0]).toBe(source);
		expect(onBegin.mock.calls[0][0].files).toEqual([
			expect.objectContaining({
				uploadId: file.uploadId,
				name: file.name,
				percent: 0
			})
		]);
		expect(onFileStart.mock.calls[0]).toEqual([{ file }]);
		expect(onFileProgress.mock.calls[0]).toHaveLength(1);
		expect(onFileProgress.mock.calls[0][0].progress).toMatchObject({ progress: 0.5, percent: 50 });
		expect(onFileProgress.mock.calls[0][0].file).toBe(file);
		expect(onFileSuccess.mock.calls[0]).toHaveLength(1);
		expect(onFileSuccess.mock.calls[0][0].response).toEqual({ ok: true });
		expect(onFileSuccess.mock.calls[0][0].file).toBe(file);
		expect(onFileSuccess.mock.calls[0][0].result).toMatchObject({
			succeeded: 1,
			completed: 1,
			total: 1
		});
		expect(onComplete.mock.calls[0]).toHaveLength(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ succeeded: 1, total: 1 });
		expect(events).toEqual([
			'begin',
			'file-start',
			'file-progress',
			'file-success',
			'complete'
		]);
		wrapper.unmount();
	});

	it('begin 回调修改 payload 不会污染周期队列与 Task 标识', async () => {
		const rawFileCounts: number[] = [];
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				showTask: true,
				onBegin: ({ rawFiles, files }: Parameters<UploadCallback['onBegin']>[0]) => {
					files[0].uploadId = 'forged-upload-id';
					rawFiles.splice(0);
					files.splice(0);
				},
				onFileBefore: ({ file, rawFiles }: Parameters<UploadCallback['onFileBefore']>[0]) => {
					rawFileCounts.push(rawFiles.length);
					return file;
				},
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('snapshot-a.png'),
			createFile('snapshot-b.png')
		]);
		await flush();

		expect(rawFileCounts).toEqual([2, 2]);
		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({ total: 2, completed: 2, succeeded: 2 })
		});
		expect(document.body.querySelectorAll('.vc-upload-task__list li')).toHaveLength(2);
		expect(document.body.querySelector('.vc-upload-task')?.textContent).toContain('snapshot-a.png');
		expect(document.body.querySelector('.vc-upload-task')?.textContent).toContain('snapshot-b.png');
		wrapper.unmount();
	});

	it('onFileBefore 会在上传前被调用并透传 file / rawFiles', async () => {
		const onFileBefore = vi.fn(({ file }: { file: UploadFile }) => file);
		const onFileSuccess = vi.fn();
		const wrapper = mount(Upload, {
			props: { onFileBefore, onFileSuccess } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		expect(onFileBefore).toHaveBeenCalledTimes(1);
		const { file, rawFiles } = onFileBefore.mock.calls[0][0] as {
			file: UploadFile;
			rawFiles: File[];
		};
		expect(file.name).toBe('a.png');
		expect(Array.isArray(rawFiles)).toBe(true);
		expect(onFileSuccess).toHaveBeenCalledTimes(1);
	});

	it('onFileBefore 返回完整对象时保持对象引用', async () => {
		let processedFile: any;
		const onFileBefore = vi.fn(({ file }: { file: UploadFile }) => {
			processedFile = { ...file };
			return processedFile;
		});
		const onFileSuccess = vi.fn();
		const wrapper = mount(Upload, {
			props: { onFileBefore, onFileSuccess } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('identity.png')]);
		await flush();

		expect(onFileSuccess.mock.calls[0][0].file).toBe(processedFile);
	});

	it('并行 onFileBefore 复用同一文件对象时仍按源文件独立结算', async () => {
		let sharedFile: UploadFile | undefined;
		const settledFiles: UploadFile[] = [];
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				parallel: true,
				onFileBefore: ({ file }: Parameters<UploadCallback['onFileBefore']>[0]) => {
					sharedFile ||= file;
					return sharedFile;
				},
				onFileSuccess: ({ file }: Parameters<UploadCallback['onFileSuccess']>[0]) => {
					settledFiles.push(file);
				},
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('shared-a.png'),
			createFile('shared-b.png')
		]);
		await flush();

		expect(settledFiles).toHaveLength(2);
		expect(new Set(settledFiles.map(file => file.uploadId)).size).toBe(2);
		expect(settledFiles.map(file => file.current).sort()).toEqual([1, 2]);
		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({ total: 2, completed: 2, succeeded: 2 })
		});
		wrapper.unmount();
	});

	it('onFileBefore 原地修改周期标识时恢复原标识并正常完成', async () => {
		let originalId = '';
		const onFileSuccess = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				showTask: true,
				onFileBefore: ({ file }: { file: UploadFile }) => {
					originalId = file.uploadId;
					file.uploadId = 'forged-id';
					file.current = 99;
					file.total = 99;
					return file;
				},
				onFileSuccess,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('identity.png')]);
		await flush();

		const settledFile = onFileSuccess.mock.calls[0][0].file;
		expect(settledFile).toMatchObject({
			uploadId: originalId,
			current: 1,
			total: 1
		});
		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({ succeeded: 1, total: 1 })
		});
		expect(document.body.querySelector('.vc-upload-task')?.textContent)
			.toContain('上传结束，成功：1，失败：0，总数：1');
		wrapper.unmount();
	});

	it('生命周期回调修改文件标识不会破坏后续结算', async () => {
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				showTask: true,
				onFileStart: ({ file }: { file: UploadFile }) => {
					file.uploadId = 'shared-forged-id';
				},
				onFileSuccess: ({ file }: { file: UploadFile }) => {
					file.uploadId = 'shared-forged-id';
				},
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('first.png'),
			createFile('second.png')
		]);
		await flush();

		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({ succeeded: 2, total: 2 })
		});
		expect(document.body.querySelector('.vc-upload-task')?.textContent)
			.toContain('上传结束，成功：2，失败：0，总数：2');
		wrapper.unmount();
	});

	it('onFileBefore 过滤无效部分字段并保留 Blob 的自定义文件名', async () => {
		let processedFile: UploadFileBeforeResult = undefined;
		const onFileSuccess = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				onFileBefore: ({ file }: { file: UploadFile }) => {
					if (file.current === 1) {
						return {
							name: undefined,
							size: undefined,
							percent: undefined,
							target: undefined
						};
					}
					processedFile = {
						...file,
						name: 'renamed.png',
						target: new Blob(['processed'], { type: 'image/png' })
					};
					return processedFile;
				},
				onFileSuccess
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('source.png'),
			createFile('blob.png')
		]);
		await flush();

		const first = onFileSuccess.mock.calls[0][0].file;
		const second = onFileSuccess.mock.calls[1][0].file;
		expect(first.name).toBe('source.png');
		expect(first.target).toBeInstanceOf(File);
		expect(Number.isFinite(first.size)).toBe(true);
		expect(second).toBe(processedFile);
		expect(second.name).toBe('renamed.png');
		expect(second.target).toBeInstanceOf(File);
		expect(second.target.name).toBe('renamed.png');
	});

	it('onFileBefore 替换 File 后使用实际大小执行限制', async () => {
		const onFileSuccess = vi.fn();
		const onFileError = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				size: 1,
				showError: false,
				onFileBefore: ({ file }: { file: UploadFile }) => file.current === 1
					? new File(
							[new Uint8Array(2 * 1024 * 1024)],
							'large-replacement.png',
							{ type: 'image/png' }
						)
					: new File(['small'], 'small-replacement.png', { type: 'image/png' }),
				onFileSuccess,
				onFileError,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('grow.png'),
			createFile('shrink.png', 'image/png', 2 * 1024 * 1024)
		]);
		await flush();

		const failedFile = onFileError.mock.calls[0][0].file as UploadFile;
		const succeededFile = onFileSuccess.mock.calls[0][0].file as UploadFile;
		expect(failedFile.size).toBe(failedFile.target.size);
		expect(failedFile.size).toBeGreaterThan(1024 * 1024);
		expect(succeededFile.size).toBe(succeededFile.target.size);
		expect(succeededFile.size).toBeLessThan(1024 * 1024);
		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({
				total: 2,
				completed: 2,
				succeeded: 1,
				failed: 1
			})
		});
		wrapper.unmount();
	});

	it('onFileBefore 抛错: 计入 error 并完成周期', async () => {
		const onFileBefore = vi.fn(() => {
			throw new Error('拦截');
		});
		const onComplete = vi.fn();
		const onFileSuccess = vi.fn();
		const wrapper = mount(Upload, {
			props: { onFileBefore, onComplete, onFileSuccess } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		expect(onFileSuccess).not.toHaveBeenCalled();
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ failed: 1, total: 1 });
	});

	it('onFileBefore 原地修改标识后抛错仍会结算原任务', async () => {
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				showTask: true,
				onFileBefore: ({ file }: { file: UploadFile }) => {
					file.uploadId = 'forged-before-error';
					file.current = 2;
					file.total = 2;
					throw new Error('前置处理失败');
				},
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('preflight-error.png')]);
		await flush();

		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({ failed: 1, total: 1 })
		});
		const task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('前置处理失败');
		expect(task.textContent).toContain('上传结束，成功：0，失败：1，总数：1');
		wrapper.unmount();
	});

	it('onFileBefore 返回 false: 不发送请求并以取消状态完成周期', async () => {
		const onFileStart = vi.fn();
		const onFileSuccess = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				onFileBefore: () => false,
				onFileStart,
				onFileSuccess,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('canceled.png')]);
		await flush();

		expect(onFileStart).not.toHaveBeenCalled();
		expect(onFileSuccess).not.toHaveBeenCalled();
		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({ failed: 1, total: 1 })
		});
	});

	it('onFileBefore 前置失败只立即更新任务面板，不触发外部 file-error', async () => {
		let resolveSecond!: () => void;
		const onFileError = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				showTask: true,
				onFileBefore: ({ file }: { file: UploadFile }) => file.current === 1
					? false
					: new Promise((resolve) => {
							resolveSecond = () => resolve(file);
						}),
				onFileError,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('rejected.png'),
			createFile('pending.png')
		]);
		await flush();

		const task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('上传已取消');
		expect(task.textContent).not.toContain('上传结束');
		expect(onFileError).not.toHaveBeenCalled();
		expect(onComplete).not.toHaveBeenCalled();

		resolveSecond();
		await flush();
		expect(onComplete).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('处理后的文件通过 file-start 同步到任务面板', async () => {
		const wrapper = mount(Upload, {
			props: {
				showTask: true,
				onFileBefore: ({ file }: { file: UploadFile }) => ({
					...file,
					name: 'processed.png'
				})
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('source.png')]);
		await flush();

		expect(document.body.querySelector('.vc-upload-task')?.textContent)
			.toContain('processed.png');
		wrapper.unmount();
	});

	it('有 url: 通过 XHR 200 成功, 解析 JSON 响应', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onFileSuccess = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload', name: 'file', onFileSuccess, onComplete } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		expect(MockXHR.instances.length).toBe(1);
		const xhr = MockXHR.instances[0];
		expect(xhr.method).toBe('POST');
		expect(xhr.url).toBe('https://x.com/upload');

		xhr.emitResponse(200, JSON.stringify({ code: 0, url: 'ok' }));
		await flush();

		expect(onFileSuccess).toHaveBeenCalledTimes(1);
		expect(onFileSuccess.mock.calls[0][0].response).toMatchObject({ code: 0, url: 'ok' });
		expect(onComplete).toHaveBeenCalledTimes(1);

		vi.unstubAllGlobals();
	});

	it('onResponse 的合法 falsy 返回值会原样进入成功结果', async () => {
		const responses = [false, 0, '', null];
		const onFileSuccess = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: responses.length,
				onResponse: ({ requestOptions }: Parameters<UploadCallback['onResponse']>[0]) => {
					const index = Number(requestOptions.file.name.split('.')[0]);
					return responses[index];
				},
				onFileSuccess,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles(responses.map((_, index) => createFile(`${index}.png`)));
		await flush();

		expect(onFileSuccess.mock.calls.map(([payload]) => payload.response)).toEqual(responses);
		expect(onComplete.mock.calls[0][0].result.responses).toEqual(responses);
		wrapper.unmount();
	});

	it('onResponse 等待期间忽略重复 XHR 终态回调', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		let resolveResponse!: (response: unknown) => void;
		const onResponse = vi.fn(() => new Promise(resolve => (resolveResponse = resolve)));
		const onFileSuccess = vi.fn();
		const onFileError = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				onResponse,
				onFileSuccess,
				onFileError,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('settling.png')]);
		await flush();

		const xhr = MockXHR.instances[0];
		xhr.emitResponse(200, '{}');
		xhr.onerror?.({});
		xhr.emitResponse(200, '{}');
		await flush();

		expect(onResponse).toHaveBeenCalledTimes(1);
		expect(onFileSuccess).not.toHaveBeenCalled();
		expect(onFileError).not.toHaveBeenCalled();

		resolveResponse({ ok: true });
		await flush();

		expect(onFileSuccess).toHaveBeenCalledTimes(1);
		expect(onFileError).not.toHaveBeenCalled();
		expect(onComplete).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('较早的文件成功 result 不会被后续 responses 反向修改', async () => {
		const infos: any[] = [];
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				onResponse: ({ requestOptions }: { requestOptions: UploadRequestOptions }) => ({
					name: requestOptions.file.name
				}),
				onFileSuccess: ({ result }: { result: UploadCycleResult }) => infos.push(result)
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('first.png'),
			createFile('second.png')
		]);
		await flush();

		expect(infos).toHaveLength(2);
		expect(infos[0].responses).toHaveLength(1);
		expect(infos[1].responses).toHaveLength(2);
		wrapper.unmount();
	});

	it('Cycle 事件快照的 responses/queues 不会与内部状态互相污染', async () => {
		const firstInfo: UploadCycleResult[] = [];
		const complete = vi.fn();
		const unexpectedQueue = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				parallel: false,
				onResponse: ({ requestOptions }: { requestOptions: UploadRequestOptions }) => requestOptions.file.name,
				onFileSuccess: ({ file, result }: { file: UploadFile; result: UploadCycleResult }) => {
					if (file.current !== 1) return;

					firstInfo.push(result);
					result.responses.push('polluted');
					result.queues.push(unexpectedQueue);
				},
				onComplete: complete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('first.png'),
			createFile('second.png')
		]);
		await flush();

		expect(unexpectedQueue).not.toHaveBeenCalled();
		expect(firstInfo[0].queues).toHaveLength(2);
		expect(complete).toHaveBeenCalledWith({
			result: expect.objectContaining({
				responses: ['first.png', 'second.png'],
				total: 2
			})
		});
	});

	it('结果中的 queues 重复执行也只会启动每个文件一次', async () => {
		const onFileBefore = vi.fn(({ file }: Parameters<UploadCallback['onFileBefore']>[0]) => file);
		const onFileStart = vi.fn();
		const onFileSuccess = vi.fn(({ file, result }: Parameters<UploadCallback['onFileSuccess']>[0]) => {
			if (file.current !== 1) return;

			result.queues.forEach((run) => {
				run();
				run();
			});
		});
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				parallel: false,
				onFileBefore,
				onFileStart,
				onFileSuccess,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('one-shot-a.png'),
			createFile('one-shot-b.png')
		]);
		await flush();

		expect(onFileBefore).toHaveBeenCalledTimes(2);
		expect(onFileStart).toHaveBeenCalledTimes(2);
		expect(onFileSuccess).toHaveBeenCalledTimes(2);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({ total: 2, completed: 2, succeeded: 2 })
		});
		wrapper.unmount();
	});

	it('有 url: XHR 触发 progress 事件', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onFileProgress = vi.fn();
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload', onFileProgress } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		const xhr = MockXHR.instances[0];
		xhr.emitProgress(50, 100);
		await flush();

		expect(onFileProgress).toHaveBeenCalledTimes(1);
		expect(onFileProgress.mock.calls[0][0].progress).toMatchObject({ percent: 50, progress: 0.5 });

		vi.unstubAllGlobals();
	});

	it('progress 回调修改文件标识后仍能完成 XHR 结算', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				onFileProgress: ({ file }: { file: UploadFile }) => {
					file.uploadId = 'forged-on-progress';
				},
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('progress-id.png')]);
		await flush();
		MockXHR.instances[0].emitProgress(1, 2);
		MockXHR.instances[0].emitResponse(200, '{}');
		await flush();

		expect(onComplete).toHaveBeenCalledWith({
			result: expect.objectContaining({ succeeded: 1, total: 1 })
		});
		wrapper.unmount();
	});

	it('有 url: XHR 500 触发 file-error', async () => {
		vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onFileError = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload', onFileError, onComplete } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		MockXHR.instances[0].emitResponse(500, 'server error');
		await flush();

		expect(onFileError).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ failed: 1, total: 1 });

		vi.unstubAllGlobals();
	});

	it('XHR timeout 仅结算一次，终态后忽略进度并保留旧事件顺序', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const events: string[] = [];
		const onFileProgress = vi.fn();
		const onFileError = vi.fn<NonNullable<UploadCallback['onFileError']>>(() => {
			events.push('file-error');
		});
		const onComplete = vi.fn<NonNullable<UploadCallback['onComplete']>>(() => {
			events.push('complete');
		});
		const onError = vi.fn(() => events.push('error'));
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				showError: false,
				showTask: true,
				onFileProgress,
				onFileError,
				onComplete,
				onError
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('timeout.png')]);
		await flush();
		const xhr = MockXHR.instances[0];
		const timeoutEvent = {};
		xhr.emitProgress(1, 4);
		xhr.ontimeout?.(timeoutEvent);
		xhr.emitProgress(3, 4);
		xhr.onerror?.({});
		xhr.emitResponse(200, '{}');
		await flush();

		expect(onFileProgress).toHaveBeenCalledTimes(1);
		expect(onFileError).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onFileError.mock.calls[0]).toHaveLength(1);
		expect(onFileError.mock.calls[0][0].cause).toBe(timeoutEvent);
		expect(onFileError.mock.calls[0][0].file).toMatchObject({ name: 'timeout.png' });
		expect(onFileError.mock.calls[0][0].result).toMatchObject({
			failed: 1,
			succeeded: 0,
			completed: 1,
			total: 1
		});
		expect(onFileError.mock.calls[0][0].stage).toBe('upload');
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ failed: 1, total: 1 });
		expect(events).toEqual(['file-error', 'complete', 'error']);
		expect(document.body.querySelector('.vc-upload-task')?.textContent)
			.toContain('上传超时');
		wrapper.unmount();
	});

	it('顺序上传 (parallel=false): 一个完成后再上传下一个', async () => {
		const onFileSuccess = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: { max: 5, parallel: false, onFileSuccess, onComplete } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png'), createFile('b.png')]);
		await flush();

		expect(onFileSuccess).toHaveBeenCalledTimes(2);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ succeeded: 2, total: 2 });
	});

	it('showLoading=true: 上传时调用 Message.loading, 完成后销毁', async () => {
		const destroy = vi.fn();
		const loadingSpy = vi.spyOn(Message, 'loading').mockReturnValue({ destroy } as any);
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: { showLoading: true, onComplete } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		expect(loadingSpy).toHaveBeenCalledTimes(1);
		expect(destroy).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('MUpload showLoading=true: 使用 MToast.loading 并完成销毁', async () => {
		const destroy = vi.fn();
		const toastLoading = vi.spyOn(MToast, 'loading')
			.mockReturnValue({ destroy } as any);
		const messageLoading = vi.spyOn(Message, 'loading');
		const wrapper = mount(MUpload, {
			props: { showLoading: true } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('mobile-loading.png')]);
		await flush();

		expect(toastLoading).toHaveBeenCalledWith('上传中...');
		expect(messageLoading).not.toHaveBeenCalled();
		expect(destroy).toHaveBeenCalledTimes(1);
	});

	it('onRequest 可改写 options (来自 props)', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onRequest = vi.fn(({ requestOptions }: { requestOptions: UploadRequestOptions }) => ({
			...requestOptions,
			url: 'https://rewrite.com/api',
			headers: { 'X-Token': 'abc' }
		}));
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload', onRequest } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		expect(onRequest).toHaveBeenCalledTimes(1);
		const xhr = MockXHR.instances[0];
		expect(xhr.url).toBe('https://rewrite.com/api');
		expect(xhr.headers['X-Token']).toBe('abc');

		vi.unstubAllGlobals();
	});
});

describe('Upload 拖拽上传', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		VcInstance.options.Upload = undefined as any;
		vi.restoreAllMocks();
	});

	it('drop: 从 dataTransfer 读取文件并上传', async () => {
		const onBegin = vi.fn();
		const onFileSuccess = vi.fn();
		const wrapper = mount(Upload, {
			props: { onBegin, onFileSuccess } as any
		});

		await wrapper.trigger('drop', {
			dataTransfer: { files: [createFile('a.png')] }
		} as any);
		await flush();

		expect(onBegin).toHaveBeenCalledTimes(1);
		expect(onFileSuccess).toHaveBeenCalledTimes(1);
	});

	it('dragover: 阻止默认行为, 不触发上传', async () => {
		const onBegin = vi.fn();
		const wrapper = mount(Upload, { props: { onBegin } as any });

		await wrapper.trigger('dragover');
		await flush();

		expect(onBegin).not.toHaveBeenCalled();
	});
});

describe('Upload change 与卸载', () => {
	beforeEach(() => {
		MockXHR.instances = [];
	});

	afterEach(() => {
		document.body.innerHTML = '';
		VcInstance.options.Upload = undefined as any;
		MockXHR.instances = [];
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('input change: 读取 files 上传并刷新 input key', async () => {
		const onFileSuccess = vi.fn();
		const wrapper = mount(Upload, { props: { onFileSuccess } as any });

		const input = wrapper.find('input');
		Object.defineProperty(input.element, 'files', {
			value: [createFile('a.png')],
			configurable: true
		});

		await input.trigger('change');
		await flush();

		expect(onFileSuccess).toHaveBeenCalledTimes(1);
	});

	it('卸载时取消进行中的请求 (abort)', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload' } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		const xhr = MockXHR.instances[0];
		expect(xhr.aborted).toBe(false);

		wrapper.unmount();
		expect(xhr.aborted).toBe(true);

		vi.unstubAllGlobals();
	});
});

describe('UploadTask', () => {
	const createUploadFile = (uploadId: string, name: string, size = 1024 * 1024) => ({
		uploadId,
		current: 1,
		total: 1,
		percent: 0,
		size,
		name,
		target: createFile(name, 'image/png', size)
	});

	beforeEach(() => {
		UploadTask.destroy();
	});

	afterEach(() => {
		UploadTask.destroy();
		document.body.innerHTML = '';
		MockXHR.instances = [];
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('管理等待、进度、成功、失败与完成状态', async () => {
		const wrapper = mount(UploadTaskView);
		const task = wrapper.vm as any;

		expect(wrapper.find('.vc-upload-task').exists()).toBe(false);

		task.show([
			createUploadFile('a', 'a.png'),
			createUploadFile('b', 'b.png', 512 * 1024),
			createUploadFile('c', 'c.png')
		]);
		await nextTick();

		expect(wrapper.text()).toContain('当前上传进度');
		expect(wrapper.text()).toContain('1.00 MB');
		expect(wrapper.text()).toContain('0.50 MB');
		expect(wrapper.text()).toContain('等待中');

		task.start('a');
		task.progress('a', -10);
		await nextTick();
		expect(wrapper.findAll('.vc-upload-task__bar')[0].attributes('style')).toContain('width: 0%');

		task.progress('a', 120);
		task.success('a');
		task.error('b');
		task.start('c');
		task.error('c', '网络异常');
		task.progress('a', 20);
		task.progress('missing', 20);
		task.complete();
		await nextTick();

		expect(wrapper.text()).toContain('✓');
		expect(wrapper.text()).toContain('上传失败');
		expect(wrapper.text()).toContain('网络异常');
		expect(wrapper.text()).toContain('上传结束，成功：1，失败：2，总数：3');
		expect(wrapper.findAll('.vc-upload-task__bar')[0].attributes('style')).toContain('width: 100%');

		await wrapper.get('[aria-label="关闭上传结果"]').trigger('click');
		expect(wrapper.text()).not.toContain('上传结束');

		task.clear();
		await nextTick();
		expect(wrapper.findAll('.vc-upload-task__list li')).toHaveLength(0);

		task.show([createUploadFile('d', 'd.png')]);
		task.progress('d', 25.5);
		await nextTick();
		expect(wrapper.find('.vc-upload-task__bar').attributes('style')).toContain('width: 25.5%');
		task.remove(['d']);
		await nextTick();
		expect(wrapper.findAll('.vc-upload-task__list li')).toHaveLength(0);
		task.show([createUploadFile('e', 'e.png')]);
		await nextTick();

		await wrapper.get('[aria-label="关闭"]').trigger('click');
		expect(wrapper.emitted('close')).toHaveLength(1);
		expect(wrapper.find('.vc-upload-task').exists()).toBe(false);
	});

	it('showTask 随上传生命周期自动更新并在卸载时销毁', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				showTask: true
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('managed.png')]);
		await flush();

		let task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('managed.png');
		expect(task.textContent).toContain('上传中');

		MockXHR.instances[0].emitProgress(1, 4);
		await nextTick();
		expect((task.querySelector('.vc-upload-task__bar') as HTMLElement).style.width).toBe('25%');

		MockXHR.instances[0].emitResponse(200, '{"ok":true}');
		await flush();
		expect(task.textContent).toContain('上传结束，成功：1，失败：0，总数：1');

		(wrapper.vm as any).uploadFiles([createFile('next.png')]);
		await flush();
		task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('next.png');
		expect(task.textContent).not.toContain('managed.png');
		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();

		wrapper.unmount();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
	});

	it('同一组件的重叠批次独立计数并合并活跃任务', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				showTask: true,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('first.png')]);
		await flush();
		(wrapper.vm as any).uploadFiles([createFile('second.png')]);
		await flush();

		const task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('first.png');
		expect(task.textContent).toContain('second.png');

		MockXHR.instances[0].emitResponse(200, '{}');
		await flush();
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ succeeded: 1, failed: 0, total: 1 });
		expect(task.textContent).not.toContain('上传结束');

		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();
		expect(onComplete).toHaveBeenCalledTimes(2);
		expect(onComplete.mock.calls[1][0].result).toMatchObject({ succeeded: 1, failed: 0, total: 1 });
		expect(task.textContent).toContain('上传结束，成功：2，失败：0，总数：2');

		wrapper.unmount();
	});

	it('多个 Upload 共享一个任务浮层并按所属组件释放任务', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const props = { url: 'https://x.com/upload', showTask: true } as any;
		const first = mount(Upload, { props });
		const second = mount(Upload, { props });

		(first.vm as any).uploadFiles([createFile('first-owner.png')]);
		(second.vm as any).uploadFiles([createFile('second-owner.png')]);
		await flush();

		expect(document.body.querySelectorAll('.vc-upload-task')).toHaveLength(1);
		let task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('first-owner.png');
		expect(task.textContent).toContain('second-owner.png');

		MockXHR.instances[0].emitResponse(200, '{}');
		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();

		first.unmount();
		await nextTick();
		task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).not.toContain('first-owner.png');
		expect(task.textContent).toContain('second-owner.png');

		second.unmount();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
	});

	it('一个活跃 owner 卸载不会移除另一个活跃 owner', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const props = { url: 'https://x.com/upload', showTask: true } as any;
		const first = mount(Upload, { props });
		const second = mount(Upload, { props });

		(first.vm as any).uploadFiles([createFile('active-first.png')]);
		(second.vm as any).uploadFiles([createFile('active-second.png')]);
		await flush();

		first.unmount();
		await nextTick();
		const task = document.body.querySelector('.vc-upload-task')!;
		expect(MockXHR.instances[0].aborted).toBe(true);
		expect(task.textContent).not.toContain('active-first.png');
		expect(task.textContent).toContain('active-second.png');
		expect(task.textContent).toContain('上传中');

		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();
		expect(task.textContent).toContain('上传结束，成功：1，失败：0，总数：1');
		second.unmount();
	});

	it('新周期只替换当前 Upload 的已完成任务', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const props = { url: 'https://x.com/upload', showTask: true } as any;
		const first = mount(Upload, { props });
		const second = mount(Upload, { props });

		(first.vm as any).uploadFiles([createFile('first-completed.png')]);
		(second.vm as any).uploadFiles([createFile('second-completed.png')]);
		await flush();
		MockXHR.instances[0].emitResponse(200, '{}');
		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();

		(first.vm as any).uploadFiles([createFile('first-next.png')]);
		await flush();

		const task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).not.toContain('first-completed.png');
		expect(task.textContent).toContain('first-next.png');
		expect(task.textContent).toContain('second-completed.png');

		MockXHR.instances[2].emitResponse(200, '{}');
		await flush();
		first.unmount();
		second.unmount();
	});

	it('重新启用 showTask 只恢复当前 owner 的完成状态', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const props = { url: 'https://x.com/upload', showTask: true } as any;
		const first = mount(Upload, { props });
		const second = mount(Upload, { props });

		(first.vm as any).uploadFiles([createFile('first-toggle.png')]);
		(second.vm as any).uploadFiles([createFile('second-stable.png')]);
		await flush();
		MockXHR.instances[0].emitResponse(200, '{}');
		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();

		await first.setProps({ showTask: false });
		let task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).not.toContain('first-toggle.png');
		expect(task.textContent).toContain('second-stable.png');

		await first.setProps({ showTask: true });
		await nextTick();
		task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('first-toggle.png');
		expect(task.textContent).toContain('second-stable.png');
		expect(task.querySelectorAll('.vc-upload-task__list li')).toHaveLength(2);
		expect(task.textContent).toContain('上传结束，成功：2，失败：0，总数：2');

		first.unmount();
		second.unmount();
	});

	it('运行时关闭 showTask 会释放面板且可以再次启用', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload', showTask: true } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('before-toggle.png')]);
		await flush();
		expect(document.body.querySelector('.vc-upload-task')).not.toBeNull();

		await wrapper.setProps({ showTask: false });
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
		MockXHR.instances[0].emitResponse(200, '{}');
		await flush();

		await wrapper.setProps({ showTask: true });
		(wrapper.vm as any).uploadFiles([createFile('after-toggle.png')]);
		await flush();
		expect(document.body.querySelector('.vc-upload-task')?.textContent).toContain('after-toggle.png');
		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();

		wrapper.unmount();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
	});

	it('上传完成后启用 showTask 会恢复完成结果', async () => {
		const wrapper = mount(Upload, {
			props: { showTask: false } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('completed-before-enable.png')]);
		await flush();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();

		await wrapper.setProps({ showTask: true });
		await nextTick();

		const task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('completed-before-enable.png');
		expect(task.textContent).toContain('上传结束，成功：1，失败：0，总数：1');
		wrapper.unmount();
	});

	it('onRequest 等待期间卸载后不再创建请求', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		let resolveRequest!: () => void;
		const onRequest = vi.fn(({ requestOptions }: { requestOptions: UploadRequestOptions }) => new Promise((resolve) => {
			resolveRequest = () => resolve(requestOptions);
		}));
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload', onRequest } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('deferred-request.png')]);
		await flush();
		expect(onRequest).toHaveBeenCalledTimes(1);
		expect(MockXHR.instances).toHaveLength(0);

		wrapper.unmount();
		resolveRequest();
		await flush();
		expect(MockXHR.instances).toHaveLength(0);
	});

	it('onResponse 等待期间卸载后不再结算成功', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		let resolveResponse!: () => void;
		const onResponse = vi.fn(() => new Promise((resolve) => {
			resolveResponse = () => resolve({ ok: true });
		}));
		const onFileSuccess = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				onResponse,
				onFileSuccess,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('deferred-response.png')]);
		await flush();
		MockXHR.instances[0].emitResponse(200, '{}');
		await flush();
		expect(onResponse).toHaveBeenCalledTimes(1);

		wrapper.unmount();
		resolveResponse();
		await flush();
		expect(onFileSuccess).not.toHaveBeenCalled();
		expect(onComplete).not.toHaveBeenCalled();
	});

	it('卸载及动态关闭 showLoading 都会销毁已创建的 Loading', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const firstDestroy = vi.fn();
		const secondDestroy = vi.fn();
		vi.spyOn(Message, 'loading')
			.mockReturnValueOnce({ destroy: firstDestroy } as any)
			.mockReturnValueOnce({ destroy: secondDestroy } as any);
		let resolveRequest!: () => void;
		const onRequest = ({ requestOptions }: { requestOptions: UploadRequestOptions }) => new Promise((resolve) => {
			resolveRequest = () => resolve(requestOptions);
		});
		const first = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				showLoading: true,
				onRequest
			} as any
		});

		(first.vm as any).uploadFiles([createFile('unmount-loading.png')]);
		await flush();
		first.unmount();
		expect(firstDestroy).toHaveBeenCalledTimes(1);
		resolveRequest();
		await flush();
		expect(firstDestroy).toHaveBeenCalledTimes(1);

		const second = mount(Upload, {
			props: { url: 'https://x.com/upload', showLoading: true } as any
		});
		(second.vm as any).uploadFiles([createFile('toggle-loading.png')]);
		await flush();
		await second.setProps({ showLoading: false });
		MockXHR.instances[0].emitResponse(200, '{}');
		await flush();
		expect(secondDestroy).toHaveBeenCalledTimes(1);
		second.unmount();
	});

	it('begin 回调同步卸载时清理批次且不创建任务面板', () => {
		const destroy = vi.fn();
		vi.spyOn(Message, 'loading').mockReturnValue({ destroy } as any);
		let unmount = () => {};
		const onBegin = () => unmount();
		const wrapper = mount(Upload, {
			props: {
				showLoading: true,
				showTask: true,
				onBegin
			} as any
		});
		unmount = () => wrapper.unmount();

		(wrapper.vm as any).uploadFiles([createFile('unmount-on-begin.png')]);
		expect(destroy).toHaveBeenCalledTimes(1);
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
	});

	it('file-start 回调同步卸载后不再调用 onRequest', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onRequest = vi.fn();
		const onComplete = vi.fn();
		let unmount = () => {};
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				onFileStart: () => unmount(),
				onRequest,
				onComplete
			} as any
		});
		unmount = () => wrapper.unmount();

		(wrapper.vm as any).uploadFiles([createFile('unmount-on-start.png')]);
		await flush();

		expect(onRequest).not.toHaveBeenCalled();
		expect(MockXHR.instances).toHaveLength(0);
		expect(onComplete).not.toHaveBeenCalled();
	});

	it('并行批次首个 onFileBefore 同步卸载后不再进入后续 Hook', async () => {
		let unmount = () => {};
		const onFileBefore = vi.fn(({ file }: { file: UploadFile }) => {
			unmount();
			return file;
		});
		const onFileStart = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				parallel: true,
				onFileBefore,
				onFileStart,
				onComplete
			} as any
		});
		unmount = () => wrapper.unmount();

		(wrapper.vm as any).uploadFiles([
			createFile('first.png'),
			createFile('second.png')
		]);
		await flush();

		expect(onFileBefore).toHaveBeenCalledTimes(1);
		expect(onFileStart).not.toHaveBeenCalled();
		expect(onComplete).not.toHaveBeenCalled();
	});

	it('共享任务浮层被外部销毁后会在当前批次的下一次状态更新时恢复', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload', showTask: true } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('before-destroy.png')]);
		await flush();
		UploadTask.destroy();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
		MockXHR.instances[0].emitProgress(1, 2);
		await nextTick();
		expect(document.body.querySelector('.vc-upload-task')?.textContent)
			.toContain('before-destroy.png');
		expect((document.body.querySelector('.vc-upload-task__bar') as HTMLElement).style.width)
			.toBe('50%');

		(wrapper.vm as any).uploadFiles([createFile('after-destroy.png')]);
		await flush();
		expect(document.body.querySelector('.vc-upload-task')?.textContent).toContain('after-destroy.png');
		MockXHR.instances[0].emitResponse(200, '{}');
		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();

		wrapper.unmount();
		UploadTask.destroy();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
	});

	it('各 Upload 在自身事件或重新启用 showTask 时恢复所属任务', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const first = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				showTask: true
			} as any
		});
		const second = mount(Upload, {
			props: {
				showTask: true,
				onFileBefore: () => {
					throw new Error('待恢复的错误');
				}
			} as any
		});

		(first.vm as any).uploadFiles([createFile('active-owner.png')]);
		(second.vm as any).uploadFiles([createFile('error-owner.png')]);
		await flush();
		expect(document.body.querySelector('.vc-upload-task')?.textContent)
			.toContain('待恢复的错误');

		UploadTask.destroy();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
		MockXHR.instances[0].emitProgress(1, 4);
		await nextTick();

		let task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('active-owner.png');
		expect(task.textContent).not.toContain('error-owner.png');

		await second.setProps({ showTask: false });
		await second.setProps({ showTask: true });
		task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('active-owner.png');
		expect(task.textContent).toContain('error-owner.png');
		expect(task.textContent).toContain('待恢复的错误');

		Portal.clear('vc-upload-task');
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
		MockXHR.instances[0].emitProgress(2, 4);
		await nextTick();

		task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('active-owner.png');
		expect(task.textContent).not.toContain('error-owner.png');
		const bars = task.querySelectorAll<HTMLElement>('.vc-upload-task__bar');
		expect(task.querySelectorAll('.vc-upload-task__list li')[0].textContent)
			.toContain('active-owner.png');
		expect(bars[0].style.width).toBe('50%');

		await second.setProps({ showTask: false });
		await second.setProps({ showTask: true });

		first.unmount();
		await nextTick();
		task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).not.toContain('active-owner.png');
		expect(task.textContent).toContain('error-owner.png');
		expect(task.textContent).toContain('上传结束，成功：0，失败：1，总数：1');

		second.unmount();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
	});

	it('Task Context 使用完成快照恢复，不保留可变 UploadFile 引用', async () => {
		let settledFile: UploadFile | undefined;
		const wrapper = mount(Upload, {
			props: {
				showTask: false,
				onFileSuccess: ({ file }: { file: UploadFile }) => {
					settledFile = file;
				}
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('snapshot.png')]);
		await flush();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();
		if (!settledFile) throw new Error('文件未完成结算');

		settledFile.name = 'mutated-after-complete.png';
		settledFile.size = 99 * 1024 * 1024;
		settledFile.percent = 1;
		await wrapper.setProps({ showTask: true });
		await nextTick();

		const task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('snapshot.png');
		expect(task.textContent).not.toContain('mutated-after-complete.png');
		expect(task.textContent).toContain('0.00 MB');
		expect(task.textContent).toContain('上传结束，成功：1，失败：0，总数：1');
		wrapper.unmount();
	});

	it('onFileBefore 返回新对象或 Blob 时保留原任务标识', async () => {
		const onComplete = vi.fn();
		const onFileSuccess = vi.fn();
		const onResponse = vi.fn(({ requestOptions }: { requestOptions: UploadRequestOptions }) => ({
			name: requestOptions.file.name
		}));
		const onFileBefore = vi.fn(({ file }: { file: UploadFile }) => {
			return file.current === 1
				? { ...file, uploadId: 'duplicated-id' }
				: new Blob(['processed'], { type: 'image/png' });
		});
		const wrapper = mount(Upload, {
			props: {
				max: 2,
				showTask: true,
				onFileBefore,
				onResponse,
				onFileSuccess,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('object.png'),
			createFile('blob.png')
		]);
		await flush();

		expect(onFileSuccess).toHaveBeenCalledTimes(2);
		const firstId = onFileSuccess.mock.calls[0][0].file.uploadId;
		const secondId = onFileSuccess.mock.calls[1][0].file.uploadId;
		expect(firstId).not.toBe('duplicated-id');
		expect(firstId).not.toBe(secondId);
		expect(onFileSuccess.mock.calls[1][0].file.target).toBeInstanceOf(File);
		expect(onResponse.mock.calls.map(([payload]) => payload.requestOptions.file.name))
			.toEqual(['object.png', 'blob.png']);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ succeeded: 2, total: 2 });
		expect(document.body.querySelector('.vc-upload-task')?.textContent)
			.toContain('上传结束，成功：2，失败：0，总数：2');

		wrapper.unmount();
	});

	it('重叠串行批次可以反序完成且各自独立调度', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				max: 2,
				parallel: false,
				onResponse: ({ requestOptions }: { requestOptions: UploadRequestOptions }) => requestOptions.file.name,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([
			createFile('first-a.png'),
			createFile('first-b.png')
		]);
		await flush();
		(wrapper.vm as any).uploadFiles([createFile('second.png')]);
		await flush();
		expect(MockXHR.instances).toHaveLength(2);

		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result.responses).toEqual(['second.png']);

		MockXHR.instances[0].emitResponse(200, '{}');
		await flush();
		expect(MockXHR.instances).toHaveLength(3);
		MockXHR.instances[2].emitResponse(200, '{}');
		await flush();

		expect(onComplete).toHaveBeenCalledTimes(2);
		expect(onComplete.mock.calls[1][0].result).toMatchObject({ succeeded: 2, total: 2 });
		expect(onComplete.mock.calls[1][0].result.responses)
			.toEqual(['first-a.png', 'first-b.png']);
		wrapper.unmount();
	});

	it('串行批次上传中切换 parallel=true 仍按原队列完成', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				max: 2,
				parallel: false,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('first.png'), createFile('second.png')]);
		await flush();
		expect(MockXHR.instances).toHaveLength(1);

		await wrapper.setProps({ parallel: true });
		MockXHR.instances[0].emitResponse(200, '{}');
		await flush();
		expect(MockXHR.instances).toHaveLength(2);
		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ succeeded: 2, total: 2 });

		wrapper.unmount();
	});

	it('并行批次上传中切换 parallel=false 不会重复发送请求', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onComplete = vi.fn();
		const wrapper = mount(Upload, {
			props: {
				url: 'https://x.com/upload',
				max: 2,
				parallel: true,
				onComplete
			} as any
		});

		(wrapper.vm as any).uploadFiles([createFile('first.png'), createFile('second.png')]);
		await flush();
		expect(MockXHR.instances).toHaveLength(2);

		await wrapper.setProps({ parallel: false });
		MockXHR.instances[0].emitResponse(200, '{}');
		MockXHR.instances[1].emitResponse(200, '{}');
		await flush();
		expect(MockXHR.instances).toHaveLength(2);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][0].result).toMatchObject({ succeeded: 2, total: 2 });

		wrapper.unmount();
	});

	it('上传过程中启用 showTask 会恢复当前状态和进度', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const wrapper = mount(Upload, {
			props: { url: 'https://x.com/upload', showTask: false } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('enable-during-upload.png')]);
		await flush();
		MockXHR.instances[0].emitProgress(2, 5);
		await nextTick();
		expect(document.body.querySelector('.vc-upload-task')).toBeNull();

		await wrapper.setProps({ showTask: true });
		const task = document.body.querySelector('.vc-upload-task')!;
		expect(task.textContent).toContain('enable-during-upload.png');
		expect(task.textContent).toContain('上传中');
		expect((task.querySelector('.vc-upload-task__bar') as HTMLElement).style.width).toBe('40%');

		MockXHR.instances[0].emitResponse(200, '{}');
		await flush();
		expect(task.textContent).toContain('上传结束，成功：1，失败：0，总数：1');

		wrapper.unmount();
	});
});
