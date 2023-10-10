import { Theme, ThemeView, ThemeText, ThemeImage } from '@deot/vc-components';

// @vitest-environment jsdom
describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Theme).toBe('object');
		expect(typeof ThemeView).toBe('object');
		expect(typeof ThemeText).toBe('object');
		expect(typeof ThemeImage).toBe('object');
	});
});
