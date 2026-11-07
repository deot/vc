// @vitest-environment jsdom

import { Tabs, TabsPane, MTabs, MTabsPane, Scroller } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { defineComponent, h, nextTick, ref } from 'vue';
import { vi } from 'vitest';

const flush = async () => {
	await nextTick();
	await Utils.sleep(0);
	await nextTick();
};

// 记录所有 ResizeObserver 实例：触发观察某元素的全部观察器（Scroller 自己与 Tabs 的共享观察器）
const observers: any[] = [];
const MockResizeObserver = (globalThis as any).ResizeObserver;
(globalThis as any).ResizeObserver = class extends MockResizeObserver {
	constructor(cb: any) {
		super(cb);
		observers.push(this);
	}
};
const triggerResize = (el: Element) => {
	observers.filter(ro => ro.targets.has(el)).forEach(ro => ro.trigger(el));
};

const mockSize = (el: HTMLElement, width: number) => {
	const def = vi.spyOn(el, 'offsetWidth', 'get').mockImplementation(() => width);
	return () => def.mockRestore();
};

/**
 * 标签栏溢出：模拟 Scroller 根节点的尺寸与可写的 scrollLeft，每个标签等宽排列
 * @param wrapper ~
 * @param options ~
 * @param options.client 可视宽度
 * @param options.scroll 内容宽度
 * @param options.item 每个标签的宽度
 * @param prefix 类名前缀：vc-tabs 或 vcm-tabs
 * @returns Scroller 根节点
 */
const mockOverflow = async (wrapper: any, options: { client: number; scroll: number; item: number }, prefix = 'vc-tabs') => {
	const el = wrapper.find(`.${prefix}__scroll`).element as HTMLElement;
	let scrollLeft = 0;
	Object.defineProperty(el, 'scrollLeft', { get: () => scrollLeft, set: (v: number) => (scrollLeft = v), configurable: true });
	Object.defineProperty(el, 'clientWidth', { get: () => options.client, configurable: true });
	Object.defineProperty(el, 'scrollWidth', { get: () => options.scroll, configurable: true });
	wrapper.findAll(`.${prefix}__item`).forEach((item: any, index: number) => {
		Object.defineProperty(item.element, 'offsetLeft', { get: () => index * options.item, configurable: true });
		Object.defineProperty(item.element, 'offsetWidth', { get: () => options.item, configurable: true });
	});
	await wrapper.findComponent(Scroller).vm.refresh();
	await flush();
	return el;
};

/**
 * 临时替换 Element.animate：记录每次调用的元素、关键帧与计时，由测试决定结束或取消
 * @returns 调用记录与还原函数
 */
const mockAnimate = () => {
	const calls: any[] = [];
	const proto = HTMLElement.prototype as any;
	const original = proto.animate;
	proto.animate = function (keyframes: Keyframe[], timing: KeyframeAnimationOptions) {
		let resolve: any;
		let reject: any;
		const finished = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		const animation = {
			el: this,
			keyframes,
			timing,
			finished,
			finish: () => resolve(),
			cancel: vi.fn(() => reject(new Error('cancel')))
		};
		calls.push(animation);
		return animation;
	};
	return { calls, restore: () => (proto.animate = original) };
};

