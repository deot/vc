// @vitest-environment jsdom

import { Artboard } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Artboard).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Artboard />));

		expect(wrapper.classes()).toContain('vc-artboard');
	});
});
