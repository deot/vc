// @vitest-environment jsdom

import { RecycleList } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof RecycleList).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<RecycleList />));

		expect(wrapper.classes()).toContain('vc-recycle-list');
	});
});
