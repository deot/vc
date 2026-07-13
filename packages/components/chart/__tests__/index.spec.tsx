// @vitest-environment jsdom

import { Chart } from '@deot/vc-components';
import { Resize } from '@deot/helper-resize';
import { mount } from '@vue/test-utils';
import * as echarts from 'echarts';
import { defineComponent, nextTick, ref } from 'vue';
import { vi, beforeEach, afterEach } from 'vitest';

// 捕获组件注册到 Resize 上的回调，便于手动触发 handleResize。
let resizeHandlers: Array<(...args: any[]) => any> = [];

const pieOptions = (value = 1) => ({
	series: [{
		type: 'pie',
		data: [{ name: 'A', value }]
	}]
});

const getExposedChart = (source: any) => {
	const vm = source?.vm || source?.value || source;
	const exposed = vm?.chart ?? vm?.$?.exposed?.chart;
	if (exposed?.__v_isRef) return exposed.value || null;
	return exposed || null;
};

const sleep = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));

const mockClientSize = (el: any, size: number) => {
	Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => size });
	Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => size });
};

// 覆盖 jsdom 下始终为 0 的尺寸，让 getArea() 返回非 0 值。
const mockSize = (el: any, size: number) => {
	Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => size });
	Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => size });
	mockClientSize(el, size);
};

const mountChart = (options: any = {}) => {
	const wrapper = mount(Chart, {
		attachTo: document.body,
		...options
	});
	mockSize(wrapper.element, 200);
	return wrapper;
};

// 多次让出微任务，等待 onMounted 中的异步 import 及后续 nextTick 完成。
const flush = async () => {
	for (let i = 0; i < 5; i++) {
		await nextTick();
		await Promise.resolve();
		await sleep();
	}
};

