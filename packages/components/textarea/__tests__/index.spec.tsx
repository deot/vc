// @vitest-environment jsdom

import { Textarea } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Textarea).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Textarea />));

		expect(wrapper.classes()).toContain('vc-textarea');
	});
});