// 等平滑滚动结束，并像浏览器一样派发scroll让Scroller同步位置
const settle = async (el: HTMLElement) => {
	await flush();
	await Utils.sleep(400);
	el.dispatchEvent(new Event('scroll'));
	await flush();
};

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Tabs).toBe('object');
		expect(typeof TabsPane).toBe('object');
		expect(typeof MTabs).toBe('object');
		expect(typeof MTabsPane).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Tabs />));

		expect(wrapper.classes()).toContain('vc-tabs');
		expect(wrapper.find('.vc-tabs__bar').exists()).toBe(true);
		expect(wrapper.find('.vc-tabs__scroll').exists()).toBe(true);
		expect(wrapper.find('.vc-tabs__nav').exists()).toBe(true);
		expect(wrapper.find('.vc-tabs__content').exists()).toBe(true);
		expect(wrapper.find('.vc-tabs__afloat').exists()).toBe(true);
		expect(wrapper.classes()).toContain('is-line');
	});

	it('renders panes and default active is first', async () => {
		const wrapper = mount(() => (
			<Tabs modelValue={0}>
				<TabsPane label="a">A</TabsPane>
				<TabsPane label="b">B</TabsPane>
				<TabsPane label="c">C</TabsPane>
			</Tabs>
		));

		await flush();

		const items = wrapper.findAll('.vc-tabs__item');
		expect(items).toHaveLength(3);
		expect(items[0].classes()).toContain('is-active');
		expect(items[1].classes()).not.toContain('is-active');
	});

	it('v-model controls active and click emits update:modelValue / change / click', async () => {
		const value = ref<any>(0);
		const onUpdate = vi.fn((v: any) => (value.value = v));
		const onChange = vi.fn();
		const onClick = vi.fn();

		const wrapper = mount(() => (
			<Tabs
				modelValue={value.value}
				onUpdate:modelValue={onUpdate}
				onChange={onChange}
				onClick={onClick}
			>
				<TabsPane label="a" value="a">A</TabsPane>
				<TabsPane label="b" value="b">B</TabsPane>
				<TabsPane label="c" value="c">C</TabsPane>
			</Tabs>
		));

		await flush();
		const items = wrapper.findAll('.vc-tabs__item');

		await items[1].trigger('click');
		await flush();

		expect(onUpdate).toHaveBeenLastCalledWith('b');
		expect(onChange).toHaveBeenLastCalledWith('b');
		expect(onClick).toHaveBeenLastCalledWith('b');
		expect(value.value).toBe('b');
		expect(items[1].classes()).toContain('is-active');
	});

	it('debounces consecutive clicks within 300ms', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<Tabs modelValue={0} onUpdate:modelValue={onUpdate}>
				<TabsPane label="a" value="a">A</TabsPane>
				<TabsPane label="b" value="b">B</TabsPane>
				<TabsPane label="c" value="c">C</TabsPane>
			</Tabs>
		));

		await flush();
		const items = wrapper.findAll('.vc-tabs__item');
		await items[1].trigger('click');
		await items[2].trigger('click');

		expect(onUpdate).toHaveBeenCalledTimes(1);
		expect(onUpdate).toHaveBeenLastCalledWith('b');

		await Utils.sleep(310);
		await items[2].trigger('click');
		expect(onUpdate).toHaveBeenCalledTimes(2);
		expect(onUpdate).toHaveBeenLastCalledWith('c');
	});

	it('accepts empty string tab values', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<Tabs
				modelValue=""
				onUpdate:modelValue={onUpdate}
			>
				<TabsPane value="any" label="Any" />
				<TabsPane value="" label="Empty" />
			</Tabs>
		));

		await flush();

		const items = wrapper.findAll('.vc-tabs__item');
		expect(items[1].classes()).toContain('is-active');

		await items[0].trigger('click');
		await flush();

		expect(onUpdate).toHaveBeenCalledWith('any');
		expect(items[0].classes()).toContain('is-active');
	});

	it('renders extra slot', async () => {
		const wrapper = mount(() => (
			<Tabs v-slots={{ extra: () => <span class="my-extra">extra</span> }}>
				<TabsPane label="a">A</TabsPane>
			</Tabs>
		));

		await flush();
		expect(wrapper.find('.vc-tabs__extra .my-extra').exists()).toBe(true);
	});

	it('renders label slot', async () => {
		const wrapper = mount(() => (
			<Tabs v-slots={{ label: ({ row }: any) => (
				<span class="my-label">
					{row.label}
					-X
				</span>
			) }}
			>
				<TabsPane label="hello">A</TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper.find('.vc-tabs__item .my-label').text()).toBe('hello-X');
	});

	it('renders label as function (Customer)', async () => {
		const renderLabel = ({ index }: any) => h('span', { class: 'fn-label' }, `idx#${index}`);
		const wrapper = mount(() => (
			<Tabs>
				<TabsPane label={renderLabel as any}>A</TabsPane>
				<TabsPane label="b">B</TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper.find('.vc-tabs__item .fn-label').text()).toBe('idx#0');
	});

	it('renders { type: \'html\' } label as html', async () => {
		const wrapper = mount(() => (
			<Tabs>
				<TabsPane label={{ type: 'html', value: '<i class=\'label-html\'>x</i>' }}>A</TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper.find('.vc-tabs__item .label-html').exists()).toBe(true);
	});

	it('type=card removes afloat and adds is-card class', async () => {
		const wrapper = mount(() => (
			<Tabs type="card">
				<TabsPane label="a">A</TabsPane>
				<TabsPane label="b">B</TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper.classes()).toContain('is-card');
		expect(wrapper.find('.vc-tabs__afloat').exists()).toBe(false);
	});

	it('type / size: root carries is-<type> / is-<size>, only line has afloat', async () => {
		const types = ['line', 'card', 'button', 'capsule', 'text', 'round'] as const;
		const sizes = ['mini', 'small', 'medium', 'large'] as const;
		for (const type of types) {
			for (const size of sizes) {
				const wrapper = mount(() => (
					<Tabs type={type} size={size}>
						<TabsPane label="a">A</TabsPane>
					</Tabs>
				));
				await flush();
				expect(wrapper.classes()).toEqual(expect.arrayContaining([`is-${type}`, `is-${size}`]));
				expect(wrapper.find('.vc-tabs__afloat').exists()).toBe(type === 'line');
				wrapper.unmount();
			}
		}

		const wrapper = mount(() => (<Tabs />));
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-line', 'is-medium']));
	});

	it('type / size validators', () => {
		const { type, size } = (Tabs as any).props;
		expect(type.validator('round')).toBe(true);
		expect(type.validator('rounded')).toBe(false);
		expect(type.validator('default')).toBe(false);
		expect(size.validator('large')).toBe(true);
		expect(size.validator('default')).toBe(false);
	});

	it('placement: root carries is-<placement>, left/right also is-vertical; extra sits at the end of the bar', async () => {
		for (const placement of ['top', 'bottom', 'left', 'right'] as const) {
			const wrapper = mount(() => (
				<Tabs placement={placement} v-slots={{ extra: () => <span class="my-extra">extra</span> }}>
					<TabsPane label="a">A</TabsPane>
				</Tabs>
			));
			await flush();
			expect(wrapper.classes()).toContain(`is-${placement}`);
			expect(wrapper.classes().includes('is-vertical')).toBe(placement === 'left' || placement === 'right');
			expect(wrapper.find('.vc-tabs__bar > .vc-tabs__extra:last-child .my-extra').exists()).toBe(true);
			wrapper.unmount();
		}

		const wrapper = mount(() => (<Tabs />));
		expect(wrapper.classes()).toContain('is-top');
		expect(wrapper.find('.vc-tabs__extra').exists()).toBe(false);
		expect((Tabs as any).props.placement.validator('left')).toBe(true);
		expect((Tabs as any).props.placement.validator('start')).toBe(false);
	});

	it('placement: afloat follows the active item along the bar axis', async () => {
		const value = ref<any>('a');
		const placement = ref<any>('top');
		const wrapper = mount(() => (
			<Tabs modelValue={value.value} placement={placement.value}>
				<TabsPane label="a" value="a" />
				<TabsPane label="b" value="b" />
			</Tabs>
		), { attachTo: document.body });
		await flush();

		wrapper.findAll('.vc-tabs__item').forEach((item: any, index: number) => {
			Object.defineProperty(item.element, 'offsetLeft', { get: () => index * 80, configurable: true });
			Object.defineProperty(item.element, 'offsetWidth', { get: () => 80, configurable: true });
			Object.defineProperty(item.element, 'offsetTop', { get: () => index * 40, configurable: true });
			Object.defineProperty(item.element, 'offsetHeight', { get: () => 40, configurable: true });
		});
		const afloat = () => (wrapper.find('.vc-tabs__afloat').element as HTMLElement).style;

		value.value = 'b';
		await flush();
		expect(afloat().width).toBe('80px');
		expect(afloat().transform).toBe('translate3d(80px, 0px, 0px)');

		placement.value = 'left';
		value.value = 'a';
		await flush();
		value.value = 'b';
		await flush();
		expect(afloat().height).toBe('40px');
		expect(afloat().width).toBe('');
		expect(afloat().transform).toBe('translate3d(0px, 40px, 0px)');

		wrapper.unmount();
	});

	it('placement=left: overflow scrolls vertically with up / down stepper buttons', async () => {
		const value = ref<any>(0);
		const wrapper = mount(() => (
			<Tabs modelValue={value.value} placement="left">
				{Array.from({ length: 10 }, (_, i) => (
					<TabsPane key={i} label={`tab-${i}`} value={i} />
				))}
			</Tabs>
		), { attachTo: document.body });
		await flush();

		const el = wrapper.find('.vc-tabs__scroll').element as HTMLElement;
		let scrollTop = 0;
		Object.defineProperty(el, 'scrollTop', { get: () => scrollTop, set: (v: number) => (scrollTop = v), configurable: true });
		Object.defineProperty(el, 'clientHeight', { get: () => 120, configurable: true });
		Object.defineProperty(el, 'scrollHeight', { get: () => 400, configurable: true });
		wrapper.findAll('.vc-tabs__item').forEach((item: any, index: number) => {
			Object.defineProperty(item.element, 'offsetTop', { get: () => index * 40, configurable: true });
			Object.defineProperty(item.element, 'offsetHeight', { get: () => 40, configurable: true });
		});
		await (wrapper.findComponent(Scroller).vm as any).refresh();
		await flush();

		expect(wrapper.find('.vc-tabs__stepper.is-prev .vc-icon').exists()).toBe(true);
		expect(wrapper.find('.vc-tabs__stepper.is-prev').classes()).toContain('is-disabled');

		await wrapper.find('.vc-tabs__stepper.is-next').trigger('click');
		await flush();
		await Utils.sleep(400);
		expect(el.scrollTop).toBe(120);

		// 选中项在可视区下方：末端对齐可视区底部
		value.value = 7;
		await flush();
		await Utils.sleep(400);
		expect(el.scrollTop).toBe(200);

		wrapper.unmount();
	});

	it('MTabs does not declare desktop-only type / size / placement', () => {
		const props = (MTabs as any).props;
		expect(props.type).toBeUndefined();
		expect(props.size).toBeUndefined();
		expect(props.placement).toBeUndefined();
		expect(props.closable).toBeDefined();
	});

	it('animated: the entering pane slides in along the bar axis, direction follows the switch', async () => {
		const { calls, restore } = mockAnimate();
		const value = ref<any>('a');
		const placement = ref<any>('top');
		const wrapper = mount(() => (
			<Tabs modelValue={value.value} placement={placement.value} animated>
				<TabsPane label="a" value="a">A</TabsPane>
				<TabsPane label="b" value="b">B</TabsPane>
				<TabsPane label="c" value="c">C</TabsPane>
			</Tabs>
		));
		await flush();
		// 首次选中不播放
		expect(calls).toHaveLength(0);

		const panes = wrapper.findAll('.vc-tabs-pane').map(i => i.element);
		const content = wrapper.find('.vc-tabs__content');

		value.value = 'c';
		await flush();
		expect(calls).toHaveLength(1);
		expect(calls[0].el).toBe(panes[2]);
		expect(calls[0].keyframes[0]).toEqual({ opacity: 0, transform: 'translate3d(24px, 0px, 0px)' });
		expect(calls[0].keyframes[1]).toEqual({ opacity: 1, transform: 'none' });
		expect(content.classes()).toContain('is-switching');

		// 结束前再次切换：取消上一段，裁切保留到新的一段结束
		value.value = 'a';
		await flush();
		expect(calls[0].cancel).toHaveBeenCalled();
		expect(calls[1].el).toBe(panes[0]);
		expect(calls[1].keyframes[0].transform).toBe('translate3d(-24px, 0px, 0px)');
		await flush();
		expect(content.classes()).toContain('is-switching');
		calls[1].finish();
		await flush();
		expect(content.classes()).not.toContain('is-switching');

		// 左右位置：纵向
		placement.value = 'left';
		value.value = 'b';
		await flush();
		expect(calls[2].keyframes[0].transform).toBe('translate3d(0px, 24px, 0px)');
		calls[2].finish();

		wrapper.unmount();
		restore();
	});

	it('animated: not played without animated, for unknown values or on MTabs first selection', async () => {
		const { calls, restore } = mockAnimate();
		const value = ref<any>('a');
		const wrapper = mount(() => (
			<Tabs modelValue={value.value}>
				<TabsPane label="a" value="a" />
				<TabsPane label="b" value="b" />
			</Tabs>
		));
		await flush();
		value.value = 'b';
		await flush();
		expect(calls).toHaveLength(0);

		const animatedValue = ref<any>('a');
		const wrapper2 = mount(() => (
			<MTabs modelValue={animatedValue.value} animated>
				<MTabsPane label="a" value="a" />
				<MTabsPane label="b" value="b" />
			</MTabs>
		));
		await flush();
		animatedValue.value = 'missing';
		await flush();
		expect(calls).toHaveLength(0);

		// 移动端同样播放，横向
		animatedValue.value = 'b';
		await flush();
		animatedValue.value = 'a';
		await flush();
		expect(calls).toHaveLength(1);
		expect(calls[0].keyframes[0].transform).toBe('translate3d(-24px, 0px, 0px)');
		expect(wrapper2.find('.vcm-tabs__content').classes()).toContain('is-switching');

		// 卸载时取消进行中的动画
		wrapper2.unmount();
		expect(calls[0].cancel).toHaveBeenCalled();
		wrapper.unmount();
		restore();
	});

	it('animated=true adds is-animated class', async () => {
		const wrapper = mount(() => (
			<Tabs animated>
				<TabsPane label="a">A</TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper.classes()).toContain('is-animated');
	});

	it('closable + click close icon emits tab-remove', async () => {
		const onRemove = vi.fn();
		const wrapper = mount(() => (
			<Tabs closable onTabRemove={onRemove}>
				<TabsPane label="a" value="a" closable>A</TabsPane>
				<TabsPane label="b" value="b">B</TabsPane>
				<TabsPane label="c" value="c" closable>C</TabsPane>
			</Tabs>
		));
		await flush();

		const closes = wrapper.findAll('.vc-tabs__close');
		expect(closes).toHaveLength(2);

		await closes[1].trigger('click');
		expect(onRemove).toHaveBeenCalledTimes(1);
		expect(onRemove).toHaveBeenLastCalledWith('c', 2);
	});

	it('close button: is-closable on the item, no switch on click, hidden for disabled panes', async () => {
		const onRemove = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Tabs modelValue="a" type="card" closable onTabRemove={onRemove} onChange={onChange}>
				<TabsPane label="a" value="a" closable>A</TabsPane>
				<TabsPane label="b" value="b" closable>B</TabsPane>
				<TabsPane label="c" value="c" closable disabled>C</TabsPane>
			</Tabs>
		));
		await flush();

		const items = wrapper.findAll('.vc-tabs__item');
		expect(items.map(i => i.classes().includes('is-closable'))).toEqual([true, true, false]);
		expect(items[2].find('.vc-tabs__close').exists()).toBe(false);

		await items[1].find('.vc-tabs__close').trigger('click');
		await flush();
		expect(onRemove).toHaveBeenLastCalledWith('b', 1);
		expect(onChange).not.toHaveBeenCalled();
		expect(items[0].classes()).toContain('is-active');
	});

	it('disabled pane is not switchable', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<Tabs modelValue="a" onUpdate:modelValue={onUpdate}>
				<TabsPane label="a" value="a">A</TabsPane>
				<TabsPane label="b" value="b" disabled>B</TabsPane>
				<TabsPane label="c" value="c">C</TabsPane>
			</Tabs>
		));
		await flush();
		const items = wrapper.findAll('.vc-tabs__item');
		expect(items[1].classes()).toContain('is-disabled');

		await items[1].trigger('click');
		await flush();

		expect(onUpdate).not.toHaveBeenCalled();
		expect(items[0].classes()).toContain('is-active');
	});

	it('lazy=true: inactive panes do not render slot until activated', async () => {
		const value = ref<any>('a');
		const wrapper = mount(() => (
			<Tabs modelValue={value.value} onUpdate:modelValue={(v: any) => (value.value = v)}>
				<TabsPane label="a" value="a">
					<span class="lazy-a">A</span>
				</TabsPane>
				<TabsPane label="b" value="b">
					<span class="lazy-b">B</span>
				</TabsPane>
			</Tabs>
		));
		await flush();

		expect(wrapper.find('.lazy-a').exists()).toBe(true);
		expect(wrapper.find('.lazy-b').exists()).toBe(false);

		const items = wrapper.findAll('.vc-tabs__item');
		await items[1].trigger('click');
		await flush();

		expect(wrapper.find('.lazy-b').exists()).toBe(true);
	});

	it('lazy=false renders slot immediately', async () => {
		const wrapper = mount(() => (
			<Tabs modelValue="a">
				<TabsPane label="a" value="a">
					<span class="eager-a">A</span>
				</TabsPane>
				<TabsPane label="b" value="b" lazy={false}>
					<span class="eager-b">B</span>
				</TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper.find('.eager-b').exists()).toBe(true);
	});

	it('alive=false: hidden panes unmount their content, the pane element stays', async () => {
		const value = ref<any>('a');
		const wrapper = mount(() => (
			<Tabs modelValue={value.value} alive={false}>
				<TabsPane label="a" value="a"><input class="alive-a" /></TabsPane>
				<TabsPane label="b" value="b"><input class="alive-b" /></TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper.find('.alive-a').exists()).toBe(true);

		value.value = 'b';
		await flush();
		expect(wrapper.find('.alive-a').exists()).toBe(false);
		expect(wrapper.find('.alive-b').exists()).toBe(true);
		expect(wrapper.findAll('.vc-tabs-pane')).toHaveLength(2);

		// 重新激活后重建
		(wrapper.find('.alive-b').element as HTMLInputElement).value = 'typed';
		value.value = 'a';
		await flush();
		value.value = 'b';
		await flush();
		expect((wrapper.find('.alive-b').element as HTMLInputElement).value).toBe('');
	});

	it('alive: TabsPane overrides Tabs in both directions', async () => {
		const value = ref<any>('a');
		const wrapper = mount(() => (
			<Tabs modelValue={value.value} alive={false}>
				<TabsPane label="a" value="a" alive><span class="keep" /></TabsPane>
				<TabsPane label="b" value="b"><span class="drop" /></TabsPane>
				<TabsPane label="c" value="c" />
			</Tabs>
		));
		await flush();
		value.value = 'b';
		await flush();
		value.value = 'c';
		await flush();
		expect(wrapper.find('.keep').exists()).toBe(true);
		expect(wrapper.find('.drop').exists()).toBe(false);

		const value2 = ref<any>('a');
		const wrapper2 = mount(() => (
			<Tabs modelValue={value2.value}>
				<TabsPane label="a" value="a" alive={false}><span class="drop" /></TabsPane>
				<TabsPane label="b" value="b" />
			</Tabs>
		));
		await flush();
		value2.value = 'b';
		await flush();
		expect(wrapper2.find('.drop').exists()).toBe(false);
	});

	it('lazy: Tabs lazy=false renders every pane up front, TabsPane overrides it', async () => {
		const wrapper = mount(() => (
			<Tabs modelValue="a" lazy={false}>
				<TabsPane label="a" value="a"><span class="eager-a" /></TabsPane>
				<TabsPane label="b" value="b"><span class="eager-b" /></TabsPane>
				<TabsPane label="c" value="c" lazy><span class="lazy-c" /></TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper.find('.eager-b').exists()).toBe(true);
		expect(wrapper.find('.lazy-c').exists()).toBe(false);

		// alive=false 时不保留隐藏面板，lazy=false 也不提前渲染
		const wrapper2 = mount(() => (
			<Tabs modelValue="a" lazy={false} alive={false}>
				<TabsPane label="a" value="a" />
				<TabsPane label="b" value="b"><span class="eager-b" /></TabsPane>
			</Tabs>
		));
		await flush();
		expect(wrapper2.find('.eager-b').exists()).toBe(false);
	});

	it('alive / lazy are inherited by MTabsPane as well', async () => {
		const value = ref<any>('a');
		const wrapper = mount(() => (
			<MTabs modelValue={value.value} alive={false}>
				<MTabsPane label="a" value="a"><span class="m-a" /></MTabsPane>
				<MTabsPane label="b" value="b"><span class="m-b" /></MTabsPane>
			</MTabs>
		));
		await flush();
		value.value = 'b';
		await flush();
		expect(wrapper.find('.m-a').exists()).toBe(false);
		expect(wrapper.find('.m-b').exists()).toBe(true);

		const wrapper2 = mount(() => (
			<MTabs modelValue="a" lazy={false}>
				<MTabsPane label="a" value="a" />
				<MTabsPane label="b" value="b"><span class="m-eager" /></MTabsPane>
			</MTabs>
		));
		await flush();
		expect(wrapper2.find('.m-eager').exists()).toBe(true);
	});

	it('dynamic add / remove panes', async () => {
		const list = ref(['a', 'b']);
		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Tabs modelValue={list.value[0]}>
						{list.value.map(name => (
							<TabsPane key={name} label={name} value={name} />
						))}
					</Tabs>
				);
			}
		}));

		await flush();
		expect(wrapper.findAll('.vc-tabs__item')).toHaveLength(2);

		list.value = ['a', 'b', 'c', 'd'];
		await flush();
		expect(wrapper.findAll('.vc-tabs__item')).toHaveLength(4);

		list.value = ['a'];
		await flush();
		expect(wrapper.findAll('.vc-tabs__item')).toHaveLength(1);
	});

	it('tab order: insert mid v-for follows DOM children order', async () => {
		const items = ref([
			{ key: 'a', value: 'A' },
			{ key: 'b', value: 'B' }
		]);

		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Tabs>
						{items.value.map(it => (
							<TabsPane key={it.key} value={it.key} label={it.value} />
						))}
					</Tabs>
				);
			}
		}));
		await flush();

		expect(wrapper.findAll('.vc-tabs__item').map(el => el.text())).toEqual(['A', 'B']);

		items.value.splice(1, 0, { key: 'c', value: 'C' });
		await flush();

		expect(wrapper.findAll('.vc-tabs__item').map(el => el.text())).toEqual(['A', 'C', 'B']);
	});

	it('overflow: stepper buttons appear, disabled at both ends, prev/next scroll one viewport', async () => {
		const wrapper = mount(() => (
			<Tabs modelValue={0}>
				{Array.from({ length: 10 }, (_, i) => (
					<TabsPane key={i} label={`tab-${i}`} value={i} />
				))}
			</Tabs>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-tabs__stepper').exists()).toBe(false);

		const el = await mockOverflow(wrapper, { client: 300, scroll: 1000, item: 100 });
		expect(wrapper.find('.vc-tabs__stepper.is-prev').classes()).toContain('is-disabled');
		expect(wrapper.find('.vc-tabs__stepper.is-next').classes()).not.toContain('is-disabled');

		const next = wrapper.find('.vc-tabs__stepper.is-next');
		await next.trigger('click');
		await settle(el);
		expect(el.scrollLeft).toBe(300);
		expect(wrapper.find('.vc-tabs__stepper.is-prev').classes()).not.toContain('is-disabled');

		await next.trigger('click');
		await settle(el);
		await next.trigger('click');
		await settle(el);
		// 上界：scrollWidth - clientWidth
		expect(el.scrollLeft).toBe(700);
		expect(wrapper.find('.vc-tabs__stepper.is-next').classes()).toContain('is-disabled');

		const prev = wrapper.find('.vc-tabs__stepper.is-prev');
		await prev.trigger('click');
		await settle(el);
		expect(el.scrollLeft).toBe(400);
		await prev.trigger('click');
		await settle(el);
		await prev.trigger('click');
		await settle(el);
		// 下界：0
		expect(el.scrollLeft).toBe(0);

		wrapper.unmount();
	});

	it('overflow: stepper=false hides the prev / next buttons, the bar still scrolls', async () => {
		const value = ref<any>(0);
		const wrapper = mount(() => (
			<Tabs modelValue={value.value} stepper={false}>
				{Array.from({ length: 10 }, (_, i) => (
					<TabsPane key={i} label={`tab-${i}`} value={i} />
				))}
			</Tabs>
		), { attachTo: document.body });
		await flush();
		const el = await mockOverflow(wrapper, { client: 300, scroll: 1000, item: 100 });
		expect(wrapper.find('.vc-tabs__stepper').exists()).toBe(false);

		value.value = 8;
		await settle(el);
		expect(el.scrollLeft).toBe(600);

		wrapper.unmount();
	});

	it('overflow: wheel scrolls the bar along its axis, vertical delta included', async () => {
		const wrapper = mount(() => (
			<Tabs modelValue={0}>
				{Array.from({ length: 10 }, (_, i) => (
					<TabsPane key={i} label={`tab-${i}`} value={i} />
				))}
			</Tabs>
		), { attachTo: document.body });
		await flush();
		const el = await mockOverflow(wrapper, { client: 300, scroll: 1000, item: 100 });

		const wheel = (deltaX: number, deltaY: number) => {
			const e = new WheelEvent('wheel', { deltaX, deltaY, deltaMode: 0, bubbles: true, cancelable: true });
			el.dispatchEvent(e);
			return e;
		};

		const e1 = wheel(0, 120);
		await Utils.sleep(30);
		expect(el.scrollLeft).toBe(120);
		// 标签栏在滚动，页面不跟着滚
		expect(e1.defaultPrevented).toBe(true);

		wheel(80, 0);
		await Utils.sleep(30);
		expect(el.scrollLeft).toBe(200);

		// 已在起点：同原生滚动，刚滚到边界时停顿一下（helper-wheel 的 native），之后交给页面
		el.scrollLeft = 0;
		el.dispatchEvent(new Event('scroll'));
		wheel(0, -120);
		await Utils.sleep(50);
		const e2 = wheel(0, -120);
		await Utils.sleep(30);
		expect(el.scrollLeft).toBe(0);
		expect(e2.defaultPrevented).toBe(false);

		wrapper.unmount();
	});

	it('overflow: changing the active pane scrolls it into view; resizing keeps it there without animation', async () => {
		const value = ref<any>(0);
		const wrapper = mount(() => (
			<Tabs modelValue={value.value}>
				{Array.from({ length: 10 }, (_, i) => (
					<TabsPane key={i} label={`tab-${i}`} value={i} />
				))}
			</Tabs>
		), { attachTo: document.body });
		await flush();
		const el = await mockOverflow(wrapper, { client: 300, scroll: 1000, item: 100 });

		// 超出右侧：末端对齐可视区右边
		value.value = 8;
		await settle(el);
		expect(el.scrollLeft).toBe(600);

		// 超出左侧：起点对齐可视区左边
		value.value = 2;
		await settle(el);
		expect(el.scrollLeft).toBe(200);

		// 已在可视区内：不滚动
		value.value = 4;
		await settle(el);
		expect(el.scrollLeft).toBe(200);

		// 可视区尺寸变化：立即定位
		value.value = 9;
		await flush();
		el.scrollLeft = 0;
		triggerResize(el);
		expect(el.scrollLeft).toBe(700);

		wrapper.unmount();
	});

	it('shows extra/animated/closable + handleResize cleanup on unmount', async () => {
		const wrapper = mount(() => (
			<Tabs animated closable>
				<TabsPane label="a" value="a" closable>A</TabsPane>
				<TabsPane label="b" value="b">B</TabsPane>
			</Tabs>
		), { attachTo: document.body });
		await flush();
		wrapper.unmount();
		// 不报错即通过
		expect(true).toBe(true);
	});

	it('barClass / contentClass / barStyle / contentStyle', async () => {
		const wrapper = mount(() => (
			<Tabs
				barClass="my-bar"
				contentClass="my-content"
				barStyle={{ color: 'red' }}
				contentStyle={{ color: 'blue' }}
			>
				<TabsPane label="a">A</TabsPane>
			</Tabs>
		));
		await flush();
		const bar = wrapper.find('.vc-tabs__bar');
		const content = wrapper.find('.vc-tabs__content');
		expect(bar.classes()).toContain('my-bar');
		expect(content.classes()).toContain('my-content');
		expect(bar.attributes('style') || '').toContain('color: red');
		expect(content.attributes('style') || '').toContain('color: blue');
	});

	it('refresh on label/value watch', async () => {
		const label = ref('a');
		const value = ref('a');

		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Tabs modelValue={value.value}>
						<TabsPane label={label.value} value={value.value}>A</TabsPane>
						<TabsPane label="b" value="b">B</TabsPane>
					</Tabs>
				);
			}
		}));
		await flush();

		label.value = 'a-updated';
		await flush();

		expect(wrapper.findAll('.vc-tabs__item')[0].text()).toBe('a-updated');
	});

	it('anchor: clicking pane scrolls to anchor element', async () => {
		// 准备一个内置 scroller
		const scroller = document.createElement('div');
		scroller.className = 'vc-scroller is-wheel';
		scroller.style.overflow = 'auto';
		Object.defineProperty(scroller, 'scrollTop', { value: 0, writable: true, configurable: true });
		scroller.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		document.body.appendChild(scroller);

		const anchorEl = document.createElement('div');
		anchorEl.id = 'anchor-x';
		anchorEl.getBoundingClientRect = () => ({ top: 200, left: 0, right: 0, bottom: 200, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		scroller.appendChild(anchorEl);

		const wrapper = mount(() => (
			<Tabs modelValue={0}>
				<TabsPane label="a" value="a" />
				<TabsPane label="b" value="b" anchor="#anchor-x" />
			</Tabs>
		), { attachTo: scroller });

		await flush();
		const items = wrapper.findAll('.vc-tabs__item');
		await items[1].trigger('click');
		await flush();

		// scrollIntoView 是异步的，等一帧
		await Utils.sleep(20);
		expect(typeof scroller.scrollTop).toBe('number');

		wrapper.unmount();
		document.body.removeChild(scroller);
	});

	it('anchor: target position is measured from the scroller viewport inside its padding', async () => {
		const scroller = document.createElement('div');
		scroller.className = 'vc-scroller';
		scroller.style.paddingTop = '20px';
		Object.defineProperty(scroller, 'scrollTop', { value: 0, writable: true, configurable: true });
		scroller.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		document.body.appendChild(scroller);

		const anchorEl = document.createElement('div');
		anchorEl.id = 'anchor-padding';
		anchorEl.getBoundingClientRect = () => ({ top: 200, left: 0, right: 0, bottom: 200, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		scroller.appendChild(anchorEl);

		const wrapper = mount(() => (
			<Tabs modelValue={0}>
				<TabsPane label="a" value="a" />
				<TabsPane label="b" value="b" anchor="#anchor-padding" />
			</Tabs>
		), { attachTo: scroller });

		await flush();
		await wrapper.findAll('.vc-tabs__item')[1].trigger('click');
		await Utils.sleep(400);

		// 可视区顶在 padding 之下（0 + 20），锚点距可视区顶 180
		expect(scroller.scrollTop).toBe(180);

		wrapper.unmount();
		document.body.removeChild(scroller);
	});

	it('resizing the bar or the tab list refreshes the afloat, observers are released on unmount', async () => {
		const wrapper = mount(() => (
			<Tabs modelValue={1}>
				<TabsPane label="a" value={0} />
				<TabsPane label="b" value={1} />
			</Tabs>
		), { attachTo: document.body });
		await flush();

		const nav = wrapper.find('.vc-tabs__nav').element as HTMLElement;
		const item = nav.children[1] as HTMLElement;
		Object.defineProperty(item, 'offsetLeft', { get: () => 90, configurable: true });
		Object.defineProperty(item, 'offsetWidth', { get: () => 60, configurable: true });
		triggerResize(nav);
		await flush();
		const afloat = (wrapper.find('.vc-tabs__afloat').element as HTMLElement).style;
		expect(afloat.width).toBe('60px');
		expect(afloat.transform).toBe('translate3d(90px, 0px, 0px)');

		const count = observers.filter(ro => ro.targets.has(nav)).length;
		wrapper.unmount();
		expect(observers.filter(ro => ro.targets.has(nav)).length).toBeLessThan(count);
	});

	it('scrollToAnchor: clearing pending timer + affix bottom placement', async () => {
		const scroller = document.createElement('div');
		scroller.className = 'vc-scroller is-wheel';
		scroller.style.overflow = 'auto';
		Object.defineProperty(scroller, 'scrollTop', { value: 0, writable: true, configurable: true });
		scroller.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		document.body.appendChild(scroller);

		const a = document.createElement('div');
		a.id = 'anchor-a';
		a.getBoundingClientRect = () => ({ top: 100, left: 0, right: 0, bottom: 100, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		const b = document.createElement('div');
		b.id = 'anchor-b';
		b.getBoundingClientRect = () => ({ top: 200, left: 0, right: 0, bottom: 200, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		scroller.appendChild(a);
		scroller.appendChild(b);

		const fakeAffix = {
			props: { placement: 'bottom', offset: 50 },
			getOffset: () => 50,
			onScroll: () => {},
			offScroll: () => {}
		};
		const W = defineComponent({
			provide() {
				return { 'vc-affix': fakeAffix };
			},
			setup() {
				return () => (
					<Tabs modelValue={0}>
						<TabsPane label="A" value="a" anchor="#anchor-a" />
						<TabsPane label="B" value="b" anchor="#anchor-b" />
					</Tabs>
				);
			}
		});
		const wrapper = mount(W, { attachTo: scroller });
		await flush();

		const items = wrapper.findAll('.vc-tabs__item');
		await items[1].trigger('click');
		await Utils.sleep(310);
		// 第二次切换以触发 scrollToAnchorTimer 存在时 clearTimeout 分支
		await items[0].trigger('click');
		await flush();

		wrapper.unmount();
		document.body.removeChild(scroller);
	});

	it('scrollToAnchor: anchor element missing returns early', async () => {
		const wrapper = mount(() => (
			<Tabs modelValue="x">
				<TabsPane label="X" value="x" anchor="#not-exist-x" />
				<TabsPane label="Y" value="y" anchor="#not-exist-y" />
			</Tabs>
		), { attachTo: document.body });
		await flush();
		const items = wrapper.findAll('.vc-tabs__item');
		await items[1].trigger('click');
		await flush();
		wrapper.unmount();
	});

	it('handleAffixScroll selects the matched anchor pane', async () => {
		// 准备容器作 scroller
		const scroller = document.createElement('div');
		scroller.className = 'vc-scroller is-wheel';
		scroller.style.overflow = 'auto';
		Object.defineProperty(scroller, 'scrollTop', { value: 250, writable: true, configurable: true });
		scroller.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		document.body.appendChild(scroller);

		// elTop = el.top - scroller.top + scroller.scrollTop
		// scrollTop=250，目标使 a2.elTop=200 ⇒ el.top = -50
		const a1 = document.createElement('div');
		a1.id = 'a1';
		a1.getBoundingClientRect = () => ({ top: -250, left: 0, right: 0, bottom: -250, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		const a2 = document.createElement('div');
		a2.id = 'a2';
		a2.getBoundingClientRect = () => ({ top: -50, left: 0, right: 0, bottom: -50, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		const a3 = document.createElement('div');
		a3.id = 'a3';
		a3.getBoundingClientRect = () => ({ top: 150, left: 0, right: 0, bottom: 150, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
		scroller.appendChild(a1);
		scroller.appendChild(a2);
		scroller.appendChild(a3);

		// 通过 provide 注入伪 affix
		const listeners = new Set<() => void>();
		const fakeAffix = {
			props: { placement: 'top', offset: 0 },
			getOffset: () => 0,
			onScroll: (cb: () => void) => { listeners.add(cb); },
			offScroll: (cb: () => void) => { listeners.delete(cb); }
		};

		const Wrapper = defineComponent({
			provide() {
				return { 'vc-affix': fakeAffix };
			},
			setup() {
				return () => (
					<Tabs modelValue="a1">
						<TabsPane label="A1" value="a1" anchor="#a1" />
						<TabsPane label="A2" value="a2" anchor="#a2" />
						<TabsPane label="A3" value="a3" anchor="#a3" />
					</Tabs>
				);
			}
		});

		const wrapper = mount(Wrapper, { attachTo: scroller });
		await flush();

		// 触发 affix scroll callback —— scrollTop=250 落在 a2 与 a3 之间，应切到 a2
		listeners.forEach(cb => cb());
		await flush();

		wrapper.unmount();
		document.body.removeChild(scroller);
	});

	it('tab-pane nested in another component', async () => {
		const Comp = defineComponent({
			setup() {
				return () => (
					<TabsPane label="nested-1" value="nested-1">N1</TabsPane>
				);
			}
		});
		const wrapper = mount(() => (
			<Tabs>
				<Comp />
				<TabsPane label="b" value="b">B</TabsPane>
			</Tabs>
		));
		await flush();
		const items = wrapper.findAll('.vc-tabs__item');
		expect(items).toHaveLength(2);
		expect(items[0].text()).toBe('nested-1');
	});
});

describe('mobile', () => {
	it('renders named slots without resolving a slot component', async () => {
		const warnings: string[] = [];
		const wrapper = mount(MTabs, {
			props: { modelValue: 'a' },
			slots: {
				prepend: () => h('span', { class: 'test-prepend' }, 'Before'),
				append: () => h('span', { class: 'test-append' }, 'After'),
				default: () => h(MTabsPane, { label: 'A', value: 'a' }, () => 'Content')
			},
			global: { config: { warnHandler: (message) => { warnings.push(message); } } }
		});

		await flush();
		expect(wrapper.findAll('.test-prepend')).toHaveLength(1);
		expect(wrapper.findAll('.test-append')).toHaveLength(1);
		expect(wrapper.find('slot').exists()).toBe(false);
		expect(warnings).toEqual([]);
		wrapper.unmount();
	});

	it('basic', async () => {
		const wrapper = mount(() => (<MTabs />));
		expect(wrapper.classes()).toContain('vcm-tabs');
	});

	it('renders panes', async () => {
		const wrapper = mount(() => (
			<MTabs modelValue={0}>
				<MTabsPane label="a">A</MTabsPane>
				<MTabsPane label="b">B</MTabsPane>
			</MTabs>
		));
		await flush();
		expect(wrapper.find('.vcm-tabs__bar').exists()).toBe(true);
		expect(wrapper.find('.vcm-tabs__nav').exists()).toBe(true);
		expect(wrapper.find('.vcm-tabs__content').exists()).toBe(true);
		expect(wrapper.findAll('.vcm-tabs__item')).toHaveLength(2);
	});

	it('theme=dark adds is-dark class and afloat spans the tab', async () => {
		const wrapper = mount(() => (
			<MTabs modelValue={0} theme="dark">
				<MTabsPane label="a">A</MTabsPane>
				<MTabsPane label="b">B</MTabsPane>
			</MTabs>
		), { attachTo: document.body });

		await flush();
		expect(wrapper.classes()).toContain('is-dark');

		// jsdom 无布局，标签宽为 0；短条由样式在滑块内居中绘制
		const afloat = wrapper.find('.vcm-tabs__afloat').element as HTMLElement;
		expect(afloat.style.width).toBe('0px');
		wrapper.unmount();
	});

	it('average=true adds is-average and is-light when theme is light', async () => {
		const wrapper = mount(() => (
			<MTabs modelValue={0} average>
				<MTabsPane label="a">A</MTabsPane>
				<MTabsPane label="b">B</MTabsPane>
			</MTabs>
		));
		await flush();
		expect(wrapper.classes()).toContain('is-light');
		expect(wrapper.find('.vcm-tabs__bar').classes()).not.toContain('is-fixed');
		const items = wrapper.findAll('.vcm-tabs__item');
		expect(items[0].classes()).toContain('is-average');
	});

	it('showWrapper=false hides bar', async () => {
		const wrapper = mount(() => (
			<MTabs modelValue={0} showWrapper={false}>
				<MTabsPane label="a">A</MTabsPane>
			</MTabs>
		));
		await flush();
		expect(wrapper.find('.vcm-tabs__bar').exists()).toBe(false);
	});

	it('closable + click close emits tab-remove', async () => {
		const onRemove = vi.fn();
		const wrapper = mount(() => (
			<MTabs modelValue={0} closable onTabRemove={onRemove}>
				<MTabsPane label="a" value="a" closable>A</MTabsPane>
				<MTabsPane label="b" value="b" closable>B</MTabsPane>
			</MTabs>
		));
		await flush();
		const closes = wrapper.findAll('.vcm-tabs__close');
		expect(closes).toHaveLength(2);
		await closes[0].trigger('click');
		expect(onRemove).toHaveBeenCalledTimes(1);
	});

	it('renders slot.label / function label', async () => {
		const renderLabel = ({ index }: any) => h('span', { class: 'm-fn-label' }, `m#${index}`);
		const wrapper = mount(() => (
			<MTabs
				modelValue={0}
				v-slots={{ label: ({ row }: any) => <span class="m-slot-label">{row.label}</span> }}
			>
				<MTabsPane label="m1">A</MTabsPane>
			</MTabs>
		));
		await flush();
		expect(wrapper.find('.m-slot-label').exists()).toBe(true);

		const wrapper2 = mount(() => (
			<MTabs modelValue={0}>
				<MTabsPane label={renderLabel as any}>A</MTabsPane>
				<MTabsPane label="b">B</MTabsPane>
			</MTabs>
		));
		await flush();
		expect(wrapper2.find('.m-fn-label').text()).toBe('m#0');
	});

	it('switching value moves afloat offset', async () => {
		const value = ref<any>(0);
		const wrapper = mount(() => (
			<MTabs modelValue={value.value} onUpdate:modelValue={(v: any) => (value.value = v)}>
				<MTabsPane label="a" value="a">A</MTabsPane>
				<MTabsPane label="b" value="b">B</MTabsPane>
				<MTabsPane label="c" value="c">C</MTabsPane>
			</MTabs>
		), { attachTo: document.body });

		await flush();
		const items = wrapper.findAll('.vcm-tabs__item');
		await items[2].trigger('click');
		await flush();

		expect(value.value).toBe('c');
		expect(items[2].classes()).toContain('is-active');
		wrapper.unmount();
	});

	it('sticky=false renders the bar without MAffix', async () => {
		const wrapper = mount(() => (
			<MTabs modelValue={0}>
				<MTabsPane label="a" value="a">A</MTabsPane>
			</MTabs>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vcm-affix').exists()).toBe(false);
		expect(wrapper.find('.vcm-tabs__bar').exists()).toBe(true);
		wrapper.unmount();
	});

	it('sticky pins the bar with MAffix (position: sticky, offsetTop in 750 units)', async () => {
		// jsdom 不做布局：MAffix 测量节点的宽度按 --vc-rem 0.5px 算出
		const getComputedStyle = window.getComputedStyle;
		const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
			const style = getComputedStyle(el, pseudo);
			if (!el.matches('.vcm-affix > .vc-affix__measurer')) return style;
			return new Proxy(style, {
				get: (target, key) => key === 'width'
					? `${Number(/\* (-?[\d.]+)\)/.exec((el as HTMLElement).style.width)?.[1] || 0) * 0.5}px`
					: Reflect.get(target, key)
			});
		});

		const wrapper = mount(() => (
			<MTabs modelValue={0} sticky offsetTop={100}>
				<MTabsPane label="a" value="a">A</MTabsPane>
			</MTabs>
		), { attachTo: document.body });
		await flush();

		const affix = wrapper.find('.vcm-affix');
		const affixEl = affix.element as HTMLElement;
		// 标签栏在 MAffix 内，吸附由 sticky 完成，不再有占位元素
		expect(affix.classes()).toContain('is-sticky');
		expect(affixEl.style.top).toBe('calc(var(--vc-rem) * 100)');
		expect(affixEl.style.zIndex).toBe('999');
		expect(affix.find('.vcm-tabs__bar').exists()).toBe(true);
		expect(wrapper.find('.vcm-tabs__placeholder').exists()).toBe(false);

		// 停在吸附线（100 × 0.5 = 50px）上：吸顶中，标签栏带 is-fixed
		const rect = vi.spyOn(affixEl, 'getBoundingClientRect').mockReturnValue({
			top: 50, bottom: 95, left: 0, right: 375, width: 375, height: 45, x: 0, y: 50, toJSON: () => ({})
		} as DOMRect);
		window.dispatchEvent(new Event('scroll'));
		await flush();
		expect(wrapper.find('.vcm-tabs__bar').classes()).toContain('is-fixed');

		// 还没到吸附线
		rect.mockReturnValue({ ...affixEl.getBoundingClientRect(), top: 120, bottom: 165 } as DOMRect);
		window.dispatchEvent(new Event('scroll'));
		await flush();
		expect(wrapper.find('.vcm-tabs__bar').classes()).not.toContain('is-fixed');

		rect.mockRestore();
		spy.mockRestore();
		wrapper.unmount();
	});

	it('does not read the afloat as the active item before the tabs render', async () => {
		const errors: any[] = [];
		const onError = (e: any) => errors.push(e);
		process.on('unhandledRejection', onError);
		const panes = ['一', '二', '三'];
		const wrapper = mount(() => (
			<MTabs modelValue="一">
				{panes.map(pane => <MTabsPane key={pane} label={pane} value={pane}>{pane}</MTabsPane>)}
			</MTabs>
		), { attachTo: document.body });
		await flush();
		await Utils.sleep(10);
		process.off('unhandledRejection', onError);
		expect(errors).toEqual([]);
		expect(wrapper.find('.vcm-tabs__item.is-active').text()).toBe('一');
		wrapper.unmount();
	});

	it('autoAfloatWidth=false uses item.offsetWidth as afloatWidth', async () => {
		const wrapper = mount(() => (
			<MTabs modelValue={0} autoAfloatWidth={false}>
				<MTabsPane label="a" value="a">A</MTabsPane>
				<MTabsPane label="b" value="b">B</MTabsPane>
			</MTabs>
		), { attachTo: document.body });

		await flush();
		const items = wrapper.findAll('.vcm-tabs__item');
		const restoreA = mockSize(items[0].element as HTMLElement, 80);
		const restoreB = mockSize(items[1].element as HTMLElement, 80);
		// 触发刷新
		await items[1].trigger('click');
		await flush();

		const afloat = wrapper.find('.vcm-tabs__afloat').element as HTMLElement;
		// 应已 80px
		expect(afloat.style.width.replace(/\s/g, '')).toBe('80px');

		restoreA();
		restoreB();
		wrapper.unmount();
	});

	it('scrolls natively along x on a Scroller; stepper (off by default) pages one viewport', async () => {
		const wrapper = mount(() => (
			<MTabs modelValue={0} stepper>
				{Array.from({ length: 12 }, (_, i) => (
					<MTabsPane key={i} label={`tab-${i}`} value={i} />
				))}
			</MTabs>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.vcm-tabs__scroll').classes()).toEqual(expect.arrayContaining(['vc-scroller', 'is-x']));
		expect(wrapper.find('.vcm-tabs__stepper').exists()).toBe(false);

		const el = await mockOverflow(wrapper, { client: 200, scroll: 1200, item: 100 }, 'vcm-tabs');
		expect(wrapper.find('.vcm-tabs__stepper.is-prev').exists()).toBe(true);

		await wrapper.find('.vcm-tabs__stepper.is-next').trigger('click');
		await settle(el);
		expect(el.scrollLeft).toBe(200);

		await wrapper.find('.vcm-tabs__stepper.is-prev').trigger('click');
		await settle(el);
		expect(el.scrollLeft).toBe(0);
		wrapper.unmount();

		const plain = mount(() => (
			<MTabs modelValue={0}>
				{Array.from({ length: 12 }, (_, i) => (
					<MTabsPane key={i} label={`tab-${i}`} value={i} />
				))}
			</MTabs>
		), { attachTo: document.body });
		await flush();
		await mockOverflow(plain, { client: 200, scroll: 1200, item: 100 }, 'vcm-tabs');
		expect(plain.find('.vcm-tabs__stepper').exists()).toBe(false);
		plain.unmount();
	});

	it('the selected tab is scrolled to the center, clamped at both ends', async () => {
		const value = ref<any>(0);
		const wrapper = mount(() => (
			<MTabs modelValue={value.value}>
				{Array.from({ length: 12 }, (_, i) => (
					<MTabsPane key={i} label={`tab-${i}`} value={i} />
				))}
			</MTabs>
		), { attachTo: document.body });
		await flush();
		const el = await mockOverflow(wrapper, { client: 200, scroll: 1200, item: 100 }, 'vcm-tabs');

		// 300 起、宽 100，居中于 200 的可视区：300 - 50
		value.value = 3;
		await settle(el);
		expect(el.scrollLeft).toBe(250);

		value.value = 11;
		await settle(el);
		expect(el.scrollLeft).toBe(1000);

		value.value = 0;
		await settle(el);
		expect(el.scrollLeft).toBe(0);

		wrapper.unmount();
	});

	it('afloat is centered under the selected tab', async () => {
		const value = ref<any>(0);
		const wrapper = mount(() => (
			<MTabs modelValue={value.value} theme="dark">
				<MTabsPane label="a" value={0} />
				<MTabsPane label="b" value={1} />
			</MTabs>
		), { attachTo: document.body });
		await flush();

		const item = wrapper.findAll('.vcm-tabs__item')[1].element as HTMLElement;
		Object.defineProperty(item, 'offsetLeft', { get: () => 100, configurable: true });
		Object.defineProperty(item, 'offsetWidth', { get: () => 80, configurable: true });
		value.value = 1;
		await flush();

		const afloat = (wrapper.find('.vcm-tabs__afloat').element as HTMLElement).style;
		// dark 滑块铺满标签，短条由样式居中绘制
		expect(afloat.width).toBe('80px');
		expect(afloat.transform).toBe('translate3d(100px, 0px, 0px)');
		wrapper.unmount();
	});
});

describe('label', () => {
	const MARKUP = '<b class="inner">text</b>';

	it('渲染函数与插槽收到 row / it / index，根节点上没有透传属性', async () => {
		const render = vi.fn(({ it, index }: any) => (<em class="render">{ `${it.value}:${index}` }</em>));
		const wrapper = mount(() => (
			<Tabs modelValue="a">
				<TabsPane value="a" label={render}>A</TabsPane>
			</Tabs>
		), { attachTo: document.body });
		await flush();

		const options = (render.mock.calls[0] as any)[0];
		expect(Object.keys(options).sort()).toEqual(['index', 'it', 'row']);
		expect(options.row).toBe(options.it);
		expect(wrapper.find('.render').text()).toBe('a:0');
		expect(wrapper.find('.render').attributes()).toEqual({ class: 'render' });
		wrapper.unmount();

		const slot = vi.fn(() => 'slot');
		const wrapper$ = mount(() => (
			<Tabs modelValue="a" v-slots={{ label: slot }}>
				<TabsPane value="a" label="a">A</TabsPane>
			</Tabs>
		), { attachTo: document.body });
		await flush();
		expect(Object.keys((slot.mock.calls[0] as any)[0]).sort()).toEqual(['index', 'it', 'row']);
		wrapper$.unmount();
	});

	it('{ type: \'html\' } 按 HTML 渲染，字符串按文本渲染', async () => {
		const wrapper = mount(() => (
			<Tabs modelValue="a">
				<TabsPane value="a" label={{ type: 'html', value: MARKUP }}>A</TabsPane>
				<TabsPane value="b" label={MARKUP}>B</TabsPane>
			</Tabs>
		), { attachTo: document.body });
		await flush();

		const [a, b] = wrapper.findAll('.vc-tabs__item');
		expect(a.find('span .inner').exists()).toBe(true);
		expect(b.find('.inner').exists()).toBe(false);
		expect(b.find('span').text()).toBe(MARKUP);
		wrapper.unmount();
	});

	describe.each([
		['Tabs', Tabs, TabsPane, 'vc'],
		['MTabs', MTabs, MTabsPane, 'vcm']
	])('%s：每次渲染都是新引用的 label', (_, Component: any, Pane: any, prefix) => {
		it.each([
			['{ type, value }', () => ({ type: 'html', value: '<b class="inline">甲</b>' })],
			['渲染函数', () => () => (<b class="inline">甲</b>)]
		])('内联的 %s 不会循环更新', async (__, create) => {
			// 默认插槽每次求值都产生新的 label
			const render = vi.fn(() => [
				<Pane value="a" label={create() as any}>A</Pane>,
				<Pane value="b" label="乙">B</Pane>
			]);
			const wrapper = mount(() => (<Component modelValue="a">{{ default: render }}</Component>), { attachTo: document.body });
			await flush();

			expect(render.mock.calls.length).toBeLessThan(10);
			expect(wrapper.find(`.${prefix}-tabs__item .inline`).text()).toBe('甲');
			wrapper.unmount();
		});

		it('label 变化后标签更新', async () => {
			const text = ref('甲');
			const wrapper = mount(() => (
				<Component modelValue="a">
					<Pane value="a" label={{ type: 'text', value: text.value }}>A</Pane>
				</Component>
			), { attachTo: document.body });
			await flush();
			expect(wrapper.find(`.${prefix}-tabs__item`).text()).toBe('甲');

			text.value = '乙';
			await flush();
			expect(wrapper.find(`.${prefix}-tabs__item`).text()).toBe('乙');
			wrapper.unmount();
		});
	});

	it('移动端：渲染函数、插槽和空标签都在 span 内，滑块按这个 span 的宽度计算', async () => {
		const wrapper = mount(() => (
			<MTabs modelValue="a">
				<MTabsPane value="a">A</MTabsPane>
				<MTabsPane value="b" label={() => (<em>B</em>)}>B</MTabsPane>
			</MTabs>
		), { attachTo: document.body });
		await flush();

		const items = wrapper.findAll('.vcm-tabs__item');
		const spans = items.map(i => i.element.firstElementChild as HTMLElement);
		expect(spans.map(i => i.outerHTML)).toEqual(['<span></span>', '<span><em>B</em></span>']);

		const restore = mockSize(spans[1], 36);
		// 切到渲染函数的标签，触发刷新
		await items[1].trigger('click');
		await flush();
		expect((wrapper.find('.vcm-tabs__afloat').element as HTMLElement).style.width).toBe('36px');

		restore();
		wrapper.unmount();
	});
});
