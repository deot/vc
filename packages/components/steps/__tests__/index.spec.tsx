// @vitest-environment jsdom

import { Steps, Step, MSteps, MStep } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h, ref, nextTick } from 'vue';

const items = (wrapper: any) => wrapper.findAll('.vc-steps > .vc-step');
const statuses = (wrapper: any) => items(wrapper).map((item: any) => {
	return item.classes().find((v: string) => /^is-(default|pending|success|error)$/.test(v));
});
const flags = (wrapper: any, cls: string) => items(wrapper).map((item: any) => item.classes(cls));
const labelClass = (wrapper: any) => wrapper.classes().find((v: string) => /^is-label-/.test(v));

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Steps).toBe('object');
		expect(typeof Step).toBe('object');
		expect(MSteps).toBe(Steps);
		expect(MStep).toBe(Step);
	});

	it('create', () => {
		const wrapper = mount(() => (<Steps />));

		expect(wrapper.classes()).toEqual(['vc-steps', 'is-horizontal', 'is-default', 'is-label-right']);
		expect(wrapper.attributes('role')).toBe('list');
	});

	it('tag: 使用自定义标签渲染', () => {
		const wrapper = mount(() => (<Steps tag="ol" />));

		expect(wrapper.element.tagName).toBe('OL');
	});

	it('modelValue: 之前为 success, 当前为 pending, 之后为 default', () => {
		const render = (modelValue: number) => mount(() => (
			<Steps modelValue={modelValue}>
				<Step title="A" />
				<Step title="B" />
				<Step title="C" />
			</Steps>
		));

		expect(statuses(render(2))).toEqual(['is-success', 'is-pending', 'is-default']);
		// 0：都未开始；n+1：全部完成
		expect(statuses(render(0))).toEqual(['is-default', 'is-default', 'is-default']);
		expect(statuses(render(4))).toEqual(['is-success', 'is-success', 'is-success']);
		// 默认从第 1 步开始
		const initial = mount(() => (
			<Steps>
				<Step />
				<Step />
			</Steps>
		));
		expect(statuses(initial)).toEqual(['is-pending', 'is-default']);
	});

	it('is-active: 仅当前步, 随 modelValue 更新', async () => {
		const current = ref(1);
		const wrapper = mount(() => (
			<Steps modelValue={current.value}>
				<Step />
				<Step />
			</Steps>
		));

		expect(flags(wrapper, 'is-active')).toEqual([true, false]);

		current.value = 2;
		await nextTick();
		expect(flags(wrapper, 'is-active')).toEqual([false, true]);
		expect(statuses(wrapper)).toEqual(['is-success', 'is-pending']);
	});

	it('status: 只作用于当前步, 前一步的连线标记 is-next-error', () => {
		const wrapper = mount(() => (
			<Steps modelValue={2} status="error">
				<Step />
				<Step />
				<Step />
			</Steps>
		));

		expect(statuses(wrapper)).toEqual(['is-success', 'is-error', 'is-default']);
		expect(flags(wrapper, 'is-next-error')).toEqual([true, false, false]);
	});

	it('Step.status: 优先于推导结果, 单独设置 error 同样标记前一步', () => {
		const wrapper = mount(() => (
			<Steps modelValue={2}>
				<Step />
				<Step />
				<Step status="error" />
				<Step status="success" />
			</Steps>
		));

		expect(statuses(wrapper)).toEqual(['is-success', 'is-pending', 'is-error', 'is-success']);
		expect(flags(wrapper, 'is-next-error')).toEqual([false, true, false, false]);
	});

	it('节点: 序号 / 成功与失败为图标 / dot 为空的圆点 / arrow 没有节点', () => {
		const render = (type?: any) => mount(() => (
			<Steps modelValue={2} type={type}>
				<Step />
				<Step status="error" />
				<Step />
			</Steps>
		));
		const icons = (wrapper: any) => wrapper.findAll('.vc-step__dot > .vc-step__icon');

		const normal = icons(render());
		expect(normal[0].find('.vc-icon').exists()).toBe(true);
		expect(normal[1].find('.vc-icon').exists()).toBe(true);
		expect(normal[2].text()).toBe('3');

		const dot = icons(render('dot'));
		expect(dot.length).toBe(3);
		expect(dot.every((icon: any) => icon.element.children.length === 0 && icon.text() === '')).toBe(true);

		expect(render('arrow').find('.vc-step__dot').exists()).toBe(false);
	});

	it('labelPosition: 按方向与类型映射到实际位置', () => {
		const render = (props: any) => mount(() => (
			<Steps {...props}>
				<Step />
			</Steps>
		));
		const positions = ['right', 'bottom', 'left', 'top'];
		const map = (props: any) => positions.map(labelPosition => labelClass(render({ ...props, labelPosition })));

		expect(map({})).toEqual(['is-label-right', 'is-label-bottom', 'is-label-left', 'is-label-top']);
		expect(map({ vertical: true })).toEqual(['is-label-right', 'is-label-right', 'is-label-left', 'is-label-left']);
		expect(map({ type: 'dot' })).toEqual(['is-label-bottom', 'is-label-bottom', 'is-label-top', 'is-label-top']);
		expect(map({ type: 'dot', vertical: true })).toEqual(['is-label-right', 'is-label-right', 'is-label-left', 'is-label-left']);
		// navigation 固定在右侧、arrow 没有节点，都不参与
		expect(map({ type: 'navigation' })).toEqual([undefined, undefined, undefined, undefined]);
		expect(map({ type: 'arrow' })).toEqual([undefined, undefined, undefined, undefined]);
	});

	it('vertical: arrow / navigation 只支持横向', () => {
		const render = (type: any) => mount(() => (<Steps vertical type={type} />));

		expect(render('default').classes()).toEqual(expect.arrayContaining(['is-vertical', 'is-default']));
		expect(render('dot').classes()).toContain('is-vertical');
		expect(render('arrow').classes()).toEqual(expect.arrayContaining(['is-horizontal', 'is-arrow']));
		expect(render('navigation').classes()).toEqual(expect.arrayContaining(['is-horizontal', 'is-navigation']));
	});

	it('tail: 仅在节点之间有连线的布局中渲染, lineless 时不渲染', () => {
		const hasTail = (props: any) => mount(() => (
			<Steps {...props}>
				<Step />
				<Step />
			</Steps>
		)).find('.vc-step__tail').exists();

		expect(hasTail({})).toBe(false);
		expect(hasTail({ labelPosition: 'left' })).toBe(false);
		expect(hasTail({ labelPosition: 'bottom' })).toBe(true);
		expect(hasTail({ labelPosition: 'top' })).toBe(true);
		expect(hasTail({ vertical: true })).toBe(true);
		expect(hasTail({ type: 'dot' })).toBe(true);
		expect(hasTail({ type: 'arrow' })).toBe(false);
		expect(hasTail({ type: 'navigation' })).toBe(false);
		expect(hasTail({ vertical: true, lineless: true })).toBe(false);
	});

	it('lineless', () => {
		const wrapper = mount(() => (<Steps lineless />));

		expect(wrapper.classes()).toContain('is-lineless');
	});

	it('clickable: 点击切换, 当前步 / disabled 不触发', async () => {
		const current = ref(2);
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Steps
				modelValue={current.value}
				clickable
				onUpdate:modelValue={(v: number) => current.value = v}
				onChange={onChange}
			>
				<Step />
				<Step />
				<Step disabled />
			</Steps>
		));

		expect(wrapper.classes()).toContain('is-clickable');
		expect(flags(wrapper, 'is-clickable')).toEqual([true, false, false]);

		await items(wrapper)[1].trigger('click');
		await items(wrapper)[2].trigger('click');
		expect(onChange).not.toHaveBeenCalled();

		await items(wrapper)[0].trigger('click');
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith(1);
		expect(current.value).toBe(1);
		expect(statuses(wrapper)).toEqual(['is-pending', 'is-default', 'is-default']);
		expect(flags(wrapper, 'is-clickable')).toEqual([false, true, false]);
	});

	it('clickable: 未绑定 v-model 时内部切换', async () => {
		const wrapper = mount(Steps, {
			props: { clickable: true },
			slots: { default: () => [h(Step), h(Step)] }
		});

		await items(wrapper)[1].trigger('click');
		expect(wrapper.emitted('update:modelValue')).toEqual([[2]]);
		expect(wrapper.emitted('change')).toEqual([[2]]);
		expect(statuses(wrapper)).toEqual(['is-success', 'is-pending']);
	});

	it('clickable: 未开启时点击不切换', async () => {
		const wrapper = mount(Steps, {
			slots: { default: () => [h(Step), h(Step)] }
		});

		await items(wrapper)[1].trigger('click');
		expect(wrapper.emitted('change')).toBeUndefined();
		expect(items(wrapper).some((item: any) => item.classes('is-clickable'))).toBe(false);
	});

	it('title / description: 字符串 / 函数 / 插槽优先 / 描述为空时不渲染', () => {
		const wrapper = mount(() => (
			<Steps>
				<Step title="<b>html</b>" description="desc" />
				<Step title={() => h('i', 'fn')} description={() => h('i', 'fn-desc')} />
				<Step title="prop" description="prop">
					{{
						title: () => <span class="slot-title">slot</span>,
						description: () => <span class="slot-desc">slot-desc</span>
					}}
				</Step>
				<Step title="D" />
			</Steps>
		));
		const titles = wrapper.findAll('.vc-step__title');
		const descriptions = items(wrapper).map((item: any) => item.find('.vc-step__description'));

		expect(titles[0].find('b').text()).toBe('html');
		expect(titles[1].find('i').text()).toBe('fn');
		expect(titles[2].find('.slot-title').text()).toBe('slot');
		expect(titles[2].text()).toBe('slot');
		expect(descriptions[0].text()).toBe('desc');
		expect(descriptions[1].find('i').text()).toBe('fn-desc');
		expect(descriptions[2].find('.slot-desc').exists()).toBe(true);
		expect(descriptions[3].exists()).toBe(false);
	});

	it('renderDot: 参数为 index / status / title / description / dot', () => {
		const renderDot = vi.fn(({ index, dot }: any) => h('span', { class: `custom-${index}` }, [dot]));
		const wrapper = mount(() => (
			<Steps modelValue={2} renderDot={renderDot}>
				<Step title="A" description="a" />
				<Step title="B" />
			</Steps>
		));

		expect(renderDot).toHaveBeenCalledTimes(2);
		expect(renderDot.mock.calls[0][0]).toEqual(expect.objectContaining({ index: 1, status: 'success', title: 'A', description: 'a' }));
		expect(renderDot.mock.calls[1][0]).toEqual(expect.objectContaining({ index: 2, status: 'pending', title: 'B', description: '' }));
		// dot 为默认节点，可包裹后返回
		expect(wrapper.find('.vc-step__dot > .custom-1 > .vc-step__icon').exists()).toBe(true);
		expect(wrapper.find('.vc-step__dot > .custom-2 > .vc-step__icon').text()).toBe('2');
	});

	it('dot 插槽: 优先于 renderDot', () => {
		const renderDot = vi.fn(() => h('span', { class: 'from-render' }));
		const wrapper = mount(() => (
			<Steps renderDot={renderDot}>
				{{
					default: () => [<Step />, <Step />],
					dot: ({ index, status }: any) => <span class={['from-slot', `is-${status}`]}>{ index }</span>
				}}
			</Steps>
		));
		const dots = wrapper.findAll('.vc-step__dot > .from-slot');

		expect(renderDot).not.toHaveBeenCalled();
		expect(wrapper.find('.from-render').exists()).toBe(false);
		expect(dots.map(dot => dot.text())).toEqual(['1', '2']);
		expect(dots[0].classes()).toContain('is-pending');
	});

	it('renderDot: arrow 下不生效', () => {
		const renderDot = vi.fn(() => h('span'));
		mount(() => (
			<Steps type="arrow" renderDot={renderDot}>
				<Step />
			</Steps>
		));

		expect(renderDot).not.toHaveBeenCalled();
	});

	it('默认插槽: 展开 v-for / <template>, 过滤非 Step 的节点', async () => {
		const wrapper = mount({
			components: { Steps, Step },
			data: () => ({ list: ['B', 'C'], current: 3 }),
			template: `
				<Steps :model-value="current">
					<div class="other" />
					text
					<Step title="A" />
					<Step v-for="item in list" :key="item" :title="item" />
					<template v-if="true">
						<Step title="D" />
					</template>
				</Steps>
			`
		});

		expect(wrapper.find('.other').exists()).toBe(false);
		expect(wrapper.element.children.length).toBe(4);
		expect(wrapper.findAll('.vc-step__title').map(title => title.text())).toEqual(['A', 'B', 'C', 'D']);
		expect(wrapper.findAll('.vc-step__icon').map(icon => icon.text())).toEqual(['', '', '3', '4']);

		(wrapper.vm as any).list = ['B'];
		await nextTick();
		expect(wrapper.findAll('.vc-step__icon').map(icon => icon.text())).toEqual(['', '', '3']);
		expect(statuses(wrapper)).toEqual(['is-success', 'is-success', 'is-pending']);
	});

	it('Step: 可脱离 Steps 使用', async () => {
		const wrapper = mount(() => (<Step title="A" />));

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-step', 'is-default', 'is-active']));
		expect(wrapper.find('.vc-step__icon').text()).toBe('1');
		expect(wrapper.find('.vc-step__tail').exists()).toBe(false);

		await wrapper.trigger('click');
		expect(wrapper.classes()).not.toContain('is-clickable');
	});
});
