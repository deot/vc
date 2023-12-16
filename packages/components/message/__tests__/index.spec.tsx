// @vitest-environment jsdom

import { Message, MessageView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Message).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<MessageView />));

		expect(wrapper.classes()).toContain('vc-message');
	});
});
