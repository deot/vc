// @vitest-environment jsdom

import { ref } from 'vue';
import { Icon, IconManager } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Icon).toBe('object');
	});

	it('create', async () => {
		await IconManager.basicStatus;
		const wrapper = mount(() => (
			<Icon
				type="search"
				inherit
			/>
		));

		expect(wrapper.classes()).toContain('vc-icon');
	});

	it('empty', async () => {
		const wrapper = mount(() => (
			<Icon />
		));

		expect(wrapper.classes()).toContain('vc-icon');
	});

	it('icon waiting, coverage', async () => {
		const wrapper = mount(() => (
			<Icon type="any-need-wait" />
		));

		expect(wrapper.classes()).toContain('vc-icon');
	});

	it('click, changed', async () => {
		let count = 0;
		const icon = ref('search');
		const handler = () => {
			count++;
			icon.value += '-';
		};

		const wrapper = mount(() => (
			<Icon
				type={icon.value}
				// @ts-ignore
				onClick={handler}
			/>
		));

		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');

		await Utils.sleep(10);

		expect(count).toBe(3);
	});

	it('IconManager, load', async () => {
		expect.assertions(1);
		try {
			await IconManager.load('any empty');
		} catch (e: any) {
			expect(e.message).toMatch('invaild url');
		}
	});

	it('IconManager, on/off', async () => {
		expect.assertions(2);
		expect(IconManager.icons['q-complete-1']).toBeFalsy();

		IconManager.on('q-complete-1', () => {});

		await IconManager.load('//at.alicdn.com/t/font_1169912_ith92i2hims.js');
		expect(IconManager.icons['q-complete-1']).toBeTruthy();
	});

	it('IconManager, on/off, maxLimit', async () => {
		expect.assertions(1);
		try {
			Array.from({ length: 101 }).forEach(() => {
				IconManager.on('any', () => {});
			});
		} catch (e: any) {
			expect(e.message).toMatch('any nonexistent');
		}
	});
});
