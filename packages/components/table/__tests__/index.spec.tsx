// @vitest-environment jsdom

import { Table } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Table).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Table />));

		expect(wrapper.classes()).toContain('vc-table');
	});
});
