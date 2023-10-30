// @vitest-environment jsdom

import { Notice } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Notice).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Notice />));

		expect(wrapper.classes()).toContain('vc-notice');
	});
});
