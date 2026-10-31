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
// 因此展开状态统一通过 extra 插槽暴露的 visible(即 item 的 isActive)进行断言。
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
	it('v-model: 手风琴切换及收起时同步父级状态', async () => {
		const wrapper = mount({
			components: { Collapse, CollapseItem },
			data: () => ({ value: 1 as number | undefined }),
			template: `
				<Collapse v-model="value" accordion>
					<CollapseItem :value="1">title1</CollapseItem>
					<CollapseItem :value="2">title2</CollapseItem>
				</Collapse>
			`
		});
		await flush();
		const title = wrapper.findAll('.vc-collapse-item__title')[1];
		await title.trigger('click');
		await flush();
		expect(wrapper.vm.value).toBe(2);
		await title.trigger('click');
		await flush();
		expect(wrapper.vm.value).toBeUndefined();
		expect(wrapper.findComponent(Collapse).emitted('update:modelValue')).toEqual([[2], [undefined]]);
	});

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

	it('extra: 插槽接收 visible 状态', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={[1]}>
				<CollapseItem
					value={1}
					v-slots={{
						default: () => 'title1',
						extra: ({ visible }: any) => (<span class="icon1">{String(visible)}</span>),
						content: () => 'content1'
					}}
				/>
				<CollapseItem
					value={2}
					v-slots={{
						default: () => 'title2',
						extra: ({ visible }: any) => (<span class="icon2">{String(visible)}</span>),
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
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
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
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
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
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content1</template>
				</CollapseItem>
				<CollapseItem :value="2">
					title2
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
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
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content1</template>
				</CollapseItem>
				<CollapseItem :value="2">
					title2
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
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
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
					<template #content>content0</template>
				</CollapseItem>
				<CollapseItem>
					title1
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
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
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
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
						extra: ({ visible }: any) => (<span class="icon">{String(visible)}</span>),
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
						extra: ({ visible }: any) => (<span class="icon">{String(visible)}</span>),
						content: () => 'content1'
					}}
				/>
				<CollapseItem
					value={2}
					v-slots={{
						default: () => 'title2',
						extra: ({ visible }: any) => (<span class="icon">{String(visible)}</span>),
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
						extra: ({ visible }: any) => (<span class="icon">{String(visible)}</span>),
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
						<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
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
						<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
						<template #content>content0</template>
					</CollapseItem>
					<CollapseItem>
						second
						<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
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
	it('border: 默认带边框，border=false 时移除', () => {
		expect(mount(() => (<Collapse />)).classes()).toContain('is-border');
		expect(mount(() => (<Collapse border={false} />)).classes()).not.toContain('is-border');
		expect(mount(() => (<Collapse styleless />)).classes()).not.toContain('is-border');
	});

	it('disabled: 单项禁用时点击不切换', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :model-value="value" @change="onChange">
				<CollapseItem :value="1" disabled>
					title1
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
				<CollapseItem :value="2">
					title2
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		const items = wrapper.findAll('.vc-collapse-item');
		expect(items[0].classes()).toContain('is-disabled');
		expect(items[1].classes()).not.toContain('is-disabled');

		await wrapper.findAll('.vc-collapse-item__title')[0].trigger('click');
		await flush();
		expect(changes).toEqual([]);
		expect(visibles(wrapper)).toEqual(['false', 'false']);
	});

	it('disabled: Collapse 禁用时所有项不切换', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse disabled :model-value="value" @change="onChange">
				<CollapseItem :value="1">title1</CollapseItem>
				<CollapseItem :value="2">title2</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		expect(wrapper.findAll('.vc-collapse-item.is-disabled').length).toBe(2);
		await wrapper.findAll('.vc-collapse-item__title')[1].trigger('click');
		await flush();
		expect(changes).toEqual([]);
	});

	it('extra: 点击附加区域不切换', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		await wrapper.find('.icon').trigger('click');
		await flush();
		expect(changes).toEqual([]);
		expect(visibles(wrapper)).toEqual(['false']);
	});

	it('extra/title: 支持属性渲染', async () => {
		const wrapper = mount(() => (
			<Collapse>
				<CollapseItem value={1} title="标题" extra="附加" />
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.vc-collapse-item__title').text()).toBe('标题');
		expect(wrapper.find('.vc-collapse-item__extra').text()).toBe('附加');
	});

	it('arrow: 默认在左侧渲染内置箭头，激活时添加 is-active', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={[1]}>
				<CollapseItem value={1} v-slots={{ default: () => 'title1' }} />
				<CollapseItem value={2} v-slots={{ default: () => 'title2' }} />
			</Collapse>
		));
		await flush();

		const items = wrapper.findAll('.vc-collapse-item');
		expect(items[0].classes()).toContain('is-active');
		expect(items[1].classes()).not.toContain('is-active');

		const header = wrapper.find('.vc-collapse-item__header');
		expect(header.classes()).toContain('is-arrow-left');
		expect(header.element.firstElementChild!.className).toBe('vc-collapse-item__arrow');
	});

	it('arrow: left 时箭头位于标题之前，item 可覆盖', async () => {
		const wrapper = mount(() => (
			<Collapse arrow="left">
				<CollapseItem value={1} v-slots={{ default: () => 'title1' }} />
				<CollapseItem value={2} arrow={false} v-slots={{ default: () => 'title2' }} />
				<CollapseItem value={3} arrow="right" v-slots={{ default: () => 'title3' }} />
			</Collapse>
		));
		await flush();

		const headers = wrapper.findAll('.vc-collapse-item__header');
		expect(headers[0].element.firstElementChild!.className).toBe('vc-collapse-item__arrow');
		expect(headers[1].find('.vc-collapse-item__arrow').exists()).toBe(false);
		expect(headers[2].element.lastElementChild!.className).toBe('vc-collapse-item__arrow');
	});

	it('arrow: false 时不渲染，插槽可替换且 styleless 下仍生效', async () => {
		const hidden = mount(() => (
			<Collapse arrow={false}>
				<CollapseItem value={1} v-slots={{ default: () => 'title1' }} />
			</Collapse>
		));
		expect(hidden.find('.vc-collapse-item__arrow').exists()).toBe(false);

		const bare = mount(() => (
			<Collapse styleless>
				<CollapseItem value={1} v-slots={{ default: () => 'title1' }} />
			</Collapse>
		));
		expect(bare.find('.vc-icon').exists()).toBe(false);

		const custom = mount(() => (
			<Collapse styleless modelValue={[1]}>
				<CollapseItem
					value={1}
					v-slots={{
						default: () => 'title1',
						arrow: ({ visible }: any) => (<span class="custom-arrow">{String(visible)}</span>)
					}}
				/>
			</Collapse>
		));
		await flush();
		expect(custom.find('.custom-arrow').text()).toBe('true');
	});

	it('triggerRegion: arrow 时仅点击箭头切换', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse trigger-region="arrow" :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		await wrapper.find('.vc-collapse-item__title').trigger('click');
		await flush();
		expect(changes).toEqual([]);

		await wrapper.find('.vc-collapse-item__arrow').trigger('click');
		await flush();
		expect(changes.at(-1)).toEqual([1]);
		expect(visibles(wrapper)).toEqual(['true']);
	});

	it('alive: item 设置时覆盖 Collapse', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={[]}>
				<CollapseItem value={1} alive={false} v-slots={{ default: () => 'title1', content: () => (<div class="content1">content1</div>) }} />
				<CollapseItem value={2} v-slots={{ default: () => 'title2', content: () => (<div class="content2">content2</div>) }} />
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.content1').exists()).toBe(false);
		expect(wrapper.find('.content2').exists()).toBe(true);
	});
	it('default: 插槽接收 visible 状态', async () => {
		const wrapper = mount(() => (
			<Collapse styleless modelValue={[1]}>
				<CollapseItem value={1} v-slots={{ default: ({ visible }: any) => (<span class="head">{String(visible)}</span>) }} />
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.head').text()).toBe('true');
	});

	it('arrow: 内置箭头使用 triangle-up 图标', async () => {
		const wrapper = mount(() => (
			<Collapse>
				<CollapseItem value={1} v-slots={{ default: () => 'title1' }} />
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.vc-collapse-item__icon').exists()).toBe(true);
	});
	it('title/extra/content: 插槽优先于属性', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={[1]}>
				<CollapseItem
					value={1}
					title="title-prop"
					extra="extra-prop"
					content="content-prop"
					v-slots={{
						default: () => 'title-slot',
						extra: () => 'extra-slot',
						content: () => 'content-slot'
					}}
				/>
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.vc-collapse-item__title').text()).toBe('title-slot');
		expect(wrapper.find('.vc-collapse-item__extra').text()).toBe('extra-slot');
		expect(wrapper.find('.vc-collapse-item__content').text()).toBe('content-slot');
	});

	it('title/extra/content: 渲染函数属性接收 visible', async () => {
		const render = (name: string) => ({ visible }: any) => `${name}:${visible}`;
		const wrapper = mount(() => (
			<Collapse modelValue={[1]}>
				<CollapseItem value={1} title={render('title')} extra={render('extra')} content={render('content')} />
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.vc-collapse-item__title').text()).toBe('title:true');
		expect(wrapper.find('.vc-collapse-item__extra').text()).toBe('extra:true');
		expect(wrapper.find('.vc-collapse-item__content').text()).toBe('content:true');
	});

	it('content: 支持属性渲染', async () => {
		const wrapper = mount(() => (
			<Collapse modelValue={[1]}>
				<CollapseItem value={1} title="标题" content="内容" />
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.vc-collapse-item__content').text()).toBe('内容');
	});
	it('collapsible: 手风琴下始终保留一项展开', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse accordion :collapsible="false" :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
				<CollapseItem :value="2">
					title2
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
			</Collapse>
		`, 1);
		await flush();

		const titles = wrapper.findAll('.vc-collapse-item__title');
		await titles[0].trigger('click');
		await flush();
		expect(changes).toEqual([]);
		expect(visibles(wrapper)).toEqual(['true', 'false']);

		await titles[1].trigger('click');
		await flush();
		expect(changes.at(-1)).toBe(2);
		expect(visibles(wrapper)).toEqual(['false', 'true']);
	});

	it('collapsible: 普通模式下已展开项不能收起', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :collapsible="false" :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
				<CollapseItem :value="2">
					title2
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
			</Collapse>
		`, []);
		await flush();

		const titles = wrapper.findAll('.vc-collapse-item__title');
		await titles[0].trigger('click');
		await flush();
		await titles[0].trigger('click');
		await flush();
		await titles[1].trigger('click');
		await flush();

		expect(changes).toEqual([[1], [1, 2]]);
		expect(visibles(wrapper)).toEqual(['true', 'true']);
	});
	it('collapsible: item 设置为 false 时仅该项不能收起', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :model-value="value" @change="onChange">
				<CollapseItem :value="1" :collapsible="false">
					title1
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
				<CollapseItem :value="2">
					title2
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
			</Collapse>
		`, [1, 2]);
		await flush();

		const items = wrapper.findAll('.vc-collapse-item');
		expect(items[0].classes()).toContain('is-locked');
		expect(items[1].classes()).not.toContain('is-locked');

		const titles = wrapper.findAll('.vc-collapse-item__title');
		await titles[0].trigger('click');
		await flush();
		expect(changes).toEqual([]);

		await titles[1].trigger('click');
		await flush();
		expect(changes.at(-1)).toEqual([1]);
		expect(visibles(wrapper)).toEqual(['true', 'false']);
	});

	it('collapsible: item 设置为 true 时覆盖 Collapse', async () => {
		const { wrapper, changes } = mountStateful(`
			<Collapse :collapsible="false" :model-value="value" @change="onChange">
				<CollapseItem :value="1">
					title1
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
				<CollapseItem :value="2" :collapsible="true">
					title2
					<template #extra="{ visible }"><span class="icon">{{ visible }}</span></template>
				</CollapseItem>
			</Collapse>
		`, [1, 2]);
		await flush();

		const titles = wrapper.findAll('.vc-collapse-item__title');
		await titles[0].trigger('click');
		await flush();
		await titles[1].trigger('click');
		await flush();

		expect(changes).toEqual([[1]]);
		expect(visibles(wrapper)).toEqual(['true', 'false']);
	});

	it('collapsible: 收起状态不加 is-locked', async () => {
		const wrapper = mount(() => (
			<Collapse collapsible={false}>
				<CollapseItem value={1} v-slots={{ default: () => 'title1' }} />
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.vc-collapse-item').classes()).not.toContain('is-locked');
	});
	it('mousedown: 连续点击标题时阻止选中文字，单击与附加内容不阻止', async () => {
		const wrapper = mount(() => (
			<Collapse>
				<CollapseItem value={1} title="title1" extra="extra1" />
			</Collapse>
		));
		await flush();

		const press = (el: Element, detail: number) => {
			const e = new MouseEvent('mousedown', { bubbles: true, cancelable: true, detail });
			el.dispatchEvent(e);
			return e.defaultPrevented;
		};
		expect(press(wrapper.find('.vc-collapse-item__title').element, 1)).toBe(false);
		expect(press(wrapper.find('.vc-collapse-item__title').element, 2)).toBe(true);
		expect(press(wrapper.find('.vc-collapse-item__extra').element, 2)).toBe(false);
	});

	it('selection: 拖选标题文字后松开不切换', async () => {
		const changes: any[] = [];
		// 选区只对文档中的节点生效
		const wrapper = mount(() => (
			<Collapse modelValue={[]} onChange={(v: any) => changes.push(v.slice())}>
				<CollapseItem value={1} title="title1" />
			</Collapse>
		), { attachTo: document.body });
		await flush();

		const title = wrapper.find('.vc-collapse-item__title');
		const range = document.createRange();
		range.selectNodeContents(title.element);
		const selection = window.getSelection()!;
		selection.removeAllRanges();
		selection.addRange(range);

		await title.trigger('click');
		await flush();
		expect(changes).toEqual([]);

		selection.removeAllRanges();
		await title.trigger('click');
		await flush();
		expect(changes.at(-1)).toEqual([1]);
		wrapper.unmount();
	});
	it('headerStyle/headerClass/contentStyle/contentClass: 父子合并，样式以 item 为准', async () => {
		const wrapper = mount(() => (
			<Collapse
				modelValue={[1]}
				headerClass="h-parent"
				headerStyle={{ color: 'red', padding: '4px' }}
				contentClass="c-parent"
				contentStyle={{ background: 'red', margin: '2px' }}
			>
				<CollapseItem
					value={1}
					title="title1"
					content="content1"
					headerClass={{ 'h-child': true }}
					headerStyle="color: blue"
					contentClass="c-child"
					contentStyle={{ background: 'blue' }}
				/>
				<CollapseItem value={2} title="title2" />
			</Collapse>
		));
		await flush();

		const headers = wrapper.findAll('.vc-collapse-item__header');
		expect(headers[0].classes()).toEqual(expect.arrayContaining(['h-parent', 'h-child']));
		expect((headers[0].element as HTMLElement).style.color).toBe('blue');
		expect((headers[0].element as HTMLElement).style.padding).toBe('4px');
		expect(headers[1].classes()).toContain('h-parent');
		expect(headers[1].classes()).not.toContain('h-child');

		const content = wrapper.find('.vc-collapse-item__content');
		expect(content.classes()).toEqual(expect.arrayContaining(['c-parent', 'c-child']));
		expect((content.element as HTMLElement).style.background).toBe('blue');
		expect((content.element as HTMLElement).style.margin).toBe('2px');
	});

	it('headerClass/contentClass: styleless 下同样生效', async () => {
		const wrapper = mount(() => (
			<Collapse styleless modelValue={[1]} headerClass="head" contentClass="body">
				<CollapseItem value={1} title="title1" content="content1" />
			</Collapse>
		));
		await flush();

		expect(wrapper.find('.head').text()).toBe('title1');
		expect(wrapper.find('.body').text()).toBe('content1');
	});
});
