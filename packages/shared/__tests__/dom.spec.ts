// @vitest-environment jsdom
import { Utils } from '@deot/vc-shared';

describe('remToPx', () => {
	it('0 直接返回 0', () => {
		expect(Utils.remToPx(document.body, 0)).toBe(0);
	});

	it('已注册的 --vc-rem：计算值即 px', () => {
		const spy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			getPropertyValue: (name: string) => (name === '--vc-rem' ? '0.5px' : '')
		} as any);
		expect(Utils.remToPx(document.body, 100)).toBe(50);
		spy.mockRestore();
	});

	it('未注册时挂探针量取，并移除探针', () => {
		const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			return { width: this.style.width === 'calc(var(--vc-rem) * 100)' ? 64 : 0 } as DOMRect;
		});
		const el = document.createElement('div');
		document.body.appendChild(el);
		expect(Utils.remToPx(el, 100)).toBe(64);
		expect(el.children).toHaveLength(0);
		rect.mockRestore();
		el.remove();
	});
});

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
