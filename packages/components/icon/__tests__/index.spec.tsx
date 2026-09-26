// @vitest-environment jsdom

import { nextTick, ref } from 'vue';
import { Icon, IconManager } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { vi } from 'vitest';

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
		await IconManager.basicStatus;
		try {
			Array.from({ length: 101 }).forEach(() => {
				IconManager.on('any', () => {});
			});
		} catch (e: any) {
			expect(e.message).toMatch('any nonexistent');
		}
	});

	it('IconManager, maxLimit is skipped while icon sets are loading', async () => {
		await IconManager.basicStatus;
		const type = 'any-loading-need-wait';
		const fn = vi.fn();

		// 加载中：长列表首屏的大量等待不判定为不存在
		IconManager.loading++;
		try {
			expect(() => {
				Array.from({ length: 150 }).forEach(() => IconManager.on(type, fn));
			}).not.toThrow();
			expect(IconManager.events[type].length).toBe(150);
		} finally {
			IconManager.loading--;
		}

		// 加载结束后仍在等待：判定为不存在
		expect(() => IconManager.on(type, fn)).toThrow(`${type} nonexistent`);
	});

	it('IconManager, types still waiting are cleared when loading ends', async () => {
		await IconManager.basicStatus;
		const type = 'any-settle-need-wait';
		const url = '//at.alicdn.com/t/any-settle-check.js';
		const key = `@deot/vc-icon:${url}`;
		const fn = vi.fn();

		IconManager.loading++;
		try {
			Array.from({ length: 120 }).forEach(() => IconManager.on(type, fn));
		} finally {
			IconManager.loading--;
		}
		expect(IconManager.events[type].length).toBe(120);

		// 任意一次加载结束时检查：图标集都已加载完，仍在等待的 type 视为不存在，清空等待队列
		window.localStorage.setItem(key, JSON.stringify({}));
		try {
			await IconManager.load(url);
			await Promise.resolve();
			expect(IconManager.events[type]).toBeUndefined();
			expect(fn).not.toHaveBeenCalled();
		} finally {
			window.localStorage.removeItem(key);
		}
	});

	it('IconManager, loading counts pending loads', async () => {
		await IconManager.basicStatus;
		const url = '//at.alicdn.com/t/any-loading-counter.js';
		const type = 'any-loading-counter';
		const key = `@deot/vc-icon:${url}`;
		window.localStorage.setItem(key, JSON.stringify({ [type]: { viewBox: '0 0 1 1', path: [] } }));

		try {
			const before = IconManager.loading;
			const status = IconManager.load(url);
			expect(IconManager.loading).toBe(before + 1);
			// 重复加载同一个图标集不重复计数
			expect(IconManager.load(url)).toBe(status);
			expect(IconManager.loading).toBe(before + 1);
			await status;
			await Promise.resolve();
			expect(IconManager.loading).toBe(before);
			expect(IconManager.icons[type]).toBeTruthy();

			// 加载失败也会结束计数
			await IconManager.load('any-invalid-url').catch(() => {});
			await Promise.resolve();
			expect(IconManager.loading).toBe(before);
		} finally {
			window.localStorage.removeItem(key);
		}
	});
});
