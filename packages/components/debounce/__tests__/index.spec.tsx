// @vitest-environment jsdom

import { Button, Debounce } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { markRaw } from 'vue';

describe('index.ts', () => {
	it('component tag: 保留函数插槽和防抖行为，不产生警告', async () => {
		const warnings: string[] = [];
		const onClick = vi.fn();
		const wrapper = mount(Debounce, {
			props: { tag: markRaw(Button), wait: 300 },
			attrs: { onClick },
			slots: { default: () => '执行' },
			global: { config: { warnHandler: (message) => { warnings.push(message); } } }
		});

		expect(wrapper.findComponent(Button).text()).toBe('执行');
		await wrapper.trigger('click');
		await wrapper.trigger('click');
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(warnings).toEqual([]);
		wrapper.unmount();
	});

	it('basic', () => {
		expect(typeof Debounce).toBe('object');
	});

	it('click invaild', async () => {
		let count = 0;
		const handler = () => {
			count++;
		};

		const wrapper = mount(() => (
			<Debounce
				wait={300}
				// @ts-ignore
				click={handler}
			/>
		));

		await wrapper.trigger('click');
		expect(count).toBe(0);
	});

	it('click, debounce', async () => {
		let count = 0;
		const handler = () => {
			count++;
		};

		const wrapper = mount(() => (
			<Debounce
				wait={300}
				// @ts-ignore
				onClick={handler}
			/>
		));

		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');

		expect(count).toBe(1);
	});

	it('click, exclude', async () => {
		let count = 0;
		const handler = () => {
			count++;
		};

		const wrapper = mount(() => (
			<Debounce
				wait={300}
				exclude={/^onClick/}
				// @ts-ignore
				onClick={handler}
			/>
		));

		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');

		expect(count).toBe(4);
	});

	it('touchend, debounce', async () => {
		let count = 0;
		const handler = () => {
			count++;
		};

		const wrapper = mount(() => (
			<Debounce
				wait={300}
				// @ts-ignore
				onTouchend={handler}
			/>
		));

		await wrapper.trigger('touchend');
		await wrapper.trigger('touchend');
		await wrapper.trigger('touchend');
		await wrapper.trigger('touchend');
		expect(count).toBe(1);
	});
});
