// @vitest-environment jsdom

import { Chart } from '@deot/vc-components';
import { Resize } from '@deot/helper-resize';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { vi, beforeEach, afterEach } from 'vitest';

// mock 动态 import('echarts')，用于覆盖 window.echarts 不存在时的加载分支。
// 使用 default 导出以覆盖 `echarts.default ? echarts.default : echarts` 的兼容逻辑。
const hoisted = vi.hoisted(() => {
	const instances: any[] = [];
	const init = (el: any) => {
		const chart = {
			el,
			group: undefined,
			setOption: () => {},
			resize: () => {},
			dispose: () => {},
			getOption: () => ({}),
			on: () => {}
		};
		instances.push(chart);
		return chart;
	};
	return { instances, init };
});
vi.mock('echarts', () => ({ default: { init: hoisted.init } }));

// onMounted 内部通过 `window.echarts || await import('echarts')` 获取依赖，
// jsdom 下真实 echarts 无法渲染 canvas，这里注入一个假的 echarts 记录调用。
const createFakeChart = () => {
	const handlers: Record<string, (params: any) => void> = {};
	return {
		group: undefined as string | undefined,
		disposed: false,
		setOption: vi.fn(),
		resize: vi.fn(),
		getOption: vi.fn(() => ({})),
		dispose: vi.fn(function (this: any) { this.disposed = true; }),
		on: vi.fn((event: string, cb: (params: any) => void) => { handlers[event] = cb; }),
		__emit(event: string, params: any) { handlers[event]?.(params); }
	};
};

let echartsInstances: ReturnType<typeof createFakeChart>[] = [];
let initSpy: ReturnType<typeof vi.fn>;
// 捕获组件注册到 Resize 上的回调，便于手动触发 handleResize。
let resizeHandlers: Array<(...args: any[]) => any> = [];

// 覆盖 jsdom 下始终为 0 的尺寸，让 getArea() 返回非 0 值。
const mockSize = (el: any, size: number) => {
	Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => size });
	Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => size });
};

// 多次让出微任务，等待 onMounted 中的异步 import 及后续 nextTick 完成。
const flush = async () => {
	for (let i = 0; i < 5; i++) {
		await nextTick();
		await Promise.resolve();
	}
};