beforeEach(() => {
	resizeHandlers = [];

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

	it('ready: 挂载后触发 ready 并携带 window.echarts 依赖', async () => {
		(window as any).echarts = echarts;
		const onReady = vi.fn();
		const wrapper = mountChart({
			attrs: { onReady }
		});
		await flush();

		expect(onReady).toHaveBeenCalledTimes(1);
		const payload = onReady.mock.calls[0][0];
		expect(payload.dependencies.echarts).toBe(echarts);

		wrapper.unmount();
	});

	it('无 options 时不初始化 echarts 实例', async () => {
		const wrapper = mountChart();
		await flush();

		expect(getExposedChart(wrapper)).toBeNull();
		expect(echarts.getInstanceByDom(wrapper.element as HTMLElement)).toBeUndefined();
		wrapper.unmount();
	});

	it('options: 挂载时初始化并 setOption', async () => {
		const onReady = vi.fn();
		const options = pieOptions(3);
		const wrapper = mountChart({
			props: {
				options
			},
			attrs: { onReady }
		});
		await flush();

		const chart = getExposedChart(wrapper);
		expect(chart).toBe(echarts.getInstanceByDom(wrapper.element as HTMLElement));
		expect(chart.getOption().series[0].type).toBe('pie');
		expect(chart.getOption().series[0].data[0].value).toBe(3);

		const payload = onReady.mock.calls[0][0];
		expect(payload.instance).toBe(chart);

		wrapper.unmount();
	});

	it('theme & pluginOptions: 透传给 echarts.init', async () => {
		const pluginOptions = { renderer: 'svg' };
		const wrapper = mountChart({
			props: {
				options: {},
				theme: 'dark',
				pluginOptions
			}
		});
		await flush();

		const chart = getExposedChart(wrapper);
		expect((chart as any)._theme.darkMode).toBe(true);
		expect(chart.getZr().painter.type).toBe('svg');

		wrapper.unmount();
	});

	it('group: 初始化时设置分组', async () => {
		const wrapper = mountChart({
			props: {
				options: {},
				group: 'g1'
			}
		});
		await flush();

		expect(getExposedChart(wrapper).group).toBe('g1');
		wrapper.unmount();
	});

	it('group: 变更后同步到 chart 实例', async () => {
		const group = ref('g1');
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={{}} group={group.value} />);
			}
		}));
		mockSize(wrapper.element, 200);
		await flush();

		const chart = getExposedChart(wrapper.findComponent(Chart));
		expect(chart.group).toBe('g1');

		group.value = 'g2';
		await flush();

		expect(chart.group).toBe('g2');
		wrapper.unmount();
	});

	it('events: echarts 事件转发为组件事件', async () => {
		const onClick = vi.fn();
		const wrapper = mountChart({
			props: {
				options: {},
				onClick
			}
		});
		await flush();

		(getExposedChart(wrapper) as any).trigger('click', { name: 'a' });

		expect(onClick).toHaveBeenCalledWith({ name: 'a' });
		wrapper.unmount();
	});

	it('resize: 默认注册 Resize 监听', async () => {
		const wrapper = mountChart({
			props: { options: {} }
		});
		await flush();

		expect(Resize.on).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('resize=false: 不注册 Resize 监听', async () => {
		const wrapper = mountChart({
			props: {
				options: {},
				resize: false
			}
		});
		await flush();

		expect(Resize.on).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('options 变更: chart 已存在时调用 setOption', async () => {
		const options = ref<any>(pieOptions(1));
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} />);
			}
		}));
		mockSize(wrapper.element, 200);
		await flush();

		const chart = getExposedChart(wrapper.findComponent(Chart));
		const setOption = vi.spyOn(chart, 'setOption');

		const next = pieOptions(2);
		options.value = next;
		await flush();

		expect(setOption).toHaveBeenCalledWith(next, true);

		wrapper.unmount();
	});

	it('options 变更: chart 不存在时触发初始化', async () => {
		const options = ref<any>(undefined);
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} />);
			}
		}));
		mockSize(wrapper.element, 200);
		await flush();

		// 初始无 options，未初始化
		expect(getExposedChart(wrapper.findComponent(Chart))).toBeNull();

		options.value = { series: [] };
		await flush();

		expect(getExposedChart(wrapper.findComponent(Chart))).toBe(echarts.getInstanceByDom(wrapper.element as HTMLElement));
		wrapper.unmount();
	});

	it('options 变更早于 echarts 加载时延迟初始化', async () => {
		const options = ref<any>(undefined);
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} />);
			}
		}));
		mockSize(wrapper.element, 200);

		options.value = { series: [] };
		await nextTick();

		expect(getExposedChart(wrapper.findComponent(Chart))).toBeNull();

		await flush();

		expect(getExposedChart(wrapper.findComponent(Chart))).toBe(echarts.getInstanceByDom(wrapper.element as HTMLElement));
		wrapper.unmount();
	});

	it('manualUpdate: 不监听 options 变化', async () => {
		const options = ref<any>(pieOptions(1));
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} manualUpdate />);
			}
		}));
		mockSize(wrapper.element, 200);
		await flush();

		const chart = getExposedChart(wrapper.findComponent(Chart));
		const setOption = vi.spyOn(chart, 'setOption');

		options.value = pieOptions(2);
		await flush();

		// manualUpdate 下不会因 options 变化自动 setOption
		expect(setOption).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('unmount: 销毁 chart 并移除 Resize 监听', async () => {
		const wrapper = mountChart({
			props: { options: {} }
		});
		await flush();

		const chart = getExposedChart(wrapper);
		const dispose = vi.spyOn(chart, 'dispose');
		wrapper.unmount();

		expect(dispose).toHaveBeenCalledTimes(1);
		expect(Resize.off).toHaveBeenCalled();
	});

	it('refresh: 销毁旧实例并重新初始化', async () => {
		const chartRef = ref<any>();
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart ref={chartRef} options={{}} />);
			}
		}));
		mockSize(wrapper.element, 200);
		await flush();

		const first = getExposedChart(chartRef);
		const dispose = vi.spyOn(first, 'dispose');

		chartRef.value.refresh();
		await flush();

		const second = getExposedChart(chartRef);
		expect(dispose).toHaveBeenCalledTimes(1);
		expect(second).not.toBe(first);
		expect(second).toBe(echarts.getInstanceByDom(wrapper.element as HTMLElement));

		wrapper.unmount();
	});

	it('resize 触发: 初始隐藏(area=0)时重建配置并 resize', async () => {
		const options = pieOptions(1);
		const wrapper = mount(Chart, {
			attachTo: document.body,
			props: {
				options,
				resize: 0
			}
		});
		mockClientSize(wrapper.element, 200);
		await flush();

		const chart = getExposedChart(wrapper);
		const setOption = vi.spyOn(chart, 'setOption');
		const resize = vi.spyOn(chart, 'resize');

		// area 为 0 走初始渲染补偿分支: mergeOptions({},true) -> resize -> mergeOptions(options,true)
		resizeHandlers[0]();

		const calls = setOption.mock.calls;
		expect(resize).toHaveBeenCalledTimes(1);
		expect(calls[0].slice(0, 2)).toEqual([{}, true]);
		expect(calls[calls.length - 1].slice(0, 2)).toEqual([options, true]);

		wrapper.unmount();
	});

	it('resize 触发: area>0 时仅调用 resize', async () => {
		const wrapper = mount(Chart, {
			attachTo: document.body,
			props: {
				options: {},
				resize: 0
			}
		});
		mockClientSize(wrapper.element, 200);
		await flush();

		const chart = getExposedChart(wrapper);
		const resize = vi.spyOn(chart, 'resize');
		const setOption = vi.spyOn(chart, 'setOption');
		mockSize(wrapper.element, 200);

		// 第一次: area 仍为 0(init 时记录), 走补偿分支并把 lastArea 更新为非 0
		resizeHandlers[0]();
		resize.mockClear();
		setOption.mockClear();

		// 第二次: lastArea>0, 仅 resize
		resizeHandlers[0]();

		expect(resize).toHaveBeenCalledTimes(1);
		expect(setOption).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('manualUpdate + resize 触发: mergeOptions 缓存 manualOptions', async () => {
		const options = pieOptions(3);
		const wrapper = mount(Chart, {
			attachTo: document.body,
			props: {
				options,
				manualUpdate: true,
				resize: 0
			}
		});
		mockClientSize(wrapper.element, 200);
		await flush();

		const chart = getExposedChart(wrapper);
		const setOption = vi.spyOn(chart, 'setOption');

		resizeHandlers[0]();

		// manualUpdate 分支下 mergeOptions 仍会把配置写入实例
		const last = setOption.mock.calls.at(-1)!;
		expect(last.slice(0, 2)).toEqual([options, true]);

		wrapper.unmount();
	});

	it('resize 为数字: 使用防抖注册监听', async () => {
		const wrapper = mountChart({
			props: {
				options: {},
				resize: 50
			}
		});
		await flush();

		// leading 防抖首次调用即触发 handleResize
		expect(resizeHandlers.length).toBe(1);
		const resize = vi.spyOn(getExposedChart(wrapper), 'resize');
		resizeHandlers[0]();
		expect(resize).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('resize=true: 注册非防抖监听', async () => {
		const wrapper = mountChart({
			props: {
				options: {},
				resize: true
			}
		});
		await flush();

		expect(Resize.on).toHaveBeenCalledTimes(1);
		expect(resizeHandlers.length).toBe(1);

		wrapper.unmount();
	});

	it('window.echarts 不存在时动态 import echarts', async () => {
		delete (window as any).echarts;
		const onReady = vi.fn();
		const wrapper = mountChart({
			props: {
				options: {}
			},
			attrs: { onReady }
		});
		for (let i = 0; i < 20; i++) {
			await nextTick();
			await Promise.resolve();
		}

		expect(onReady.mock.calls[0][0].dependencies.echarts).toBe(echarts);
		expect(getExposedChart(wrapper)).toBe(echarts.getInstanceByDom(wrapper.element as HTMLElement));

		wrapper.unmount();
	});

	it('watchShallow: options 深层变化时使用浅监听', async () => {
		const options = ref<any>(pieOptions(1));
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart options={options.value} watchShallow />);
			}
		}));
		mockSize(wrapper.element, 200);
		await flush();

		const chart = getExposedChart(wrapper.findComponent(Chart));
		const setOption = vi.spyOn(chart, 'setOption');

		// 替换整个引用应触发 setOption
		options.value = pieOptions(2);
		await flush();

		expect(setOption).toHaveBeenCalled();
		wrapper.unmount();
	});

	it('watch 配置项变化触发 refresh 重建实例', async () => {
		const chartRef = ref<any>();
		const theme = ref<string>();
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Chart ref={chartRef} options={{}} theme={theme.value} />);
			}
		}));
		mockSize(wrapper.element, 200);
		await flush();

		const first = getExposedChart(chartRef);

		theme.value = 'dark';
		await flush();

		const second = getExposedChart(chartRef);
		expect(second).not.toBe(first);
		expect((second as any)._theme.darkMode).toBe(true);

		wrapper.unmount();
	});
});
