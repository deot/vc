// @vitest-environment jsdom

import { TimePicker } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { vi, onTestFinished } from 'vitest';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof TimePicker).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<TimePicker />));

		expect(wrapper.classes()).toContain('vc-time-picker');
	});
});

describe('时间列滚动', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

	it('时间列显示时滚到已选的时间（不带动画）；显示期间点选后带动画滚到新的时间', async () => {
		// jsdom 没有 ResizeObserver 与布局：打桩，并让时间列有高度
		const observers: Array<{ callback: (entries: any[]) => void; els: Set<Element> }> = [];
		vi.stubGlobal('ResizeObserver', class {
			els = new Set<Element>();
			constructor(callback: (entries: any[]) => void) {
				observers.push({ callback, els: this.els });
			}

			observe(el: Element) { this.els.add(el); }
			unobserve(el: Element) { this.els.delete(el); }
			disconnect() { this.els.clear(); }
		});
		const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
			return this.classList.contains('vc-time-select__list') ? 224 : 0;
		});
		onTestFinished(() => {
			vi.unstubAllGlobals();
			height.mockRestore();
		});
		const resize = () => observers.forEach(({ callback, els }) => els.size && callback([...els].map(target => ({ target }))));

		const wrapper = mount(() => (<TimePicker modelValue="21:45:30" open />), { attachTo: document.body });
		onTestFinished(() => wrapper.unmount());
		await nextTick();
		await sleep(20);
		// 各列的 Scroller 根节点即滚动容器，每行 24px
		const lists = () => Array.from(document.querySelectorAll<HTMLElement>('.vc-time-select__list'));
		expect(lists().map(el => el.scrollTop)).toEqual([0, 0, 0]);
		resize();
		expect(lists().map(el => el.scrollTop)).toEqual([21 * 24, 45 * 24, 30 * 24]);

		Array.from(lists()[0].querySelectorAll<HTMLElement>('.vc-time-select__li')).find(el => el.textContent === '08')!.click();
		await sleep(600);
		expect(lists()[0].scrollTop).toBe(8 * 24);
	});
});
