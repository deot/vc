// @vitest-environment jsdom

import { Message } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Message).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Message />));

		expect(wrapper.classes()).toContain('vc-message');
	});
});
