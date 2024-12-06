// @vitest-environment jsdom

import { Resizer } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Resizer).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Resizer />));

		expect(wrapper.classes()).toContain('vc-resizer');
	});
});
