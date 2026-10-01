// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { enUS, zhCN } from '@deot/vc-locale';
import { ColorPicker } from '..';
import { MColorPicker } from '../index.m';
import { Portal } from '../../portal';
import { VcInstance } from '../../vc';

const originalLocale = VcInstance.options.locale;
afterEach(() => {
	Portal.clear(true);
	VcInstance.configure({ locale: originalLocale });
	document.body.innerHTML = '';
});

describe('ColorPicker locale', () => {
	it('keeps action keys and string leaves aligned', () => {
		const zh = zhCN.vc.ColorPicker as Record<string, string>;
		const en = enUS.vc.ColorPicker as Record<string, string>;
		expect(Object.keys(zh)).toEqual(Object.keys(en));
		for (const key of Object.keys(zh)) {
			expect(typeof zh[key]).toBe('string');
			expect(typeof en[key]).toBe('string');
		}
	});

	it.each([ColorPicker, MColorPicker])('updates open panel actions when locale changes', async (component) => {
		VcInstance.configure({ locale: zhCN });
		const wrapper = mount(component, { attachTo: document.body });
		try {
			await wrapper.trigger('click');
			await nextTick();
			await new Promise(resolve => setTimeout(resolve, 0));
			await nextTick();
			const actions = () => Array.from(document.querySelectorAll('.vc-color-picker__confirm button'))
				.map(button => button.textContent?.trim());
			expect(actions()).toEqual(['清空', '确定']);
			VcInstance.configure({ locale: enUS });
			await nextTick();
			expect(actions()).toEqual(['Clear', 'OK']);
			VcInstance.configure({ locale: zhCN });
			await nextTick();
			expect(actions()).toEqual(['清空', '确定']);
		} finally {
			wrapper.unmount();
		}
	});
});
