// @vitest-environment jsdom

import { Progress } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Progress).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Progress />));

		expect(wrapper.classes()).toContain('vc-progress');
	});
});