beforeEach(() => {
	echartsInstances = [];
	resizeHandlers = [];
	initSpy = vi.fn((el: any, theme: any, pluginOptions: any) => {
		const chart = createFakeChart();
		(chart as any).__el = el;
		(chart as any).__theme = theme;
		(chart as any).__pluginOptions = pluginOptions;
		echartsInstances.push(chart);
		return chart;
	});
	(window as any).echarts = { init: initSpy };

	// Resize 依赖 ResizeObserver，jsdom 下 mock 掉并捕获回调，专注测试 chart 逻辑。
	vi.spyOn(Resize, 'on').mockImplementation((_el: any, fn: any) => {
		resizeHandlers.push(fn);
		return () => {};
	});
	vi.spyOn(Resize, 'off').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	delete (window as any).echarts;
});

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Chart).toBe('object');
	});

	it('create', () => {
		const wrapper = mount(() => (<Chart />));

		expect(wrapper.classes()).toContain('vc-chart');
	});

	it('render: 渲染默认插槽内容', () => {
		const wrapper = mount(() => (
			<Chart v-slots={{ default: () => <span class="inner">child</span> }} />
		));

		expect(wrapper.find('.inner').text()).toBe('child');
	});

	it('ready: 挂载后触发 ready 并携带 echarts 依赖', async () => {
		const onReady = vi.fn();
		const wrapper = mount(() => (<Chart onReady={onReady} />));
		await flush();

		expect(onReady).toHaveBeenCalledTimes(1);
		const payload = onReady.mock.calls[0][0];
		expect(payload.dependencies.echarts).toBe((window as any).echarts);

		wrapper.unmount();
	});

	it('无 options 时不初始化 echarts 实例', async () => {
		const wrapper = mount(() => (<Chart />));
		await flush();

		expect(initSpy).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('options: 挂载时初始化并 setOption', async () => {
		const onReady = vi.fn();
		const options = { series: [{ type: 'line', data: [1, 2, 3] }] };
		const wrapper = mount(() => (<Chart options={options} onReady={onReady} />));
		await flush();

		expect(initSpy).toHaveBeenCalledTimes(1);
		expect(echartsInstances.length).toBe(1);
		expect(echartsInstances[0].setOption).toHaveBeenCalledWith(options, true);

		const payload = onReady.mock.calls[0][0];
		expect(payload.instance).toBe(echartsInstances[0]);

		wrapper.unmount();
	});

	it('theme & pluginOptions: 透传给 echarts.init', async () => {
		const pluginOptions = { renderer: 'svg' };
		const wrapper = mount(() => (
			<Chart options={{}} theme="dark" pluginOptions={pluginOptions} />
		));
		await flush();

		expect(initSpy).toHaveBeenCalledTimes(1);
		expect((echartsInstances[0] as any).__theme).toBe('dark');
		expect((echartsInstances[0] as any).__pluginOptions).toBe(pluginOptions);

		wrapper.unmount();
	});

	it('group: 初始化时设置分组', async () => {
		const wrapper = mount(() => (<Chart options={{}} group="g1" />));
		await flush();

		expect(echartsInstances[0].group).toBe('g1');
		wrapper.unmount();
	});

	it('group: 变更后同步到 chart 实例', async () => {
		const group = ref('g1');
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={{}} group={group.value} />);
			}
		}));
		await flush();

		expect(echartsInstances[0].group).toBe('g1');

		group.value = 'g2';
		await flush();

		expect(echartsInstances[0].group).toBe('g2');
		wrapper.unmount();
	});

	it('events: echarts 事件转发为组件事件', async () => {
		const onClick = vi.fn();
		const wrapper = mount(() => (<Chart options={{}} onClick={onClick} />));
		await flush();

		expect(echartsInstances[0].on).toHaveBeenCalled();
		echartsInstances[0].__emit('click', { name: 'a' });

		expect(onClick).toHaveBeenCalledWith({ name: 'a' });
		wrapper.unmount();
	});

	it('resize: 默认注册 Resize 监听', async () => {
		const wrapper = mount(() => (<Chart options={{}} />));
		await flush();

		expect(Resize.on).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('resize=false: 不注册 Resize 监听', async () => {
		const wrapper = mount(() => (<Chart options={{}} resize={false} />));
		await flush();

		expect(Resize.on).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('options 变更: chart 已存在时调用 setOption', async () => {
		const options = ref<any>({ series: [{ type: 'line', data: [1] }] });
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} />);
			}
		}));
		await flush();

		const chart = echartsInstances[0];
		const prevCalls = chart.setOption.mock.calls.length;

		const next = { series: [{ type: 'bar', data: [2] }] };
		options.value = next;
		await flush();

		expect(chart.setOption.mock.calls.length).toBeGreaterThan(prevCalls);
		expect(chart.setOption).toHaveBeenLastCalledWith(next, true);

		wrapper.unmount();
	});

	it('options 变更: chart 不存在时触发初始化', async () => {
		const options = ref<any>(undefined);
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} />);
			}
		}));
		await flush();

		// 初始无 options，未初始化
		expect(initSpy).not.toHaveBeenCalled();

		options.value = { series: [] };
		await flush();

		expect(initSpy).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('manualUpdate: 不监听 options 变化', async () => {
		const options = ref<any>({ series: [{ type: 'line', data: [1] }] });
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} manualUpdate />);
			}
		}));
		await flush();

		const chart = echartsInstances[0];
		const prevCalls = chart.setOption.mock.calls.length;

		options.value = { series: [{ type: 'bar', data: [2] }] };
		await flush();

		// manualUpdate 下不会因 options 变化自动 setOption
		expect(chart.setOption.mock.calls.length).toBe(prevCalls);
		wrapper.unmount();
	});

	it('unmount: 销毁 chart 并移除 Resize 监听', async () => {
		const wrapper = mount(() => (<Chart options={{}} />));
		await flush();

		const chart = echartsInstances[0];
		wrapper.unmount();

		expect(chart.dispose).toHaveBeenCalledTimes(1);
		expect(Resize.off).toHaveBeenCalled();
	});

	it('refresh: 销毁旧实例并重新初始化', async () => {
		const chartRef = ref<any>();
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart ref={chartRef} options={{}} />);
			}
		}));
		await flush();

		expect(echartsInstances.length).toBe(1);
		const first = echartsInstances[0];

		chartRef.value.refresh();
		await flush();

		expect(first.dispose).toHaveBeenCalledTimes(1);
		expect(echartsInstances.length).toBe(2);
		expect(chartRef.value.chart).toBe(echartsInstances[1]);

		wrapper.unmount();
	});

	it('resize 触发: 初始隐藏(area=0)时重建配置并 resize', async () => {
		const options = { series: [{ type: 'line', data: [1] }] };
		const wrapper = mount(() => (<Chart options={options} resize={0} />));
		await flush();

		const chart = echartsInstances[0];
		chart.setOption.mockClear();

		// area 为 0 走初始渲染补偿分支: mergeOptions({},true) -> resize -> mergeOptions(options,true)
		resizeHandlers[0]();

		const calls = chart.setOption.mock.calls;
		expect(chart.resize).toHaveBeenCalledTimes(1);
		expect(calls[0].slice(0, 2)).toEqual([{}, true]);
		expect(calls[calls.length - 1].slice(0, 2)).toEqual([options, true]);

		wrapper.unmount();
	});

	it('resize 触发: area>0 时仅调用 resize', async () => {
		const wrapper = mount(() => (<Chart options={{}} resize={0} />));
		await flush();

		const chart = echartsInstances[0];
		mockSize(wrapper.element, 200);

		// 第一次: area 仍为 0(init 时记录), 走补偿分支并把 lastArea 更新为非 0
		resizeHandlers[0]();
		chart.resize.mockClear();
		chart.setOption.mockClear();

		// 第二次: lastArea>0, 仅 resize
		resizeHandlers[0]();

		expect(chart.resize).toHaveBeenCalledTimes(1);
		expect(chart.setOption).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('manualUpdate + resize 触发: mergeOptions 缓存 manualOptions', async () => {
		const options = { series: [{ type: 'bar', data: [3] }] };
		const wrapper = mount(() => (<Chart options={options} manualUpdate resize={0} />));
		await flush();

		const chart = echartsInstances[0];
		chart.setOption.mockClear();

		resizeHandlers[0]();

		// manualUpdate 分支下 mergeOptions 仍会把配置写入实例
		const last = chart.setOption.mock.calls.at(-1)!;
		expect(last.slice(0, 2)).toEqual([options, true]);

		wrapper.unmount();
	});

	it('resize 为数字: 使用防抖注册监听', async () => {
		const wrapper = mount(() => (<Chart options={{}} resize={50} />));
		await flush();

		// leading 防抖首次调用即触发 handleResize
		expect(resizeHandlers.length).toBe(1);
		resizeHandlers[0]();
		expect(echartsInstances[0].resize).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('resize=true: 注册非防抖监听', async () => {
		const wrapper = mount(() => (<Chart options={{}} resize={true} />));
		await flush();

		expect(Resize.on).toHaveBeenCalledTimes(1);
		expect(resizeHandlers.length).toBe(1);

		wrapper.unmount();
	});

	it('window.echarts 不存在时动态 import echarts', async () => {
		delete (window as any).echarts;
		hoisted.instances.length = 0;

		const wrapper = mount(() => (<Chart options={{}} />));
		for (let i = 0; i < 20; i++) {
			await nextTick();
			await Promise.resolve();
		}

		// 走 import('echarts') 分支并使用其 default 导出创建实例
		expect(hoisted.instances.length).toBe(1);

		wrapper.unmount();
	});

	it('watchShallow: options 深层变化时使用浅监听', async () => {
		const options = ref<any>({ series: [{ type: 'line', data: [1] }] });
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} watchShallow />);
			}
		}));
		await flush();

		const chart = echartsInstances[0];
		chart.setOption.mockClear();

		// 替换整个引用应触发 setOption
		options.value = { series: [{ type: 'bar', data: [2] }] };
		await flush();

		expect(chart.setOption).toHaveBeenCalled();
		wrapper.unmount();
	});

	it('watch 配置项变化触发 refresh 重建实例', async () => {
		const theme = ref('dark');
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={{}} theme={theme.value} />);
			}
		}));
		await flush();

		expect(echartsInstances.length).toBe(1);

		theme.value = 'light';
		await flush();

		expect(echartsInstances.length).toBe(2);
		expect((echartsInstances[1] as any).__theme).toBe('light');

		wrapper.unmount();
	});
});
