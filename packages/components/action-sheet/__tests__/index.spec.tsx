// @vitest-environment jsdom

import { ActionSheet } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof ActionSheet).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<ActionSheet />));

		expect(wrapper.classes()).toContain('vc-action-sheet');
	});
});
