// @vitest-environment jsdom
import { toPx, toRem, remToPx } from '@deot/vc-shared';

describe('toPx', () => {
	it('输出 px 长度', () => {
		expect(toPx(32)).toBe('32px');
		expect(toPx(-4)).toBe('-4px');
	});

	it('字符串原样返回', () => {
		expect(toPx('50%')).toBe('50%');
	});
});

describe('toRem', () => {
	it('输出 750 稿长度的 calc', () => {
		expect(toRem(32)).toBe('calc(var(--vc-rem) * 32)');
		expect(toRem(0)).toBe('calc(var(--vc-rem) * 0)');
	});

	it('字符串原样返回', () => {
		expect(toRem('var(--header-height)')).toBe('var(--header-height)');
	});
});

describe('remToPx', () => {
	it('0 直接返回 0', () => {
		expect(remToPx(document.body, 0)).toBe(0);
	});

	it('已注册的 --vc-rem：计算值即 px', () => {
		const spy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			getPropertyValue: (name: string) => (name === '--vc-rem' ? '0.5px' : '')
		} as any);
		expect(remToPx(document.body, 100)).toBe(50);
		spy.mockRestore();
	});

	it('未注册时挂探针量取，并移除探针', () => {
		const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			return { width: this.style.width === 'calc(var(--vc-rem) * 100)' ? 64 : 0 } as DOMRect;
		});
		const el = document.createElement('div');
		document.body.appendChild(el);
		expect(remToPx(el, 100)).toBe(64);
		expect(el.children).toHaveLength(0);
		rect.mockRestore();
		el.remove();
	});
});
