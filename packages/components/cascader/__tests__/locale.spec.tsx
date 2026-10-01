// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { zhCN, enUS } from '@deot/vc-locale';
import { VcInstance } from '../../vc';
import { Cascader } from '../index';
import { MCascader } from '../index.m';

describe('Cascader locale', () => {
	afterEach(() => {
		VcInstance.configure({ locale: zhCN });
	});

	it('keeps language keys and string leaves aligned', () => {
		expect(Object.keys(zhCN.vc.Cascader)).toEqual(Object.keys(enUS.vc.Cascader));
		for (const locale of [zhCN, enUS]) {
			expect(Object.values(locale.vc.Cascader).every(value => typeof value === 'string')).toBe(true);
		}
	});

	it('updates the default placeholder without emitting a value change', async () => {
		const wrapper = mount(Cascader);
		expect(wrapper.find('input').attributes('placeholder')).toBe('请选择');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('input').attributes('placeholder')).toBe('Please select');
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();
		wrapper.unmount();
	});

	it('preserves custom and explicitly empty placeholders across locale changes', async () => {
		const placeholder = ref('选择地区');
		const wrapper = mount(() => <Cascader placeholder={placeholder.value} />);
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('input').attributes('placeholder')).toBe('选择地区');
		placeholder.value = '';
		VcInstance.configure({ locale: zhCN });
		await nextTick();
		expect(wrapper.find('input').attributes('placeholder')).toBe('');
		wrapper.unmount();
	});

	it('uses the same reactive placeholder for the mobile alias', async () => {
		const wrapper = mount(MCascader);
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('input').attributes('placeholder')).toBe('Please select');
		wrapper.unmount();
	});
});
