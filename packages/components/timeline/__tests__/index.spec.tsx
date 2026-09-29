// @vitest-environment jsdom

import { Timeline, TimelineItem, MTimeline, MTimelineItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h, ref, nextTick } from 'vue';

const items = (wrapper: any) => wrapper.findAll('.vc-timeline > .vc-timeline-item');
const texts = (wrapper: any) => items(wrapper).map((item: any) => item.find('.vc-timeline-item__content').text());

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Timeline).toBe('object');
		expect(typeof TimelineItem).toBe('object');
		expect(MTimeline).toBe(Timeline);
		expect(MTimelineItem).toBe(TimelineItem);
	});

	it('create', () => {
		const wrapper = mount(() => (<Timeline />));

		expect(wrapper.classes()).toEqual(['vc-timeline', 'is-vertical', 'is-start']);
		expect(wrapper.attributes('role')).toBe('list');
	});

	it('tag: 使用自定义标签渲染', () => {
		const wrapper = mount(() => (<Timeline tag="section" />));

		expect(wrapper.element.tagName).toBe('SECTION');
	});

	it('vertical: false 时为横向, 各项同时标记 is-horizontal', () => {
		const wrapper = mount(() => (
			<Timeline vertical={false}>
				<TimelineItem>A</TimelineItem>
			</Timeline>
		));

		expect(wrapper.classes()).toContain('is-horizontal');
		expect(wrapper.classes()).not.toContain('is-vertical');
		expect(items(wrapper)[0].classes()).toContain('is-horizontal');
	});

	it('align: 轴线位置, 除 end 外各项均为 is-start', () => {
		const render = (align: any) => mount(() => (
			<Timeline align={align}>
				<TimelineItem>A</TimelineItem>
				<TimelineItem>B</TimelineItem>
			</Timeline>
		));

		const center = render('center');
		expect(center.classes()).toContain('is-center');
		expect(items(center).map((item: any) => item.classes('is-start'))).toEqual([true, true]);
		expect(items(center).map((item: any) => item.classes('is-center'))).toEqual([true, true]);

		const end = render('end');
		expect(end.classes()).toContain('is-end');
		expect(items(end).map((item: any) => item.classes('is-end'))).toEqual([true, true]);
		expect(items(end).map((item: any) => item.classes('is-center'))).toEqual([false, false]);
		expect(items(end).map((item: any) => item.classes('is-horizontal'))).toEqual([false, false]);
	});

	it('alternate: 轴线强制居中, 忽略 align, 各项按奇偶交替', () => {
		const wrapper = mount(() => (
			<Timeline alternate align="end">
				<TimelineItem>A</TimelineItem>
				<TimelineItem>B</TimelineItem>
				<TimelineItem>C</TimelineItem>
			</Timeline>
		));

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-center', 'is-alternate']));
		expect(wrapper.classes()).not.toContain('is-end');
		expect(items(wrapper).map((item: any) => item.classes().find((v: string) => /^is-(start|end)$/.test(v))))
			.toEqual(['is-start', 'is-end', 'is-start']);
	});

	it('is-last: 仅最后一项, 并随子节点变化更新', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<Timeline>
				<TimelineItem>A</TimelineItem>
				<TimelineItem>B</TimelineItem>
				{ visible.value && <TimelineItem>C</TimelineItem> }
			</Timeline>
		));

		expect(items(wrapper).map((item: any) => item.classes('is-last'))).toEqual([false, false, true]);

		visible.value = false;
		await nextTick();
		expect(items(wrapper).map((item: any) => item.classes('is-last'))).toEqual([false, true]);
	});

	it('opposite: 标签移出内容区, TimelineItem 可单独覆盖', () => {
		const wrapper = mount(() => (
			<div>
				<Timeline>
					<TimelineItem label="a">A</TimelineItem>
					<TimelineItem label="b" opposite>B</TimelineItem>
				</Timeline>
				<Timeline opposite>
					<TimelineItem label="c">C</TimelineItem>
					<TimelineItem label="d" opposite={false}>D</TimelineItem>
				</Timeline>
			</div>
		));
		const [a, b, c, d] = wrapper.findAll('.vc-timeline-item');
		const isOutside = (item: any) => item.find(':scope > .vc-timeline-item__label').exists();
		const isInside = (item: any) => item.find('.vc-timeline-item__content-wrapper > .vc-timeline-item__label').exists();

		expect([a, b, c, d].map(item => item.classes('is-opposite'))).toEqual([false, true, true, false]);
		expect([a, b, c, d].map(isOutside)).toEqual([false, true, true, false]);
		expect([a, b, c, d].map(isInside)).toEqual([true, false, false, true]);
	});

	it('inverted: 倒序渲染, 包括 v-for 生成的节点', async () => {
		const wrapper = mount({
			components: { Timeline, TimelineItem },
			data: () => ({ inverted: false, list: ['B', 'C'] }),
			template: `
				<Timeline :inverted="inverted">
					<TimelineItem>A</TimelineItem>
					<TimelineItem v-for="item in list" :key="item">{{ item }}</TimelineItem>
					<template v-if="true">
						<TimelineItem>D</TimelineItem>
						<TimelineItem>E</TimelineItem>
					</template>
				</Timeline>
			`
		});

		expect(texts(wrapper)).toEqual(['A', 'B', 'C', 'D', 'E']);

		(wrapper.vm as any).inverted = true;
		await nextTick();
		expect(texts(wrapper)).toEqual(['E', 'D', 'C', 'B', 'A']);
		expect(items(wrapper).map((item: any) => item.classes('is-last'))).toEqual([false, false, false, false, true]);
	});

	it('默认插槽: 过滤非 TimelineItem 的节点', () => {
		const wrapper = mount(() => (
			<Timeline>
				<div class="other" />
				text
				<TimelineItem>A</TimelineItem>
			</Timeline>
		));

		expect(wrapper.find('.other').exists()).toBe(false);
		expect(wrapper.element.children.length).toBe(1);
		expect(wrapper.text()).toBe('A');
	});

	it('showPending: 末尾追加幽灵节点, 默认使用 Spin, 相连轴线为虚线', () => {
		const wrapper = mount(() => (
			<Timeline showPending>
				<TimelineItem>A</TimelineItem>
				<TimelineItem>B</TimelineItem>
			</Timeline>
		));
		const list = items(wrapper);
		const lineTypes = list.map((item: any) => item.find('.vc-timeline-item__line').classes('is-dashed'));

		expect(list.length).toBe(3);
		expect(list[2].classes()).toEqual(expect.arrayContaining(['is-pending', 'is-last']));
		expect(list[2].find('.vc-timeline-item__dot-custom .vc-spin').exists()).toBe(true);
		expect(list[2].find('.vc-timeline-item__content').exists()).toBe(false);
		expect(lineTypes).toEqual([false, true, false]);
	});

	it('showPending: pending / pending-dot 插槽', () => {
		const wrapper = mount(() => (
			<Timeline showPending>
				{{
					'default': () => <TimelineItem>A</TimelineItem>,
					'pending': () => 'Loading',
					'pending-dot': () => <i class="custom-dot" />
				}}
			</Timeline>
		));
		const pending = wrapper.find('.is-pending');

		expect(pending.find('.vc-timeline-item__content').text()).toBe('Loading');
		expect(pending.find('.custom-dot').exists()).toBe(true);
		expect(pending.find('.vc-spin').exists()).toBe(false);
	});

	it('showPending + inverted: 幽灵节点在最前, 其余轴线保持原样', () => {
		const wrapper = mount(() => (
			<Timeline showPending inverted>
				<TimelineItem>A</TimelineItem>
				<TimelineItem>B</TimelineItem>
			</Timeline>
		));
		const list = items(wrapper);

		expect(list[0].classes()).toContain('is-pending');
		expect(list.map((item: any) => item.find('.vc-timeline-item__line').classes('is-dashed'))).toEqual([true, false, false]);
	});

	it('dotColor / dotType', () => {
		const wrapper = mount(() => (
			<Timeline>
				<TimelineItem dotColor="red">A</TimelineItem>
				<TimelineItem dotColor="red" dotType="hollow">B</TimelineItem>
				<TimelineItem>C</TimelineItem>
			</Timeline>
		));
		const [solid, hollow, normal] = wrapper.findAll('.vc-timeline-item__dot');

		// 实心为背景色、空心为边框色，均通过 currentColor 取 color
		expect(solid.classes()).toContain('is-solid');
		expect(solid.attributes('style')).toContain('color: red');
		expect(hollow.classes()).toContain('is-hollow');
		expect(hollow.attributes('style')).toContain('color: red');
		expect(normal.attributes('style')).toBeUndefined();
	});

	it('lineType / lineColor', () => {
		const wrapper = mount(() => (
			<Timeline>
				<TimelineItem lineType="dotted" lineColor="green">A</TimelineItem>
				<TimelineItem>B</TimelineItem>
			</Timeline>
		));
		const [dotted, solid] = wrapper.findAll('.vc-timeline-item__line');

		expect(dotted.classes()).toContain('is-dotted');
		expect(dotted.attributes('style')).toContain('border-color: green');
		expect(solid.classes()).toContain('is-solid');
	});

	it('label: 字符串 / 函数 / 插槽优先 / 为空时不渲染', () => {
		const wrapper = mount(() => (
			<Timeline>
				<TimelineItem label="<b>html</b>">A</TimelineItem>
				<TimelineItem label={() => h('i', 'fn')}>B</TimelineItem>
				<TimelineItem label="prop">
					{{
						default: () => 'C',
						label: () => <span class="slot-label">slot</span>
					}}
				</TimelineItem>
				<TimelineItem>D</TimelineItem>
			</Timeline>
		));
		const labels = items(wrapper).map((item: any) => item.find('.vc-timeline-item__label'));

		expect(labels[0].find('b').text()).toBe('html');
		expect(labels[1].find('i').text()).toBe('fn');
		expect(labels[2].find('.slot-label').exists()).toBe(true);
		expect(labels[2].text()).toBe('slot');
		expect(labels[3].exists()).toBe(false);
	});

	it('dot: 字符串 / 函数 / 插槽优先, 设置后不渲染默认节点', () => {
		const wrapper = mount(() => (
			<Timeline>
				<TimelineItem dot="<b>✓</b>" dotColor="red">A</TimelineItem>
				<TimelineItem dot={() => h('i', { class: 'fn-dot' })}>B</TimelineItem>
				<TimelineItem dot="prop">
					{{
						default: () => 'C',
						dot: () => <span class="slot-dot" />
					}}
				</TimelineItem>
			</Timeline>
		));
		const list = items(wrapper);

		expect(wrapper.find('.vc-timeline-item__dot').exists()).toBe(false);
		expect(list[0].find('.vc-timeline-item__dot-custom b').text()).toBe('✓');
		expect(list[1].find('.vc-timeline-item__dot-custom .fn-dot').exists()).toBe(true);
		expect(list[2].find('.vc-timeline-item__dot-custom .slot-dot').exists()).toBe(true);
		expect(list[2].find('.vc-timeline-item__dot-custom').text()).toBe('');
	});

	it('TimelineItem: 无默认插槽时不渲染内容, 可脱离 Timeline 使用', () => {
		const wrapper = mount(() => (<TimelineItem label="a" />));

		expect(wrapper.classes()).toEqual(['vc-timeline-item']);
		expect(wrapper.attributes('role')).toBe('listitem');
		expect(wrapper.find('.vc-timeline-item__content').exists()).toBe(false);
		expect(wrapper.find('.vc-timeline-item__label').text()).toBe('a');
	});
});
