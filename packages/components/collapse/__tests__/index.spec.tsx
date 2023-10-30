// @vitest-environment jsdom

import { Collapse } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Collapse).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Collapse />));

		expect(wrapper.classes()).toContain('vc-collapse');
	});
});
