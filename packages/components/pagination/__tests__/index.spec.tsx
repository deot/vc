// @vitest-environment jsdom

import { Pagination } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Pagination).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Pagination />));

		expect(wrapper.classes()).toContain('vc-pagination');
	});
});
