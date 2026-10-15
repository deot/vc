// @vitest-environment jsdom

import { TimePicker } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { vi, onTestFinished } from 'vitest';
import { sleep, flush, press, mountAttached, mountTyping } from '../../date-picker/__tests__/fixtures/editable';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof TimePicker).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<TimePicker />));

		expect(wrapper.classes()).toContain('vc-time-picker');
	});

	it('portal 为 false 时弹层挂在组件根节点内', async () => {
		const wrapper = await mountAttached(() => (<TimePicker portal={false} />));
		await wrapper.trigger('click');
		await flush();
		expect(wrapper.element.contains(document.querySelector('.vc-popover-wrapper'))).toBe(true);
	});
});

describe('TimePicker 手动输入（editable）', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const getSelected = () => Array.from(document.querySelectorAll('.vc-time-select__li.is-selected')).map(el => el.textContent);

	it('键入时间：时间列跟随，Enter 提交为规范格式', async () => {
		const value = ref<any>('10:00:00');
		const onChange = vi.fn();
		const { input, type } = await mountTyping(() => (
			<TimePicker v-model={value.value} onChange={onChange} />
		));

		await type('9:5:7');
		expect(getSelected()).toEqual(['09', '05', '07']);
		expect(onChange).not.toHaveBeenCalled();
		press('Enter');
		await flush();
		expect(value.value).toBe('09:05:07');
		expect(input.value).toBe('09:05:07');
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it('format 为 HH:mm；禁用的小时、disabledTime 判为禁用的时间不生效', async () => {
		const value = ref<any>('10:00');
		const { input, type } = await mountTyping(() => (
			<TimePicker
				v-model={value.value}
				format="HH:mm"
				disabledHours={[9]}
				disabledTime={(date: Date) => date.getHours() === 11 && date.getMinutes() === 30}
			/>
		));

		await type('09:15');
		input.blur();
		await flush();
		expect(value.value).toBe('10:00');

		input.focus();
		await type('11:30');
		input.blur();
		await flush();
		expect(value.value).toBe('10:00');

		input.focus();
		await type('12:45');
		input.blur();
		await flush();
		expect(value.value).toBe('12:45');
	});

	it('timerange：起止颠倒时调换', async () => {
		const value = ref<any>(['08:00:00', '09:00:00']);
		const { input, type } = await mountTyping(() => (
			<TimePicker v-model={value.value} type="timerange" />
		));

		await type('18:00:00 - 12:30:00');
		press('Enter');
		await flush();
		expect(value.value).toEqual(['12:30:00', '18:00:00']);
		expect(input.value).toBe('12:30:00 - 18:00:00');
	});

	it('时间列可见时滚到已选的时间（首次不带动画）；可见期间键入后滚到新的时间', async () => {
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

		const value = ref<any>('21:45:30');
		const { type } = await mountTyping(() => (
			<TimePicker v-model={value.value} open />
		));
		await sleep(20);
		// 各列的 Scroller 根节点即滚动容器，每行 24px
		const getScrollTops = () => Array.from(document.querySelectorAll<HTMLElement>('.vc-time-select__list')).map(el => el.scrollTop);
		expect(getScrollTops()).toEqual([0, 0, 0]);
		resize();
		expect(getScrollTops()).toEqual([21 * 24, 45 * 24, 30 * 24]);

		await type('08:05:00');
		await sleep(600);
		expect(getScrollTops()).toEqual([8 * 24, 5 * 24, 0]);
	});

	it('editable 为 false 时只读', async () => {
		const wrapper = await mountAttached(() => (<TimePicker editable={false} />));
		expect((wrapper.find('input').element as HTMLInputElement).readOnly).toBe(true);
	});
});
