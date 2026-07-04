// @vitest-environment jsdom

import { vi } from 'vitest';
import { Snapshot, VcInstance, Message } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';

const flush = async () => {
	for (let i = 0; i < 5; i++) {
		await nextTick();
		await Promise.resolve();
	}
};

// snapdom 返回的快照对象
const createSnapshotObject = () => ({
	toRaw: vi.fn(() => 'data:image/svg+xml;raw'),
	toPng: vi.fn(async () => ({ src: 'data:image/png;base64,xxx' })),
	toCanvas: vi.fn(async () => document.createElement('canvas')),
	download: vi.fn(async () => true)
});

describe('index.ts', () => {
	const origialGetComputedStyle = window.getComputedStyle;
	Object.defineProperty(window, 'getComputedStyle', {
		value: (e: any) => {
			const v = origialGetComputedStyle(e);
			const keys = Array.from(v);
			v[Symbol.iterator] = keys[Symbol.iterator].bind(keys);
			return v;
		}
	});

	let snapshotObject: ReturnType<typeof createSnapshotObject>;
	let snapdom: any;
	let loadingSpy: any;
	let loadingContext: { destroy: any };

	// 通过 template ref 访问 expose 出来的方法
	const mountSnapshot = (props: Record<string, any> = {}, slot?: any) => {
		const target = ref<any>();
		const wrapper = mount(() => (
			<Snapshot ref={target} {...props}>
				{ slot?.() }
			</Snapshot>
		), { attachTo: document.body });

		return { wrapper, target };
	};

	beforeEach(() => {
		snapshotObject = createSnapshotObject();
		// 挂到 window 上, 组件优先读取 window.snapdom, 避免走动态 import
		snapdom = vi.fn(async () => snapshotObject);
		(window as any).snapdom = snapdom;

		loadingContext = { destroy: vi.fn() };
		loadingSpy = vi.spyOn(Message, 'loading').mockReturnValue(loadingContext as any);
	});

	afterEach(() => {
		delete (window as any).snapdom;
		VcInstance.options.Snapshot = { options: undefined, source: undefined, download: undefined };
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('basic', () => {
		expect(typeof Snapshot).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Snapshot />));

		expect(wrapper.classes()).toContain('vc-snapshot');
	});

	it('渲染默认插槽内容', () => {
		const wrapper = mount(() => (
			<Snapshot>
				<span class="inner">hello</span>
			</Snapshot>
		));

		expect(wrapper.find('.inner').exists()).toBe(true);
		expect(wrapper.text()).toBe('hello');
	});

	it('lazy=true(默认): 挂载时不会调用 snapdom', async () => {
		mountSnapshot();
		await flush();

		expect(snapdom).not.toHaveBeenCalled();
	});

	it('lazy=false: 挂载时立即刷新, 调用 snapdom', async () => {
		mountSnapshot({ lazy: false });
		await flush();

		expect(snapdom).toHaveBeenCalledTimes(1);
	});

	it('ready 事件: 携带 instance 与 snapDOM 依赖', async () => {
		const onReady = vi.fn();
		mountSnapshot({ onReady });
		await flush();

		expect(onReady).toHaveBeenCalledTimes(1);
		const payload = onReady.mock.calls[0][0];
		expect(payload.instance).toBeTruthy();
		expect(payload.dependencies.snapDOM).toBe(snapdom);
	});

	it('refresh: 调用 snapdom 并返回快照对象, 合并 props.options', async () => {
		const { wrapper, target } = mountSnapshot({ options: { scale: 2 } });
		await flush();

		const result = await target.value.refresh();

		expect(result).toStrictEqual(snapshotObject);
		expect(snapdom).toHaveBeenCalledTimes(1);
		const [el, options] = snapdom.mock.calls[0];
		expect(el).toBe(wrapper.element);
		expect(options.fast).toBe(false);
		expect(options.scale).toBe(2);
	});

	it('refresh: 合并全局 VcInstance.options.Snapshot.options, props.options 优先级更高', async () => {
		VcInstance.options.Snapshot = { options: { scale: 1, quality: 0.5 } };

		const { target } = mountSnapshot({ options: { scale: 3 } });
		await flush();

		await target.value.refresh();

		const options = snapdom.mock.calls[0][1];
		expect(options.quality).toBe(0.5);
		expect(options.scale).toBe(3);
	});

	it('toDataURL(默认 svg): 返回 toRaw 结果, 并显示/关闭 loading', async () => {
		const { target } = mountSnapshot();
		await flush();

		const url = await target.value.toDataURL();

		expect(url).toBe('data:image/svg+xml;raw');
		expect(snapshotObject.toRaw).toHaveBeenCalledTimes(1);
		expect(snapshotObject.toPng).not.toHaveBeenCalled();
		expect(loadingSpy).toHaveBeenCalledTimes(1);
		expect(loadingContext.destroy).toHaveBeenCalledTimes(1);
	});

	it('toDataURL("png"): 返回 toPng().src', async () => {
		const { target } = mountSnapshot();
		await flush();

		const url = await target.value.toDataURL('png');

		expect(url).toBe('data:image/png;base64,xxx');
		expect(snapshotObject.toPng).toHaveBeenCalledTimes(1);
		expect(snapshotObject.toRaw).not.toHaveBeenCalled();
	});

	it('showLoading=false: 不显示 loading', async () => {
		const { target } = mountSnapshot({ showLoading: false });
		await flush();

		await target.value.toDataURL();

		expect(loadingSpy).not.toHaveBeenCalled();
	});

	it('toDataURL 出错时也会关闭 loading', async () => {
		snapshotObject.toRaw = vi.fn(() => {
			throw new Error('boom');
		});

		const { target } = mountSnapshot();
		await flush();

		await expect(target.value.toDataURL()).rejects.toThrow('boom');
		expect(loadingContext.destroy).toHaveBeenCalledTimes(1);
	});

	it('download(默认): 无自定义拦截时执行默认下载', async () => {
		const { target } = mountSnapshot();
		await flush();

		await target.value.download({ filename: 'a' });
		await flush();

		expect(snapshotObject.download).toHaveBeenCalledTimes(1);
		expect(snapshotObject.download).toHaveBeenCalledWith({ filename: 'a' });
		expect(loadingContext.destroy).toHaveBeenCalled();
	});

	it('download: props.download 同步返回 true 时跳过默认下载', async () => {
		const userDownload = vi.fn(() => true);
		const { target } = mountSnapshot({ download: userDownload });
		await flush();

		await target.value.download({ filename: 'a' });
		await flush();

		expect(userDownload).toHaveBeenCalledTimes(1);
		expect(snapshotObject.download).not.toHaveBeenCalled();
	});

	it('download: props.download 同步返回 false 时执行默认下载', async () => {
		const userDownload = vi.fn(() => false);
		const { target } = mountSnapshot({ download: userDownload });
		await flush();

		await target.value.download({});
		await flush();

		expect(userDownload).toHaveBeenCalledTimes(1);
		expect(snapshotObject.download).toHaveBeenCalledTimes(1);
	});

	it('download: props.download 返回 Promise<true> 时跳过默认下载', async () => {
		const userDownload = vi.fn(() => Promise.resolve(true));
		const { target } = mountSnapshot({ download: userDownload });
		await flush();

		await target.value.download({});
		await flush();

		expect(snapshotObject.download).not.toHaveBeenCalled();
	});

	it('download: props.download 返回 Promise<undefined> 视为跳过', async () => {
		const userDownload = vi.fn(() => Promise.resolve(undefined));
		const { target } = mountSnapshot({ download: userDownload });
		await flush();

		await target.value.download({});
		await flush();

		expect(snapshotObject.download).not.toHaveBeenCalled();
	});

	it('download: props.download 返回 Promise<false> 时执行默认下载', async () => {
		const userDownload = vi.fn(() => Promise.resolve(false));
		const { target } = mountSnapshot({ download: userDownload });
		await flush();

		await target.value.download({});
		await flush();

		expect(snapshotObject.download).toHaveBeenCalledTimes(1);
	});

	it('download: 使用全局 VcInstance.options.Snapshot.download 拦截', async () => {
		const globalDownload = vi.fn(() => true);
		VcInstance.options.Snapshot = { download: globalDownload };

		const { target } = mountSnapshot();
		await flush();

		await target.value.download({});
		await flush();

		expect(globalDownload).toHaveBeenCalledTimes(1);
		expect(snapshotObject.download).not.toHaveBeenCalled();
	});

	it('onMounted 出错时抛出 VcError', async () => {
		snapdom = vi.fn(() => {
			throw new Error('snapdom failed');
		});
		(window as any).snapdom = snapdom;

		const errorHandler = vi.fn();
		mount(() => (<Snapshot lazy={false} />), {
			attachTo: document.body,
			global: { config: { errorHandler } }
		});
		await flush();

		expect(errorHandler).toHaveBeenCalled();
		const err = errorHandler.mock.calls[0][0];
		expect(err.message).toContain('snapshot');
	});

	it('expose: 暴露 snapshot/refresh/toDataURL/download', async () => {
		const { target } = mountSnapshot();
		await flush();

		expect(typeof target.value.refresh).toBe('function');
		expect(typeof target.value.toDataURL).toBe('function');
		expect(typeof target.value.download).toBe('function');
		expect('snapshot' in target.value).toBe(true);
	});
});
