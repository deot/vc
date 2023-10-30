// @vitest-environment jsdom

import { Card } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Card).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Card />));

		expect(wrapper.classes()).toContain('vc-card');
	});
});
