// @vitest-environment jsdom

import { nextTick, ref } from 'vue';
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

	it('icon waiting, unmount removes pending listener', () => {
		const type = 'any-unmount-need-wait';

		expect(() => {
			Array.from({ length: 150 }).forEach(() => {
				const wrapper = mount(() => (
					<Icon type={type} />
				));
				expect(IconManager.events[type].length).toBe(1);
				wrapper.unmount();
			});
		}).not.toThrow();

		expect(IconManager.events[type].length).toBe(0);
	});

	it('icon waiting, type changed removes pending listener', async () => {
		const waiting = 'any-changed-need-wait';
		const loaded = 'any-changed-loaded';
		IconManager.icons[loaded] = { viewBox: '0 0 24 24', path: [] };

		const icon = ref(waiting);
		const wrapper = mount(() => (
			<Icon type={icon.value} />
		));
		expect(IconManager.events[waiting].length).toBe(1);

		icon.value = '';
		await nextTick();
		expect(IconManager.events[waiting].length).toBe(0);

		icon.value = waiting;
		await nextTick();
		expect(IconManager.events[waiting].length).toBe(1);

		icon.value = loaded;
		await nextTick();
		expect(IconManager.events[waiting].length).toBe(0);
		expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 24 24');

		wrapper.unmount();
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
