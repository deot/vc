// @vitest-environment jsdom

import { vi } from 'vitest';
import { Upload, Message, VcInstance } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const flush = async () => {
	for (let i = 0; i < 8; i++) {
		await nextTick();
		await Promise.resolve();
	}
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
		document.body.innerHTML = '';
		VcInstance.options.Upload = undefined as any;
		MockXHR.instances = [];
		vi.restoreAllMocks();
	});

	it('basic', () => {
		expect(typeof Upload).toBe('object');
		expect(typeof Upload.open).toBe('function');
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
		const errArg = onError.mock.calls[0][0];
		expect(errArg.message).toContain('文件格式限制');
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
		expect(onError.mock.calls[0][0].message).toContain('数量不能超过');
	});

	it('文件夹模式数量超限: 提示文案区分文件夹', async () => {
		vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const wrapper = mount(Upload, {
			props: { max: 1, directory: true, onError } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png'), createFile('b.png')]);
		await flush();

		expect(onError.mock.calls[0][0].message).toContain('文件夹内文件的数量');
	});

	it('showToast=true 且 showMessage=false: 使用 MToast 提示', async () => {
		const errorSpy = vi.spyOn(Message, 'error').mockImplementation((() => ({})) as any);
		const onError = vi.fn();
		const wrapper = mount(Upload, {
			props: { accept: 'image/*', showMessage: false, showToast: true, onError } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.txt', 'text/plain')]);
		await flush();

		expect(errorSpy).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledTimes(1);
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
		expect(onComplete.mock.calls[0][0]).toMatchObject({ success: 1, total: 1, error: 0 });
	});

	it('onFileBefore 会在上传前被调用并透传 file / fileList', async () => {
		const onFileBefore = vi.fn((vFile: any) => vFile);
		const onFileSuccess = vi.fn();
		const wrapper = mount(Upload, {
			props: { onFileBefore, onFileSuccess } as any
		});

		(wrapper.vm as any).uploadFiles([createFile('a.png')]);
		await flush();

		expect(onFileBefore).toHaveBeenCalledTimes(1);
		const [vFile, fileList] = onFileBefore.mock.calls[0] as any[];
		expect(vFile.name).toBe('a.png');
		expect(Array.isArray(fileList)).toBe(true);
		expect(onFileSuccess).toHaveBeenCalledTimes(1);
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
		expect(onComplete.mock.calls[0][0]).toMatchObject({ error: 1, total: 1 });
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
		expect(onFileSuccess.mock.calls[0][0]).toMatchObject({ code: 0, url: 'ok' });
		expect(onComplete).toHaveBeenCalledTimes(1);

		vi.unstubAllGlobals();
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
		expect(onFileProgress.mock.calls[0][0]).toMatchObject({ percent: 50, progress: 0.5 });

		vi.unstubAllGlobals();
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
		expect(onComplete.mock.calls[0][0]).toMatchObject({ error: 1, total: 1 });

		vi.unstubAllGlobals();
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
		expect(onComplete.mock.calls[0][0]).toMatchObject({ success: 2, total: 2 });
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

	it('onRequest 可改写 options (来自 props)', async () => {
		vi.stubGlobal('XMLHttpRequest', MockXHR as any);
		const onRequest = vi.fn((options: any) => ({
			...options,
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
