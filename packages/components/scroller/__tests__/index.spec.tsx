// @vitest-environment jsdom

import { Scroller } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Scroller).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Scroller />));

		expect(wrapper.classes()).toContain('vc-scroller');
	});
});
