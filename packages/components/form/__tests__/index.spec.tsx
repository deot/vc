// @vitest-environment jsdom

import { Form } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Form).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Form />));

		expect(wrapper.classes()).toContain('vc-form');
	});
});
