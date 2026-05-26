// @vitest-environment jsdom

import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getFitIndex: vi.fn(() => -1)
}));

vi.mock('../utils', () => mocks);
vi.mock('../utils.ts', () => mocks);
vi.mock('./utils', () => mocks);
vi.mock('./utils.ts', () => mocks);

import { Text, Popover } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { defineComponent, nextTick, ref } from 'vue';

const mockedGetFitIndex = mocks.getFitIndex;

const flush = async () => {
	await nextTick();
	await Utils.sleep(0);
	await nextTick();
};

const triggerResize = (el: any) => {
	el?.__rz__?.handleResize?.([{ target: el }]);
};

describe('index.ts', () => {
	beforeEach(() => {
		mockedGetFitIndex.mockReset();
		mockedGetFitIndex.mockReturnValue(-1);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('basic', () => {
		expect(typeof Text).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Text />));

		expect(wrapper.classes()).toContain('vc-text');
		expect(wrapper.element.tagName.toLowerCase()).toBe('div');
	});

	it('tag prop renders custom tag', async () => {
		const wrapper = mount(() => (<Text tag="span" value="hello" line={0} resize={true} />));
		expect(wrapper.element.tagName.toLowerCase()).toBe('span');
		expect(wrapper.classes()).toContain('vc-text');
	});
});

