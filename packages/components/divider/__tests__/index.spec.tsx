// @vitest-environment jsdom

import { Divider } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Divider).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Divider />));

		expect(wrapper.classes()).toContain('vc-divider');
	});
});
