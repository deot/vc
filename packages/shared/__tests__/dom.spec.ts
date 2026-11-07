// @vitest-environment jsdom
import { Utils } from '@deot/vc-shared';

describe('getComputedStyle', () => {
	it('汇总盒模型与指定样式', () => {
		const el = document.createElement('div');
		el.style.cssText = 'box-sizing: border-box; padding: 2px 0 3px; border: 1px solid; width: 10px';
		document.body.appendChild(el);
		const result = Utils.getComputedStyle(el, ['width']) as any;
		expect(result.boxSizing).toBe('border-box');
		expect(result.paddingSize).toBe(5);
		expect(result.borderSize).toBe(2);
		expect(result.sizingStyle).toBe('width:10px');
		el.remove();
	});
});
