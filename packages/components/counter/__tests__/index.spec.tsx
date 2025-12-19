// @vitest-environment jsdom

import { Counter } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Counter).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Counter />));

		expect(wrapper.classes()).toContain('vc-counter');
	});
});
