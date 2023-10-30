// @vitest-environment jsdom

import { SortList } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof SortList).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<SortList />));

		expect(wrapper.classes()).toContain('vc-sort-list');
	});
});
