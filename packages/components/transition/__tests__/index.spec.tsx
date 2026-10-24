// @vitest-environment jsdom

import {
	Transition,
	TransitionCollapse,
	TransitionFade,
	TransitionReveal,
	TransitionScale,
	TransitionSlide,
	TransitionZoom
} from '@deot/vc-components';
import { timingOf } from '../transition-props';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Transition).toBe('object');
		expect(typeof TransitionCollapse).toBe('object');
		expect(typeof TransitionFade).toBe('object');
		expect(typeof TransitionReveal).toBe('object');
		expect(typeof TransitionScale).toBe('object');
		expect(typeof TransitionSlide).toBe('object');
		expect(typeof TransitionZoom).toBe('object');
	});
});

describe('transition-props.ts', () => {
	it('reads the enter or leave part, and 0 when the object leaves it out', () => {
		expect(timingOf(300, 'enter')).toBe(300);
		expect(timingOf({ enter: 80, leave: 0 }, 'enter')).toBe(80);
		expect(timingOf({ enter: 80, leave: 0 }, 'leave')).toBe(0);
		expect(timingOf({ enter: 80 }, 'leave')).toBe(0);
	});
});
