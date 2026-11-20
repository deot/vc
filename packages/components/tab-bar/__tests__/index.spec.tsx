// @vitest-environment jsdom

import { MTabBar, MTabBarItem, TabBar, TabBarItem, VcInstance } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref, h } from 'vue';
import { vi } from 'vitest';

const flush = async () => {
	await nextTick();
	await nextTick();
};

const data = [
	{ value: 'home', label: '首页', icon: 'grid' },
	{ value: 'message', label: '消息', icon: 'notice' },
	{ value: 'mine', label: '我的', icon: 'account' }
];

const items = (wrapper: any) => wrapper.findAll('.vcm-tab-bar__item');
const activeIndex = (wrapper: any) => items(wrapper).findIndex((item: any) => item.classes('is-active'));

describe('tab-bar', () => {
	it('create', async () => {
		expect(TabBar).toBe(MTabBar);
		expect(TabBarItem).toBe(MTabBarItem);

		const wrapper = mount(() => <MTabBar data={data} />);
		await flush();
		expect(wrapper.classes()).toContain('vcm-tab-bar');
		expect(wrapper.find('.vcm-tab-bar__wrapper').attributes('role')).toBe('tablist');
		expect(items(wrapper)).toHaveLength(3);
		// 未传 v-model 时第一项选中
		expect(activeIndex(wrapper)).toBe(0);
		expect(items(wrapper)[0].attributes('aria-selected')).toBe('true');
		expect(items(wrapper)[0].find('.vcm-tab-bar__icon .vc-icon').exists()).toBe(true);
		expect(items(wrapper)[0].find('.vcm-tab-bar__label').text()).toBe('首页');
	});

	it('data and children render the same DOM', async () => {
		const byData = mount(() => <MTabBar modelValue="message" data={data} />);
		const byChildren = mount(() => (
			<MTabBar modelValue="message">
				{ data.map(item => <MTabBarItem key={item.value} {...item} />) }
			</MTabBar>
		));
		await flush();
		expect(byChildren.html()).toBe(byData.html());
		expect(activeIndex(byData)).toBe(1);
	});

	it('extra data fields stay off the DOM, slots get the raw item', async () => {
		const label = vi.fn(({ item }) => item.path);
		const wrapper = mount(() => (
			<MTabBar data={[{ value: 1, path: '/a' }, { value: 2, path: '/b' }]} v-slots={{ label }} />
		));
		await flush();
		expect(wrapper.html()).not.toContain('path=');
		expect(items(wrapper)[1].find('.vcm-tab-bar__label').text()).toBe('/b');
		expect(label).toHaveBeenCalledWith(expect.objectContaining({ index: 1, active: false }), expect.anything());
	});

	it('v-model, change and click', async () => {
		const value = ref('home');
		const onChange = vi.fn();
		const onClick = vi.fn();
		const wrapper = mount(() => (
			<MTabBar
				v-model={value.value}
				data={data}
				onChange={onChange}
				onClick={onClick}
			/>
		));
		await flush();

		await items(wrapper)[2].trigger('click');
		expect(value.value).toBe('mine');
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenLastCalledWith('mine');
		expect(onClick).toHaveBeenLastCalledWith('mine');
		expect(activeIndex(wrapper)).toBe(2);

		// 重复点击当前项：只触发 click
		await items(wrapper)[2].trigger('click');
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onClick).toHaveBeenCalledTimes(2);

		// 外部改值
		value.value = 'message';
		await flush();
		expect(activeIndex(wrapper)).toBe(1);
	});

	it('value falls back to index (children, v-if)', async () => {
		const visible = ref(false);
		const value = ref(1);
		const wrapper = mount(() => (
			<MTabBar v-model={value.value}>
				<MTabBarItem label="a" />
				{ visible.value && <MTabBarItem label="b" /> }
				<MTabBarItem label="c" />
			</MTabBar>
		));
		await flush();
		expect(items(wrapper)[1].text()).toBe('c');
		expect(activeIndex(wrapper)).toBe(1);

		// 中间插入后按 DOM 顺序重新编号
		visible.value = true;
		await flush();
		expect(items(wrapper)[1].text()).toBe('b');
		expect(activeIndex(wrapper)).toBe(1);

		await items(wrapper)[2].trigger('click');
		expect(value.value).toBe(2);

		// 移除后后面的项前移
		visible.value = false;
		await flush();
		expect(items(wrapper)).toHaveLength(2);
		expect(items(wrapper)[1].text()).toBe('c');
		expect(activeIndex(wrapper)).toBe(-1);
	});

	it('item without MTabBar', async () => {
		const onClick = vi.fn();
		const wrapper = mount(() => <MTabBarItem label="a" icon="grid" onClick={onClick} />);
		await flush();
		expect(wrapper.classes()).toContain('vcm-tab-bar__item');
		expect(wrapper.classes()).not.toContain('is-active');
		await wrapper.trigger('click');
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('icon, activeIcon and label only', async () => {
		const wrapper = mount(() => (
			<MTabBar
				data={[
					{ value: 0, label: 'a', icon: 'grid', activeIcon: 'star' },
					{ value: 1, label: 'b', icon: () => h('img', { src: 'x.png' }) },
					{ value: 2, label: 'c' }
				]}
			/>
		));
		await flush();
		const icon = wrapper.findComponent({ name: 'vcm-icon' });
		expect(icon.props('type')).toBe('star');
		expect(items(wrapper)[1].find('.vcm-tab-bar__icon > img').exists()).toBe(true);
		expect(items(wrapper)[2].classes()).toContain('is-label-only');
		expect(items(wrapper)[2].find('.vcm-tab-bar__icon').exists()).toBe(false);

		await items(wrapper)[1].trigger('click');
		expect(wrapper.findComponent({ name: 'vcm-icon' }).props('type')).toBe('grid');
	});

	it('badge', async () => {
		const wrapper = mount(() => (
			<MTabBar
				data={[
					{ label: 'a', icon: 'grid', badge: 128 },
					{ label: 'b', icon: 'grid', badge: true },
					{ label: 'c', icon: 'grid', badge: { value: 'new', color: 'red' } },
					{ label: 'd', badge: true },
					{ label: 'e', icon: 'grid' }
				]}
			/>
		));
		await flush();
		const list = items(wrapper);
		expect(list[0].find('.vcm-tab-bar__icon .vc-badge__value').text()).toBe('99+');
		expect(list[1].find('.vcm-tab-bar__icon .vc-badge__dot').exists()).toBe(true);
		expect(list[2].find('.vc-badge__value').text()).toBe('new');
		expect(list[2].find('.vc-badge__value').attributes('style')).toContain('red');
		// 只有文字时，徽标挂在文字上
		expect(list[3].find('.vcm-tab-bar__label.vc-badge .vc-badge__dot').exists()).toBe(true);
		expect(list[4].find('.vc-badge__value, .vc-badge__dot').exists()).toBe(false);
	});

	it('disabled', async () => {
		const onChange = vi.fn();
		const onClick = vi.fn();
		const wrapper = mount(() => (
			<MTabBar onChange={onChange}>
				<MTabBarItem label="a" />
				<MTabBarItem label="b" disabled onClick={onClick} />
			</MTabBar>
		));
		await flush();
		expect(items(wrapper)[1].classes()).toContain('is-disabled');
		expect(items(wrapper)[1].attributes('aria-disabled')).toBe('true');
		await items(wrapper)[1].trigger('click');
		expect(onChange).not.toHaveBeenCalled();
		expect(onClick).not.toHaveBeenCalled();
	});

	it('custom item slot', async () => {
		const wrapper = mount(() => (
			<MTabBar
				data={data}
				v-slots={{ item: ({ item, active }: any) => <b>{ `${item.label}${active ? '*' : ''}` }</b> }}
			>
			</MTabBar>
		));
		await flush();
		expect(items(wrapper).map((item: any) => item.text())).toEqual(['首页*', '消息', '我的']);
		expect(wrapper.find('.vcm-tab-bar__label').exists()).toBe(false);

		// 子组件自己的插槽优先
		const children = mount(() => (
			<MTabBar v-slots={{ label: () => 'parent' }}>
				<MTabBarItem label="a" />
				<MTabBarItem v-slots={{ label: () => 'own' }} />
			</MTabBar>
		));
		await flush();
		expect(items(children).map((item: any) => item.text())).toEqual(['parent', 'own']);
	});

	it('to', async () => {
		const open = vi.spyOn(window, 'open').mockImplementation(() => null);
		const fn = vi.fn();
		const wrapper = mount(() => (
			<MTabBar
				data={[
					{ value: 'a', label: 'a', to: fn },
					{ value: 'b', label: 'b', to: 'https://example.com' },
					{ value: 'c', label: 'c', to: '/c' }
				]}
			/>
		));
		await flush();

		// 当前项不跳转
		await items(wrapper)[0].trigger('click');
		expect(fn).not.toHaveBeenCalled();

		await items(wrapper)[1].trigger('click');
		expect(open).toHaveBeenCalledWith('https://example.com');

		await items(wrapper)[0].trigger('click');
		expect(fn).toHaveBeenCalledTimes(1);

		// 全局钩子接管
		const hook = vi.fn(({ value }) => value);
		VcInstance.configure({ MTabBar: { to: hook } });
		await items(wrapper)[2].trigger('click');
		expect(hook).toHaveBeenCalledWith(expect.objectContaining({ value: '/c' }));
		expect(hook.mock.calls[0][0].instance.type.name).toBe('vcm-tab-bar-item');

		// 返回 undefined 时继续默认处理
		hook.mockImplementation(() => undefined);
		await items(wrapper)[1].trigger('click');
		expect(open).toHaveBeenCalledTimes(2);

		VcInstance.configure({ MTabBar: undefined });
		open.mockRestore();
	});

	it('fixed, placeholder and safeArea', async () => {
		const props = ref<Record<string, any>>({});
		const wrapper = mount(() => <MTabBar data={data} {...props.value} />);
		await flush();
		expect(wrapper.classes()).not.toContain('is-fixed');
		expect(wrapper.classes()).not.toContain('is-safe-area');

		props.value = { fixed: true, zIndex: 20 };
		await flush();
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-fixed', 'is-placeholder', 'is-safe-area']));
		expect(wrapper.find('.vcm-tab-bar__wrapper').attributes('style')).toContain('z-index: 20');

		props.value = { fixed: true, placeholder: false, safeArea: false };
		await flush();
		expect(wrapper.classes()).toContain('is-fixed');
		expect(wrapper.classes()).not.toContain('is-placeholder');
		expect(wrapper.classes()).not.toContain('is-safe-area');

		// 不固定时也可单独开启安全区
		props.value = { safeArea: true, zIndex: 20 };
		await flush();
		expect(wrapper.classes()).toContain('is-safe-area');
		expect(wrapper.find('.vcm-tab-bar__wrapper').attributes('style')).toBeUndefined();
	});
});
