// @vitest-environment jsdom

import { Snapshot } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	const origialGetComputedStyle = window.getComputedStyle;
	Object.defineProperty(window, 'getComputedStyle', {
		value: (e: any) => {
			const v = origialGetComputedStyle(e);
			const keys = Array.from(v);
			v[Symbol.iterator] = function* () {
				for (const key of keys) {
					yield key;
				}
			};
			return v;
		}
	});

	it('basic', () => {
		expect(typeof Snapshot).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Snapshot />));

		expect(wrapper.classes()).toContain('vc-snapshot');
	});
});
