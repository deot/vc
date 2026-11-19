// @vitest-environment jsdom

import { Splitter, SplitterPanel, MSplitter, MSplitterPanel } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import * as drag from '../../../hooks/__tests__/fixtures/drag';

const setRect = (el: Element, size: number, vertical = false) => {
	(el as HTMLElement).getBoundingClientRect = () => ({
		x: 0,
		y: 0,
		top: 0,
		left: 0,
		right: vertical ? 0 : size,
		bottom: vertical ? size : 0,
		width: vertical ? 0 : size,
		height: vertical ? size : 0,
		toJSON: () => ({})
	});
};

/**
 * 按给定的面板尺寸布置：分隔条 1px，容器为两者之和
 * @param root ~
 * @param sizes ~
 * @param vertical ~
 */
const layout = (root: Element, sizes: number[], vertical = false) => {
	const panels = root.querySelectorAll(':scope > .vc-splitter-panel');
	const bars = root.querySelectorAll(':scope > .vc-splitter__bar');
	panels.forEach((el, index) => setRect(el, sizes[index], vertical));
	bars.forEach(el => setRect(el, 1, vertical));
	setRect(root, sizes.reduce((pre, i) => pre + i, 0) + bars.length, vertical);
};

const getBars = (root: Element) => Array.from(root.querySelectorAll(':scope > .vc-splitter__bar'));
const getPanels = (root: Element) => Array.from(root.querySelectorAll(':scope > .vc-splitter-panel')) as HTMLElement[];

const dragBar = async (bar: Element, from: number, to: number) => {
	drag.fireMouse(bar, 'mousedown', { clientX: from, clientY: from });
	drag.fireMouse(document.body, 'mousemove', { clientX: to, clientY: to });
	await nextTick();
	drag.fireMouse(document.body, 'mouseup', { clientX: to, clientY: to });
	await nextTick();
};

