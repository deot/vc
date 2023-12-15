// @vitest-environment jsdom

import {
	Transition,
	TransitionCollapse,
	TransitionFade,
	TransitionScale,
	TransitionSlide,
	TransitionZoom
} from '@deot/vc-components';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Transition).toBe('object');
		expect(typeof TransitionCollapse).toBe('object');
		expect(typeof TransitionFade).toBe('object');
		expect(typeof TransitionScale).toBe('object');
		expect(typeof TransitionSlide).toBe('object');
		expect(typeof TransitionZoom).toBe('object');
	});
});
