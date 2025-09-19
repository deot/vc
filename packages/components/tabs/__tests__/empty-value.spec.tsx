import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { Tabs, TabsPane } from '../index';

describe('Tabs组件空字符串value测试', () => {
	beforeEach(() => {
		// 在每个测试前重置环境
	});

	afterEach(() => {
		// 在每个测试后清理环境
	});

	it('Tabs组件支持modelValue为空字符串', async () => {
		const wrapper = mount(Tabs, {
			props: {
				modelValue: ''
			},
			slots: {
				default: () => [
					<TabsPane value="">空标签页</TabsPane>,
					<TabsPane value="normal">普通标签页</TabsPane>
				]
			}
		});

		// 验证空字符串标签页被激活
		const activeTab = wrapper.find('.vc-tabs__item.is-active');
		expect(activeTab.text()).toBe('空标签页');
	});

	it('TabsPane组件支持value为空字符串', async () => {
		const wrapper = mount(Tabs, {
			props: {
				modelValue: ''
			},
			slots: {
				default: () => [
					<TabsPane value="">空标签页</TabsPane>,
					<TabsPane value="normal">普通标签页</TabsPane>
				]
			}
		});

		// 验证空字符串标签页被激活
		const activeTab = wrapper.find('.vc-tabs__item.is-active');
		expect(activeTab.text()).toBe('空标签页');
	});

	it('切换到空字符串value的标签页', async () => {
		const wrapper = mount(Tabs, {
			props: {
				modelValue: 'normal'
			},
			slots: {
				default: () => [
					<TabsPane value="">空标签页</TabsPane>,
					<TabsPane value="normal">普通标签页</TabsPane>
				]
			}
		});

		// 初始状态，普通标签页应该被激活
		expect(wrapper.find('.vc-tabs__item.is-active').text()).toBe('普通标签页');

		// 点击空字符串标签页
		await wrapper.findAll('.vc-tabs__item')[0].trigger('click');

		// 验证空字符串标签页被激活
		expect(wrapper.find('.vc-tabs__item.is-active').text()).toBe('空标签页');
		expect(wrapper.vm.modelValue).toBe('');
	});

	it('从空字符串value切换到其他标签页', async () => {
		const wrapper = mount(Tabs, {
			props: {
				modelValue: ''
			},
			slots: {
				default: () => [
					<TabsPane value="">空标签页</TabsPane>,
					<TabsPane value="normal">普通标签页</TabsPane>
				]
			}
		});

		// 初始状态，空字符串标签页应该被激活
		expect(wrapper.find('.vc-tabs__item.is-active').text()).toBe('空标签页');

		// 点击普通标签页
		await wrapper.findAll('.vc-tabs__item')[1].trigger('click');

		// 验证普通标签页被激活
		expect(wrapper.find('.vc-tabs__item.is-active').text()).toBe('普通标签页');
		expect(wrapper.vm.modelValue).toBe('normal');
	});

	it('多个空字符串value的标签页', async () => {
		const wrapper = mount(Tabs, {
			props: {
				modelValue: ''
			},
			slots: {
				default: () => [
					<TabsPane value="">第一个空标签页</TabsPane>,
					<TabsPane value="normal">普通标签页</TabsPane>,
					<TabsPane value="">第二个空标签页</TabsPane>
				]
			}
		});

		// 初始状态，第一个空字符串标签页应该被激活
		expect(wrapper.find('.vc-tabs__item.is-active').text()).toBe('第一个空标签页');

		// 点击第二个空字符串标签页
		await wrapper.findAll('.vc-tabs__item')[2].trigger('click');

		// 验证第二个空字符串标签页被激活
		expect(wrapper.find('.vc-tabs__item.is-active').text()).toBe('第二个空标签页');
		expect(wrapper.vm.modelValue).toBe('');
	});

	it('未指定value时使用索引，且支持空字符串value', async () => {
		const wrapper = mount(Tabs, {
			props: {
				modelValue: 0 // 第一个标签页
			},
			slots: {
				default: () => [
					<TabsPane>默认标签页</TabsPane>,
					<TabsPane value="">空字符串标签页</TabsPane>,
					<TabsPane>第三个标签页</TabsPane>
				]
			}
		});

		// 初始状态，第一个标签页应该被激活
		expect(wrapper.find('.vc-tabs__item.is-active').text()).toBe('默认标签页');

		// 点击空字符串标签页
		await wrapper.findAll('.vc-tabs__item')[1].trigger('click');

		// 验证空字符串标签页被激活
		expect(wrapper.find('.vc-tabs__item.is-active').text()).toBe('空字符串标签页');
		expect(wrapper.vm.modelValue).toBe('');
	});
});
