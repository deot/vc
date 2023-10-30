// @vitest-environment jsdom

import { Timeline } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Timeline).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Timeline />));

		expect(wrapper.classes()).toContain('vc-timeline');
	});
});