describe('index.ts', () => {
	afterEach(() => {
		document.body.style.cursor = '';
	});

	it('basic', () => {
		expect(typeof Splitter).toBe('object');
		expect(typeof SplitterPanel).toBe('object');
		expect(MSplitter).toBe(Splitter);
		expect(MSplitterPanel).toBe(SplitterPanel);
	});

	it('面板之间插入分隔条，v-for / template 展开', () => {
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel>A</SplitterPanel>
				{[1, 2].map(i => <SplitterPanel key={i}>{i}</SplitterPanel>)}
				<div class="ignored" />
			</Splitter>
		));
		const root = wrapper.element as HTMLElement;
		expect(root.classList.contains('vc-splitter')).toBe(true);
		expect(Array.from(root.children).map(i => i.className)).toEqual([
			'vc-splitter-panel',
			'vc-splitter__bar',
			'vc-splitter-panel',
			'vc-splitter__bar',
			'vc-splitter-panel'
		]);
		wrapper.unmount();
	});

	it('px / % / 未设 的布局样式，min / max 写到面板上', () => {
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel size={200} min={100} />
				<SplitterPanel size="30%" max="50%" />
				<SplitterPanel />
			</Splitter>
		));
		const [a, b, c] = getPanels(wrapper.element);
		expect(a.style.flex).toBe('0 1 200px');
		expect(a.style.minWidth).toBe('100px');
		expect(b.style.flex).toContain('calc(30% - var(--vc-splitter-bar) * 0.6)');
		expect(b.style.maxWidth).toBe('calc(50% - var(--vc-splitter-bar) * 1)');
		expect(c.style.flex).toBe('1 1 0px');
		wrapper.unmount();
	});

	it('vertical：按高度写 min / max', () => {
		const wrapper = mount(() => (
			<Splitter vertical>
				<SplitterPanel min={50} />
				<SplitterPanel />
			</Splitter>
		));
		expect(wrapper.classes()).toContain('is-vertical');
		expect(getPanels(wrapper.element)[0].style.minHeight).toBe('50px');
		wrapper.unmount();
	});

	it('拖动：只改两侧面板，v-model 按 px 回写，依次发出 resize-start / resize / resize-end', async () => {
		const size = ref<number>(200);
		const events: any[] = [];
		const wrapper = mount(() => (
			<Splitter
				onResizeStart={(e: any) => events.push(['resize-start', e])}
				onResize={(e: any) => events.push(['resize', e])}
				onResizeEnd={(e: any) => events.push(['resize-end', e])}
			>
				<SplitterPanel v-model:size={size.value} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);

		const bar = getBars(root)[0];
		drag.fireMouse(bar, 'mousedown', { clientX: 200 });
		expect(document.body.style.cursor).toBe('col-resize');
		await nextTick();
		expect(root.classList.contains('is-dragging')).toBe(true);
		expect(getBars(root)[0].classList.contains('is-dragging')).toBe(true);

		drag.fireMouse(document.body, 'mousemove', { clientX: 250 });
		await nextTick();
		// 拖动中直接改面板样式，松开后才回写 v-model
		expect(size.value).toBe(200);
		const [a, b] = getPanels(root);
		expect(a.style.flex).toBe('0 1 250px');
		// 未设的面板按像素更新权重（平均为 1）
		expect(b.style.flex).toBe('1 1 0px');
		expect(getBars(root)[0].getAttribute('aria-valuenow')).toBe('63');

		layout(root, [250, 150]);
		drag.fireMouse(document.body, 'mouseup', { clientX: 250 });
		await nextTick();
		expect(size.value).toBe(250);
		expect(getPanels(root)[0].style.flex).toBe('0 1 250px');
		expect(document.body.style.cursor).toBe('');
		expect(root.classList.contains('is-dragging')).toBe(false);

		expect(events).toEqual([
			['resize-start', { index: 0, sizes: [200, 200] }],
			['resize', { index: 0, sizes: [250, 150] }],
			['resize-end', { index: 0, sizes: [250, 150] }]
		]);
		wrapper.unmount();
	});

	it('% 面板按百分比回写，未设的面板绑定 v-model 时也回写百分比', async () => {
		const a = ref<string>('25%');
		const b = ref<string>();
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel v-model:size={a.value} />
				<SplitterPanel v-model:size={b.value} />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [100, 300]);

		await dragBar(getBars(root)[0], 100, 140);
		expect(a.value).toBe('35%');
		expect(b.value).toBe('65%');
		expect(getPanels(root)[0].style.flex).toContain('calc(35% - var(--vc-splitter-bar) * 0.35)');
		wrapper.unmount();
	});

	it('min / max 夹紧，并受相邻面板约束', async () => {
		const size = ref(200);
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel v-model:size={size.value} min={120} max={360} />
				<SplitterPanel min="20%" />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);
		const bar = getBars(root)[0];

		await dragBar(bar, 200, 0);
		expect(size.value).toBe(120);

		layout(root, [120, 280]);
		// 右侧 min 20% = 80px：左侧最多 320
		await dragBar(bar, 120, 600);
		expect(size.value).toBe(320);
		wrapper.unmount();
	});

	it('min 与相邻面板的上限冲突时 min 优先', async () => {
		const size = ref(200);
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel v-model:size={size.value} min={300} />
				<SplitterPanel min={150} />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);
		await dragBar(getBars(root)[0], 200, 100);
		expect(size.value).toBe(300);
		wrapper.unmount();
	});

	it('resizable 为 false：两侧分隔条不可拖', async () => {
		const onResizeStart = vi.fn();
		const wrapper = mount(() => (
			<Splitter onResizeStart={onResizeStart}>
				<SplitterPanel />
				<SplitterPanel resizable={false} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [100, 100, 100]);
		const bars = getBars(root);
		expect(bars.every(i => i.classList.contains('is-disabled'))).toBe(true);

		await dragBar(bars[0], 100, 150);
		expect(onResizeStart).not.toHaveBeenCalled();
		expect(document.body.style.cursor).toBe('');
		wrapper.unmount();
	});

	it('不绑定 v-model 时保留拖动结果；外部改 size 时以新值为准', async () => {
		const size = ref(200);
		const tick = ref(0);
		const wrapper = mount(() => (
			<Splitter data-tick={tick.value}>
				<SplitterPanel size={size.value} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);
		await dragBar(getBars(root)[0], 200, 260);
		expect(getPanels(root)[0].style.flex).toBe('0 1 260px');

		tick.value++;
		await nextTick();
		expect(getPanels(root)[0].style.flex).toBe('0 1 260px');

		size.value = 100;
		await nextTick();
		expect(getPanels(root)[0].style.flex).toBe('0 1 100px');
		wrapper.unmount();
	});

	it('手势被打断时恢复拖动前的尺寸', async () => {
		const size = ref(200);
		const onResizeEnd = vi.fn();
		const wrapper = mount(() => (
			<Splitter onResizeEnd={onResizeEnd}>
				<SplitterPanel v-model:size={size.value} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);
		drag.fireMouse(getBars(root)[0], 'mousedown', { clientX: 200 });
		drag.fireMouse(document.body, 'mousemove', { clientX: 280 });
		await nextTick();
		expect(getPanels(root)[0].style.flex).toBe('0 1 280px');

		// 主键已松开但没收到 mouseup
		drag.fireMouse(document.body, 'mousemove', { clientX: 300, buttons: 0 });
		await nextTick();
		expect(size.value).toBe(200);
		expect(getPanels(root)[0].style.flex).toBe('0 1 200px');
		expect(onResizeEnd).toHaveBeenCalledWith({ index: 0, sizes: [200, 200] });
		expect(document.body.style.cursor).toBe('');
		wrapper.unmount();
	});

	it('vertical：按 clientY 与高度计算', async () => {
		const size = ref(100);
		const wrapper = mount(() => (
			<Splitter vertical>
				<SplitterPanel v-model:size={size.value} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [100, 100], true);
		const bar = getBars(root)[0];
		drag.fireMouse(bar, 'mousedown', { clientY: 100 });
		expect(document.body.style.cursor).toBe('row-resize');
		drag.fireMouse(document.body, 'mousemove', { clientY: 130 });
		drag.fireMouse(document.body, 'mouseup');
		await nextTick();
		expect(size.value).toBe(130);
		wrapper.unmount();
	});

	it('触摸拖动', async () => {
		const size = ref(200);
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel v-model:size={size.value} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);
		const bar = getBars(root)[0];
		drag.fireTouch(bar, 'touchstart', { clientX: 200 });
		drag.fireTouch(bar, 'touchmove', { clientX: 150 });
		drag.fireTouch(bar, 'touchend', { clientX: 150 });
		await nextTick();
		expect(size.value).toBe(150);
		expect(root.classList.contains('is-dragging')).toBe(false);
		wrapper.unmount();
	});

	it('折叠按钮：按 collapsible 出现在对应的分隔条上', () => {
		const wrapper = mount(() => (
			<div>
				<Splitter class="a">
					<SplitterPanel collapsible />
					<SplitterPanel />
					<SplitterPanel collapsible />
				</Splitter>
				<Splitter class="b">
					<SplitterPanel />
					<SplitterPanel collapsible={{ start: true }} />
				</Splitter>
			</div>
		));
		const getActions = (bar: Element) => Array.from(bar.querySelectorAll('.vc-splitter__collapse')).map(i => i.classList[1]);
		const [bar0, bar1] = getBars(wrapper.find('.a').element);
		expect(getActions(bar0)).toEqual(['is-previous']);
		expect(getActions(bar1)).toEqual(['is-next']);
		expect(getActions(getBars(wrapper.find('.b').element)[0])).toEqual(['is-next']);
		wrapper.unmount();
	});

	it('点击折叠 / 展开：恢复折叠前的尺寸，发出 collapse-change', async () => {
		const size = ref(200);
		const onCollapseChange = vi.fn();
		const onResizeStart = vi.fn();
		const wrapper = mount(() => (
			<Splitter onCollapseChange={onCollapseChange} onResizeStart={onResizeStart}>
				<SplitterPanel v-model:size={size.value} min={120} collapsible />
				<SplitterPanel />
				<SplitterPanel size={200} />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200, 200]);
		const bar = getBars(root)[0];

		(bar.querySelector('.is-previous') as HTMLElement).click();
		await nextTick();
		expect(size.value).toBe(0);
		expect(onCollapseChange).toHaveBeenLastCalledWith({ index: 0, collapsed: true, sizes: [0, 400, 200] });
		expect(onResizeStart).not.toHaveBeenCalled();
		const panel = getPanels(root)[0];
		expect(panel.classList.contains('is-collapsed')).toBe(true);
		// 折叠后不受 min 约束
		expect(panel.style.minWidth).toBe('');
		expect(bar.querySelector('.is-previous')).toBe(null);

		layout(root, [0, 400, 200]);
		(bar.querySelector('.is-next') as HTMLElement).click();
		await nextTick();
		expect(size.value).toBe(200);
		expect(onCollapseChange).toHaveBeenLastCalledWith({ index: 0, collapsed: false, sizes: [200, 200, 200] });
		expect(getPanels(root)[0].classList.contains('is-collapsed')).toBe(false);
		wrapper.unmount();
	});

	it('初始折叠的面板展开到 min；不可拖的面板也能折叠', async () => {
		const size = ref(0);
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel />
				<SplitterPanel v-model:size={size.value} min={160} resizable={false} collapsible={{ start: true }} />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [400, 0]);
		const bar = getBars(root)[0];
		expect(bar.classList.contains('is-disabled')).toBe(true);
		expect(bar.getAttribute('tabindex')).toBe('0');
		expect(bar.querySelector('.is-next')).toBe(null);

		(bar.querySelector('.is-previous') as HTMLElement).click();
		await nextTick();
		expect(size.value).toBe(160);
		wrapper.unmount();
	});

	it('拖过 min 的一半吸附折叠，拖出时直接到 min', async () => {
		const size = ref(200);
		const onCollapseChange = vi.fn();
		const wrapper = mount(() => (
			<Splitter onCollapseChange={onCollapseChange}>
				<SplitterPanel v-model:size={size.value} min={120} collapsible />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);
		const bar = getBars(root)[0];

		await dragBar(bar, 200, 70);
		expect(size.value).toBe(120);
		expect(onCollapseChange).not.toHaveBeenCalled();

		layout(root, [120, 280]);
		await dragBar(bar, 120, 50);
		expect(size.value).toBe(0);
		expect(onCollapseChange).toHaveBeenLastCalledWith({ index: 0, collapsed: true, sizes: [0, 400] });

		layout(root, [0, 400]);
		await dragBar(bar, 0, 50);
		expect(size.value).toBe(0);
		await dragBar(bar, 0, 70);
		expect(size.value).toBe(120);
		expect(onCollapseChange).toHaveBeenLastCalledWith({ index: 0, collapsed: false, sizes: [120, 280] });
		wrapper.unmount();
	});

	it('后一个面板 collapsible.start 时向后吸附；不可折叠的面板不吸附', async () => {
		const a = ref(200);
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel v-model:size={a.value} min={100} />
				<SplitterPanel min={100} collapsible={{ start: true }} />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);
		const bar = getBars(root)[0];
		await dragBar(bar, 200, 10);
		expect(a.value).toBe(100);

		layout(root, [100, 300]);
		await dragBar(bar, 100, 360);
		expect(a.value).toBe(400);
		wrapper.unmount();
	});

	it('键盘：方向键 10px，Home / End 到上下限，Enter 折叠 / 展开', async () => {
		const size = ref(200);
		const events: string[] = [];
		const wrapper = mount(() => (
			<Splitter
				onResizeStart={() => events.push('resize-start')}
				onResize={() => events.push('resize')}
				onResizeEnd={() => events.push('resize-end')}
			>
				<SplitterPanel v-model:size={size.value} min={100} max={300} collapsible />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		const bar = getBars(root)[0] as HTMLElement;
		const press = async (key: string, sizes: number[]) => {
			layout(root, sizes);
			bar.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
			await nextTick();
		};

		await press('ArrowRight', [200, 200]);
		expect(size.value).toBe(210);
		expect(events).toEqual(['resize-start', 'resize', 'resize-end']);

		await press('ArrowLeft', [210, 190]);
		expect(size.value).toBe(200);
		await press('ArrowUp', [200, 200]);
		expect(size.value).toBe(200);
		await press('Home', [200, 200]);
		expect(size.value).toBe(100);
		await press('ArrowLeft', [100, 300]);
		expect(size.value).toBe(100);
		await press('End', [100, 300]);
		expect(size.value).toBe(300);

		await press('Enter', [300, 100]);
		expect(size.value).toBe(0);
		await press('Enter', [0, 400]);
		expect(size.value).toBe(300);
		wrapper.unmount();
	});

	it('vertical 键盘用上下方向键', async () => {
		const size = ref(100);
		const wrapper = mount(() => (
			<Splitter vertical>
				<SplitterPanel v-model:size={size.value} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [100, 100], true);
		const bar = getBars(root)[0];
		expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
		bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		await nextTick();
		expect(size.value).toBe(110);
		wrapper.unmount();
	});

	it('aria：separator、aria-controls 指向前一个面板、aria-valuenow 为百分比', async () => {
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel />
				<SplitterPanel id="custom" />
				<SplitterPanel resizable={false} />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [100, 100, 200]);
		const [bar0, bar1] = getBars(root);
		const panels = getPanels(root);
		expect(bar0.getAttribute('role')).toBe('separator');
		expect(bar0.getAttribute('aria-orientation')).toBe('vertical');
		expect(bar0.getAttribute('tabindex')).toBe('0');
		expect(panels[0].id).toMatch(/^splitter-panel/);
		expect(bar0.getAttribute('aria-controls')).toBe(panels[0].id);
		expect(bar1.getAttribute('aria-controls')).toBe('custom');
		expect(bar1.getAttribute('tabindex')).toBe(null);
		expect(bar1.getAttribute('aria-disabled')).toBe('true');

		bar0.dispatchEvent(new FocusEvent('focus'));
		await nextTick();
		expect(bar0.getAttribute('aria-valuenow')).toBe('25');
		expect(bar1.getAttribute('aria-valuenow')).toBe('25');

		await dragBar(bar0, 100, 200);
		expect(bar0.getAttribute('aria-valuenow')).toBe('50');
		wrapper.unmount();
	});

	it('lazy：拖动中只移动预览线，松开再应用', async () => {
		const size = ref(200);
		const events: any[] = [];
		const wrapper = mount(() => (
			<Splitter
				lazy
				onResize={(e: any) => events.push(['resize', e])}
				onResizeEnd={(e: any) => events.push(['resize-end', e])}
			>
				<SplitterPanel v-model:size={size.value} min={100} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200]);
		const bar = getBars(root)[0];
		const preview = bar.querySelector('.vc-splitter__preview') as HTMLElement;
		expect(preview).not.toBe(null);

		drag.fireMouse(bar, 'mousedown', { clientX: 200 });
		drag.fireMouse(document.body, 'mousemove', { clientX: 50 });
		await nextTick();
		expect(size.value).toBe(200);
		expect(getPanels(root)[0].style.flex).toBe('0 1 200px');
		expect(preview.style.transform).toBe('translateX(-100px)');
		expect(events).toEqual([['resize', { index: 0, sizes: [100, 300] }]]);

		drag.fireMouse(document.body, 'mouseup');
		await nextTick();
		expect(size.value).toBe(100);
		expect(getPanels(root)[0].style.flex).toBe('0 1 100px');
		expect(preview.style.transform).toBe('');
		expect(events[1]).toEqual(['resize-end', { index: 0, sizes: [100, 300] }]);
		wrapper.unmount();
	});

	it('lazy：手势被打断时不应用', async () => {
		const size = ref(200);
		const wrapper = mount(() => (
			<Splitter lazy vertical>
				<SplitterPanel v-model:size={size.value} />
				<SplitterPanel />
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [200, 200], true);
		const bar = getBars(root)[0];
		const preview = bar.querySelector('.vc-splitter__preview') as HTMLElement;
		drag.fireMouse(bar, 'mousedown', { clientY: 200 });
		drag.fireMouse(document.body, 'mousemove', { clientY: 260 });
		expect(preview.style.transform).toBe('translateY(60px)');
		drag.fireMouse(document.body, 'mousemove', { clientY: 280, buttons: 0 });
		await nextTick();
		expect(size.value).toBe(200);
		expect(preview.style.transform).toBe('');
		wrapper.unmount();
	});

	it('#handle 插槽替换默认把手', async () => {
		const wrapper = mount(() => (
			<Splitter vertical>
				{{
					default: () => [<SplitterPanel />, <SplitterPanel />],
					handle: ({ index, vertical, dragging }: any) => <i class="custom">{`${index}-${vertical}-${dragging}`}</i>
				}}
			</Splitter>
		));
		const root = wrapper.element;
		layout(root, [100, 100], true);
		const bar = getBars(root)[0];
		expect(bar.querySelector('.vc-splitter__handle')).toBe(null);
		expect(bar.querySelector('.custom')!.textContent).toBe('0-true-false');

		drag.fireMouse(bar, 'mousedown', { clientY: 100 });
		await nextTick();
		expect(bar.querySelector('.custom')!.textContent).toBe('0-true-true');
		drag.fireMouse(document.body, 'mouseup');
		await nextTick();
		expect(bar.querySelector('.vc-splitter__preview')).toBe(null);
		wrapper.unmount();
	});

	it('scrollable：默认由内置 Scroller 滚动；为 false 时直接渲染内容', () => {
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel scrollerOptions={{ contentClass: 'custom-content' }}>
					<i class="a" />
				</SplitterPanel>
				<SplitterPanel scrollable={false}>
					<i class="b" />
				</SplitterPanel>
			</Splitter>
		));
		const [a, b] = getPanels(wrapper.element);
		const scroller = a.querySelector(':scope > .vc-scroller')!;
		expect(scroller).not.toBe(null);
		expect(scroller.classList.contains('is-native')).toBe(false);
		expect(scroller.querySelector('.custom-content .a')).not.toBe(null);
		expect(a.classList.contains('is-unscrollable')).toBe(false);

		expect(b.querySelector('.vc-scroller')).toBe(null);
		expect(b.querySelector(':scope > .b')).not.toBe(null);
		expect(b.classList.contains('is-unscrollable')).toBe(true);
		wrapper.unmount();
	});

	it('拖动中卸载时还原 body 的光标', () => {
		const wrapper = mount(() => (
			<Splitter>
				<SplitterPanel />
				<SplitterPanel />
			</Splitter>
		));
		layout(wrapper.element, [100, 100]);
		drag.fireMouse(getBars(wrapper.element)[0], 'mousedown', { clientX: 100 });
		expect(document.body.style.cursor).toBe('col-resize');
		wrapper.unmount();
		expect(document.body.style.cursor).toBe('');
	});
});
