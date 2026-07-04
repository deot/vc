// @vitest-environment jsdom

import { Collapse, CollapseItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const flush = async () => {
	for (let i = 0; i < 5; i++) {
		await nextTick();
		await Promise.resolve();
	}
};

// Collapse 内部值只在 modelValue 有值时初始化, 且推荐通过 change 事件回写 modelValue,
// 故交互用例统一使用带状态的宿主组件模拟真实的受控用法。
// @vue/test-utils 默认会 stub 过渡组件, vShow + transition 不会同步写入 display,
// 因此展开状态统一通过 icon 插槽暴露的 visible(即 item 的 isActive)进行断言。
const mountStateful = (template: string, value: any) => {
	const changes: any[] = [];
	const wrapper = mount({
		components: { Collapse, CollapseItem },
		data() {
			return { value };
		},
		methods: {
			onChange(v: any) {
				changes.push(Array.isArray(v) ? v.slice() : v);
				(this as any).value = Array.isArray(v) ? v.slice() : v;
			}
		},
		template
	});
	return { wrapper, changes };
};

const visibles = (wrapper: any) => wrapper.findAll('.icon').map((v: any) => v.text());

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Collapse).toBe('object');
		expect(typeof CollapseItem).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Collapse />));

		expect(wrapper.classes()).toContain('vc-collapse');
	});

	it('tag: 使用自定义标签渲染', () => {
		const wrapper = mount(() => (<Collapse tag="section" />));

		expect(wrapper.element.tagName).toBe('SECTION');
	});

	it('styleless: 不添加默认类名', () => {
		const wrapper = mount(() => (
			<Collapse styleless>
				<CollapseItem value={1} v-slots={{ default: () => 'title1' }} />
			</Collapse>
		));

		expect(wrapper.classes()).not.toContain('vc-collapse');
		expect(wrapper.find('.vc-collapse-item').exists()).toBe(false);
	});

	it('CollapseItem: 渲染标题与内容', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={[1]}>
				<CollapseItem
					value={1}
					v-slots={{
						default: () => (<div class="title">title1</div>),
						content: () => (<div class="content">content1</div>)
					}}
				/>
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.vc-collapse-item').exists()).toBe(true);
		expect(wrapper.find('.vc-collapse-item__title').exists()).toBe(true);
		expect(wrapper.find('.title').text()).toBe('title1');
		expect(wrapper.find('.content').text()).toBe('content1');
	});

	it('modelValue: 默认展开指定项', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={[1]}>
				<CollapseItem
					value={1}
					v-slots={{
						default: () => 'title1',
						content: () => (<div class="content1">content1</div>)
					}}
				/>
				<CollapseItem
					value={2}
					v-slots={{
						default: () => 'title2',
						content: () => (<div class="content2">content2</div>)
					}}
				/>
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.content1').isVisible()).toBe(true);
		expect(wrapper.find('.content2').isVisible()).toBe(false);
	});

	it('icon: 插槽接收 visible 状态', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={[1]}>
				<CollapseItem
					value={1}
					v-slots={{
						default: () => 'title1',
						icon: ({ visible }: any) => (<span class="icon1">{String(visible)}</span>),
						content: () => 'content1'
					}}
				/>
				<CollapseItem
					value={2}
					v-slots={{
						default: () => 'title2',
						icon: ({ visible }: any) => (<span class="icon2">{String(visible)}</span>),
						content: () => 'content2'
					}}
				/>
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.icon1').text()).toBe('true');
		expect(wrapper.find('.icon2').text()).toBe('false');
	});

	it('click: 点击标题展开并触发 change', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content1</template>
				</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		expect(visibles(wrapper)).toEqual(['false']);

		await wrapper.find('.vc-collapse-item__title').trigger('click');
		await flush();

		expect(changes.at(-1)).toEqual([1]);
		expect(visibles(wrapper)).toEqual(['true']);
	});

	it('click: 再次点击标题收起', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content1</template>
				</CollapseItem>
			</Collapse>
		`, [1]);
		await flush();

		expect(visibles(wrapper)).toEqual(['true']);

		await wrapper.find('.vc-collapse-item__title').trigger('click');
		await flush();

		expect(changes.at(-1)).toEqual([]);
		expect(visibles(wrapper)).toEqual(['false']);
	});

	it('多项: 可同时展开多个', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content1</template>
				</CollapseItem>
				<CollapseItem :value="2">
					title2
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content2</template>
				</CollapseItem>
			</Collapse>
		`, [1]);
		await flush();

		await wrapper.findAll('.vc-collapse-item__title')[1].trigger('click');
		await flush();

		expect(changes.at(-1)).toEqual([1, 2]);
		expect(visibles(wrapper)).toEqual(['true', 'true']);
	});

	it('accordion: 手风琴模式仅展开一项', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse accordion :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content1</template>
				</CollapseItem>
				<CollapseItem :value="2">
					title2
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content2</template>
				</CollapseItem>
			</Collapse>
		`, 1);
		await flush();

		expect(visibles(wrapper)).toEqual(['true', 'false']);

		await wrapper.findAll('.vc-collapse-item__title')[1].trigger('click');
		await flush();

		expect(changes.at(-1)).toBe(2);
		expect(visibles(wrapper)).toEqual(['false', 'true']);
	});

	it('value: 未指定时按索引自动分配', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :model-value="value" @change="onChange">
				<CollapseItem>
					title0
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content0</template>
				</CollapseItem>
				<CollapseItem>
					title1
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content1</template>
				</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		await wrapper.findAll('.vc-collapse-item__title')[1].trigger('click');
		await flush();

		expect(changes.at(-1)).toEqual([1]);
		expect(visibles(wrapper)).toEqual(['false', 'true']);
	});

	it('alive: 为 false 时收起不渲染内容', async () => {
		const { wrapper } = mountStateful(`
			<Collapse :alive="false" :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #content><div class="content1">content1</div></template>
				</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		expect(wrapper.find('.content1').exists()).toBe(false);

		await wrapper.find('.vc-collapse-item__title').trigger('click');
		await flush();

		expect(wrapper.find('.content1').exists()).toBe(true);
	});

	it('modelValue: 响应式更新展开项', async () => {
		const { wrapper } = mountStateful(`
			<Collapse :model-value="value">
				<CollapseItem :value="1">
					title1
					<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content1</template>
				</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		expect(visibles(wrapper)).toEqual(['false']);

		(wrapper.vm as any).value = [1];
		await flush();

		expect(visibles(wrapper)).toEqual(['true']);
	});

	it('modelValue: 非手风琴且传入非数组时视为全部收起', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={1}>
				<CollapseItem
					value={1}
					v-slots={{
						default: () => 'title1',
						icon: ({ visible }: any) => (<span class="icon">{String(visible)}</span>),
						content: () => 'content1'
					}}
				/>
			</Collapse>
		));
		await flush();

		expect(visibles(wrapper)).toEqual(['false']);
	});

	it('accordion: modelValue 传入数组', async () => {
		const wrapper = mount(() => (
			<Collapse accordion modelValue={[2]}>
				<CollapseItem
					value={1}
					v-slots={{
						default: () => 'title1',
						icon: ({ visible }: any) => (<span class="icon">{String(visible)}</span>),
						content: () => 'content1'
					}}
				/>
				<CollapseItem
					value={2}
					v-slots={{
						default: () => 'title2',
						icon: ({ visible }: any) => (<span class="icon">{String(visible)}</span>),
						content: () => 'content2'
					}}
				/>
			</Collapse>
		));
		await flush();

		expect(visibles(wrapper)).toEqual(['false', 'true']);
	});

	it('accordion: 未传 modelValue 时默认全部收起', async () => {
		const wrapper = mount(() => (
			<Collapse accordion>
				<CollapseItem
					value={1}
					v-slots={{
						default: () => 'title1',
						icon: ({ visible }: any) => (<span class="icon">{String(visible)}</span>),
						content: () => 'content1'
					}}
				/>
			</Collapse>
		));
		await flush();

		expect(visibles(wrapper)).toEqual(['false']);
	});

	it('嵌套结构: 被包裹且未指定 value 时按索引注册', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :model-value="value" @change="onChange">
				<div class="wrap">
					<CollapseItem>
						title0
						<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
						<template #content>content0</template>
					</CollapseItem>
				</div>
			</Collapse>
		`, []);
		await flush();

		await wrapper.find('.vc-collapse-item__title').trigger('click');
		await flush();

		expect(changes.at(-1)).toEqual([0]);
		expect(visibles(wrapper)).toEqual(['true']);
	});

	it('动态增删: 移除项后剩余项按索引重排', async () => {
		const changes: any[] = [];
		const wrapper = mount({
			components: { Collapse, CollapseItem },
			data() {
				return { value: [] as number[], show: true };
			},
			methods: {
				onChange(v: any) {
					changes.push(Array.isArray(v) ? v.slice() : v);
					(this as any).value = Array.isArray(v) ? v.slice() : v;
				}
			},
			template: `
				<Collapse :model-value="value" @change="onChange">
					<CollapseItem v-if="show">
						first
						<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
						<template #content>content0</template>
					</CollapseItem>
					<CollapseItem>
						second
						<template #icon="{ visible }"><span class="icon">{{ visible }}</span></template>
						<template #content>content1</template>
					</CollapseItem>
				</Collapse>
			`
		});
		await flush();

		expect(wrapper.findAll('.vc-collapse-item').length).toBe(2);

		(wrapper.vm as any).show = false;
		await flush();

		expect(wrapper.findAll('.vc-collapse-item').length).toBe(1);

		// 剩余项仍保留其挂载时分配的索引(1), 点击后仍可正常触发 change
		await wrapper.find('.vc-collapse-item__title').trigger('click');
		await flush();

		expect(changes.at(-1)).toEqual([1]);
	});
});
