// @vitest-environment jsdom

import { Debounce } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
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
