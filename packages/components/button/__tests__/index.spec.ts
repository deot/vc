import { Button } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

// @vitest-environment jsdom
describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Button).toBe('object');
	});

	it('click', async () => {
		const wrapper = mount(Button);
		expect(wrapper.text()).toMatch('Hello World');

		await wrapper.find('div').trigger('click');
	});
});
