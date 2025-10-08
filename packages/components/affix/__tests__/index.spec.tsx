// @vitest-environment jsdom

import { Affix } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Affix).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Affix />));

		expect(wrapper.classes()).toContain('vc-affix');
	});
});
