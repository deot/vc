// @vitest-environment jsdom

import { Print } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Print).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Print />));

		expect(wrapper.classes()).toContain('vc-print');
	});
});
