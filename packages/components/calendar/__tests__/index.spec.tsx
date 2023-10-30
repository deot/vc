// @vitest-environment jsdom

import { Calendar } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Calendar).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Calendar />));

		expect(wrapper.classes()).toContain('vc-calendar');
	});
});
