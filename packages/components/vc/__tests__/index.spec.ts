import { VcError, VcInstance, install } from '@deot/vc-components';

// @vitest-environment jsdom
describe('index.ts', () => {
	it('basic', () => {
		expect(typeof VcError).toBe('function');
		expect(typeof VcInstance).toBe('object');
		expect(typeof install).toBe('function');
	});
});
