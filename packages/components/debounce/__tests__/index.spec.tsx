// @vitest-environment jsdom

import { Debounce } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Debounce).toBe('object');
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
});
