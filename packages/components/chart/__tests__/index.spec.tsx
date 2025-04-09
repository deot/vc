// @vitest-environment jsdom

import { Chart } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Chart).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Chart />));

		expect(wrapper.classes()).toContain('vc-chart');
	});
});