describe('Text 渲染分支 (line=0 / line>0)', () => {
	beforeEach(() => {
		mockedGetFitIndex.mockReset();
		mockedGetFitIndex.mockReturnValue(-1);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('line=0: 渲染完整 value, cursor=unset, clip 事件参数为 -1', async () => {
		const onClip = vi.fn();
		const wrapper = mount(() => (
			<Text value="hello world" line={0} resize={true} onClip={onClip} />
		), { attachTo: document.body });

		// MockResizeObserver 不会自动 fire，需要手动触发首次回调
		triggerResize(wrapper.element);
		await flush();

		expect(wrapper.text()).toBe('hello world');
		expect(wrapper.attributes('style') || '').toContain('cursor: unset');
		expect(onClip).toHaveBeenCalledWith(-1);
		expect(mockedGetFitIndex).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('line>0 且需要截断: 输出 value.slice(0, N)+ellipsis, cursor=pointer, clip=N', async () => {
		mockedGetFitIndex.mockReturnValue(3);
		const onClip = vi.fn();

		const wrapper = mount(() => (
			<Text value="abcdefghij" line={2} resize={true} onClip={onClip} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		expect(wrapper.text()).toBe('abc...');
		expect(wrapper.attributes('style') || '').toContain('cursor: pointer');
		expect(onClip).toHaveBeenCalledWith(3);

		wrapper.unmount();
	});

	it('line>0 但内容未超出: getFitIndex 返回 -1, 渲染完整 value, cursor=unset', async () => {
		mockedGetFitIndex.mockReturnValue(-1);
		const wrapper = mount(() => (
			<Text value="short" line={3} resize={true} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		expect(wrapper.text()).toBe('short');
		expect(wrapper.attributes('style') || '').toContain('cursor: unset');

		wrapper.unmount();
	});

	it('自定义 ellipsis 生效 (README 第二个 demo 的用法)', async () => {
		mockedGetFitIndex.mockReturnValue(2);
		const wrapper = mount(() => (
			<Text value="abcdefghij" line={2} resize={true} ellipsis="我是自定义结尾" />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		expect(wrapper.text()).toBe('ab我是自定义结尾');

		wrapper.unmount();
	});

	it('renderRow 自定义渲染 (接收 value/index 等 attrs)', async () => {
		mockedGetFitIndex.mockReturnValue(3);
		const renderRow = vi.fn((attrs: any) => (
			<span class="rr">{`[${attrs.index}]${attrs.value}`}</span>
		));

		const wrapper = mount(() => (
			<Text value="hello" line={1} resize={true} renderRow={renderRow as any} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		const rr = wrapper.find('.rr');
		expect(rr.exists()).toBe(true);
		expect(rr.text()).toBe('[3]hel...');
		expect(renderRow).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('indent / line / value / ellipsis / slice / el 透传给 getFitIndex', async () => {
		mockedGetFitIndex.mockReturnValue(-1);
		const wrapper = mount(() => (
			<Text value="abc" line={2} indent={42} ellipsis="…" slice={-3} resize={true} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		expect(mockedGetFitIndex).toHaveBeenCalled();
		const calls = mockedGetFitIndex.mock.calls as any[];
		const arg = calls[calls.length - 1][0];
		expect(arg.indent).toBe(42);
		expect(arg.line).toBe(2);
		expect(arg.value).toBe('abc');
		expect(arg.ellipsis).toBe('…');
		expect(arg.slice).toBe(-3);
		expect(arg.el).toBe(wrapper.element);

		wrapper.unmount();
	});

	it('slice=-5 渲染串: prefix + ellipsis + value.slice(-5)', async () => {
		mockedGetFitIndex.mockReturnValue(3);
		const wrapper = mount(() => (
			<Text value="abcdefghijklmnop" line={2} resize={true} slice={-5} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		// 'abc' + '...' + 'lmnop'
		expect(wrapper.text()).toBe('abc...lmnop');
		expect(wrapper.attributes('style') || '').toContain('cursor: pointer');

		wrapper.unmount();
	});

	it('slice=0 + endIndex=0 (边界保护): 渲染 ellipsis + 整串', async () => {
		mockedGetFitIndex.mockReturnValue(0);
		const wrapper = mount(() => (
			<Text value="abcdefghij" line={2} resize={true} slice={0} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		// '' + '...' + 'abcdefghij'
		expect(wrapper.text()).toBe('...abcdefghij');
		// hasSlice + endIndex===0 也算 truncated, cursor=pointer
		expect(wrapper.attributes('style') || '').toContain('cursor: pointer');

		wrapper.unmount();
	});

	it('slice 未传 + endIndex=0: 不截断 (保持旧行为, 渲染完整 value)', async () => {
		mockedGetFitIndex.mockReturnValue(0);
		const wrapper = mount(() => (
			<Text value="abcdefghij" line={2} resize={true} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		expect(wrapper.text()).toBe('abcdefghij');
		expect(wrapper.attributes('style') || '').toContain('cursor: unset');

		wrapper.unmount();
	});
});

describe('Text 响应式 watch', () => {
	beforeEach(() => {
		mockedGetFitIndex.mockReset();
		mockedGetFitIndex.mockReturnValue(-1);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('value/line/indent/slice/ellipsis 变化均会重新计算 (走 watch)', async () => {
		mockedGetFitIndex.mockReturnValue(2);

		const value = ref('hello');
		const line = ref(2);
		const indent = ref(0);
		const slice = ref<number | undefined>(undefined);
		const ellipsis = ref('...');
		const onClip = vi.fn();

		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Text
						value={value.value}
						line={line.value}
						indent={indent.value}
						slice={slice.value}
						ellipsis={ellipsis.value}
						resize={true}
						onClip={onClip}
					/>
				);
			}
		}), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		const before = mockedGetFitIndex.mock.calls.length;

		value.value = 'world!';
		await flush();
		expect(mockedGetFitIndex.mock.calls.length).toBeGreaterThan(before);

		const before2 = mockedGetFitIndex.mock.calls.length;
		line.value = 3;
		await flush();
		expect(mockedGetFitIndex.mock.calls.length).toBeGreaterThan(before2);

		const before3 = mockedGetFitIndex.mock.calls.length;
		indent.value = 5;
		await flush();
		expect(mockedGetFitIndex.mock.calls.length).toBeGreaterThan(before3);

		const before4 = mockedGetFitIndex.mock.calls.length;
		slice.value = -2;
		await flush();
		expect(mockedGetFitIndex.mock.calls.length).toBeGreaterThan(before4);

		const before5 = mockedGetFitIndex.mock.calls.length;
		ellipsis.value = '…';
		await flush();
		expect(mockedGetFitIndex.mock.calls.length).toBeGreaterThan(before5);

		// 切到 line=0 后, 后续渲染读取的是 props.value (走 line===0 分支)
		line.value = 0;
		value.value = 'xyz';
		await flush();
		expect(wrapper.text()).toBe('xyz');

		wrapper.unmount();
	});
});

describe('Text 弹层 (mouseover/mouseout)', () => {
	beforeEach(() => {
		mockedGetFitIndex.mockReset();
		mockedGetFitIndex.mockReturnValue(-1);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('endIndex>0 时 mouseover 调用 Popover.open, 透传 theme/placement/portalClass/portalStyle', async () => {
		const popoverOpen = vi.spyOn(Popover, 'open').mockReturnValue({ destroy: vi.fn() } as any);
		mockedGetFitIndex.mockReturnValue(2);

		const wrapper = mount(() => (
			<Text
				value="abcdefg"
				line={1}
				resize={true}
				placement="bottom"
				theme="light"
				portalClass="my-portal-class"
				portalStyle="color:red"
			/>
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		await wrapper.trigger('mouseover');

		expect(popoverOpen).toHaveBeenCalledTimes(1);
		const arg = popoverOpen.mock.calls[0][0] as any;
		expect(arg.placement).toBe('bottom');
		expect(arg.theme).toBe('light');
		expect(arg.portalClass).toBe('my-portal-class');
		expect(arg.content).toBe('abcdefg');
		expect(arg.hover).toBe(true);
		expect(arg.name).toBe('vc-text-popover');
		expect(arg.el).toBe(document.body);
		expect(arg.triggerEl).toBe(wrapper.element);

		wrapper.unmount();
	});

	it('endIndex<=0 时 mouseover 不会调用 Popover.open', async () => {
		const popoverOpen = vi.spyOn(Popover, 'open').mockReturnValue({ destroy: vi.fn() } as any);

		const wrapper = mount(() => (<Text value="hi" line={0} resize={true} />), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		await wrapper.trigger('mouseover');
		expect(popoverOpen).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('未指定 portalStyle 时使用 trigger 宽度 + word-break 兜底', async () => {
		const popoverOpen = vi.spyOn(Popover, 'open').mockReturnValue({ destroy: vi.fn() } as any);
		mockedGetFitIndex.mockReturnValue(2);

		const wrapper = mount(() => (
			<Text value="abcdefg" line={1} resize={true} />
		), { attachTo: document.body });

		// 让 trigger 拥有可见宽度
		Object.defineProperty(wrapper.element, 'clientWidth', { configurable: true, value: 300 });

		triggerResize(wrapper.element);
		await flush();

		await wrapper.trigger('mouseover');
		const arg = popoverOpen.mock.calls[0][0] as any;
		expect(Array.isArray(arg.portalStyle)).toBe(true);
		expect(arg.portalStyle[0]).toBe('width: 300px');
		expect(arg.portalStyle[1]).toBe('word-break: break-all');

		wrapper.unmount();
	});

	it('mouseout 不抛错 (空操作)', async () => {
		const wrapper = mount(() => (<Text value="hi" line={0} resize={true} />), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		await wrapper.trigger('mouseout');
		expect(true).toBe(true);
		wrapper.unmount();
	});
});

describe('Text resize 选项', () => {
	beforeEach(() => {
		mockedGetFitIndex.mockReset();
		mockedGetFitIndex.mockReturnValue(-1);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('resize=false: 不绑定 Resize 监听, calcPosition 不会被自动触发', async () => {
		const onClip = vi.fn();
		const wrapper = mount(() => (
			<Text value="hi" line={0} resize={false} onClip={onClip} />
		), { attachTo: document.body });

		await flush();

		expect((wrapper.element as any).__rz__).toBeUndefined();
		expect(onClip).not.toHaveBeenCalled();
		expect(wrapper.text()).toBe('');

		wrapper.unmount();
	});

	it('resize=true: 立即调用 calcPosition (无 debounce)', async () => {
		const onClip = vi.fn();
		const wrapper = mount(() => (
			<Text value="hi" line={0} resize={true} onClip={onClip} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		expect(onClip).toHaveBeenCalledTimes(1);
		expect(onClip).toHaveBeenCalledWith(-1);

		wrapper.unmount();
	});

	it('resize=0: 视为 true 一样无 debounce, 立即触发', async () => {
		const onClip = vi.fn();
		const wrapper = mount(() => (
			<Text value="hi" line={0} resize={0} onClip={onClip} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		expect(onClip).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('resize=number: 走 debounce 路径, 等待后才触发', async () => {
		const onClip = vi.fn();
		const wrapper = mount(() => (
			<Text value="hi" line={0} resize={50} onClip={onClip} />
		), { attachTo: document.body });

		triggerResize(wrapper.element);
		// debounce(50, default trailing) 还未到时间
		await nextTick();
		expect(onClip).not.toHaveBeenCalled();

		await Utils.sleep(80);
		await flush();
		expect(onClip).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('resize 默认 100: 在 debounce 时间窗口内的多次触发只会执行一次', async () => {
		const onClip = vi.fn();
		const wrapper = mount(() => (
			<Text value="hi" line={0} onClip={onClip} />
		), { attachTo: document.body });

		// 连续多次触发
		triggerResize(wrapper.element);
		triggerResize(wrapper.element);
		triggerResize(wrapper.element);

		await Utils.sleep(140);
		await flush();

		// debounce 合并为一次
		expect(onClip).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});
});

describe('Text 卸载清理', () => {
	beforeEach(() => {
		mockedGetFitIndex.mockReset();
		mockedGetFitIndex.mockReturnValue(-1);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('已弹出 popover 时, 卸载会调用 popover.destroy', async () => {
		const destroy = vi.fn();
		const popoverOpen = vi.spyOn(Popover, 'open').mockReturnValue({ destroy } as any);
		mockedGetFitIndex.mockReturnValue(2);

		const wrapper = mount(() => (<Text value="abcdefg" line={1} resize={true} />), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		await wrapper.trigger('mouseover');
		expect(popoverOpen).toHaveBeenCalled();

		wrapper.unmount();
		expect(destroy).toHaveBeenCalledTimes(1);
	});

	it('未弹出 popover 时, 卸载不抛错', async () => {
		const wrapper = mount(() => (<Text value="hi" line={0} resize={true} />), { attachTo: document.body });

		triggerResize(wrapper.element);
		await flush();

		expect(() => wrapper.unmount()).not.toThrow();
	});

	it('resize=false 卸载也不抛错 (跳过 Resize.off 路径)', async () => {
		const wrapper = mount(() => (
			<Text value="hi" line={0} resize={false} />
		), { attachTo: document.body });

		await flush();
		expect(() => wrapper.unmount()).not.toThrow();
	});
});
