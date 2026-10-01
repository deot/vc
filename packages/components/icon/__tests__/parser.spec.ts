// @vitest-environment jsdom

import { IconManager } from '../manager';

// 仿 iconfont.js：svg 字符串包在脚本里
const createSprite = (symbols: string[]) => [
	`!function(c){var l,a='<svg>`,
	...symbols,
	`</svg>',t=(t=document.getElementsByTagName("script"))[t.length-1].getAttribute("data-injectcss");}(window);`
].join('');

describe('manager.ts', () => {
	it('parser', async () => {
		const sprite = createSprite([
			// 所有 path 都没有 fill
			'<symbol id="icon-search" viewBox="0 0 1024 1024">'
			+ '<path d="M469.333333 768a298.666667 298.666667 0 1 0 0-597.333333 298.666667 298.666667 0 0 0 0 597.333333z"  ></path>'
			+ '<path d="M700.586667 760.917333l60.330666-60.330666 181.034667 180.992-60.373333 60.373333z"  ></path>'
			+ '</symbol>',
			// 每个 path 都有 fill
			'<symbol id="icon-success" viewBox="0 0 1024 1024">'
			+ '<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z" fill="#52C41A" ></path>'
			+ '<path d="M456 682.7L270.3 497l60.3-60.3L456 562l237.4-237.4 60.3 60.3z" fill="#FFFFFF" ></path>'
			+ '</symbol>',
			// 只有部分 path 有 fill
			'<symbol id="icon-warning" viewBox="0 0 1024 1024">'
			+ '<path d="M512 64l448 832H64z" fill="#FAAD14" ></path>'
			+ '<path d="M480 384h64v256h-64z m0 320h64v64h-64z"  ></path>'
			+ '</symbol>',
			// fill-opacity 不算 fill
			'<symbol id="icon-loading" viewBox="0 0 24 24">'
			+ '<path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8z" fill-opacity=".3" ></path>'
			+ '</symbol>',
			'<symbol id="icon-close" viewBox="0 0 1024 1024">'
			+ '<path d="M563.8 512l262.5-312.9c4.4-5.2 0.7-13.1-6.1-13.1h-79.8L511.6 449.8 295.1 191.7H203L459.4 512z"  ></path>'
			+ '</symbol>'
		]);

		// 与原实现的解析结果一致
		expect(await IconManager.parser(sprite, 'parser')).toStrictEqual({
			search: {
				viewBox: '0 0 1024 1024',
				path: [
					{
						d: 'M469.333333 768a298.666667 298.666667 0 1 0 0-597.333333 298.666667 298.666667 0 0 0 0 597.333333z',
						fill: ''
					},
					{
						d: 'M700.586667 760.917333l60.330666-60.330666 181.034667 180.992-60.373333 60.373333z',
						fill: ''
					}
				]
			},
			success: {
				viewBox: '0 0 1024 1024',
				path: [
					{
						d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z',
						fill: '#52C41A'
					},
					{
						d: 'M456 682.7L270.3 497l60.3-60.3L456 562l237.4-237.4 60.3 60.3z',
						fill: '#FFFFFF'
					}
				]
			},
			warning: {
				viewBox: '0 0 1024 1024',
				path: [
					{
						d: 'M512 64l448 832H64z',
						fill: '#FAAD14'
					},
					// 自身没有 fill、但同一 symbol 内其他 path 有时，fill 为整个 path 字符串
					{
						d: 'M480 384h64v256h-64z m0 320h64v64h-64z',
						fill: '<path d="M480 384h64v256h-64z m0 320h64v64h-64z"  ></path>'
					}
				]
			},
			loading: {
				viewBox: '0 0 24 24',
				path: [
					{
						d: 'M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8z',
						fill: ''
					}
				]
			},
			close: {
				viewBox: '0 0 1024 1024',
				path: [
					{
						d: 'M563.8 512l262.5-312.9c4.4-5.2 0.7-13.1-6.1-13.1h-79.8L511.6 449.8 295.1 191.7H203L459.4 512z',
						fill: ''
					}
				]
			}
		});
	});

	it('parser, performance', async () => {
		// 300 个 symbol，每个 path 的 d 约 1000 字符；依次为：无 fill、都有 fill、部分有 fill
		const segment = 'c12.345678-23.456789 34.567891 45.678912 56.789123-67.891234';
		const fills = [['', ''], [' fill="#333333"', ' fill="#FFFFFF"'], [' fill="#333333"', '']];
		const sprite = createSprite(Array.from({ length: 300 }, (_, i) => {
			const path = fills[i % 3].map(fill => `<path d="M${i} ${i}${segment.repeat(16)}z"${fill} ></path>`);
			return `<symbol id="icon-large-${i}" viewBox="0 0 1024 1024">${path.join('')}</symbol>`;
		}));

		const start = performance.now();
		const icons = await IconManager.parser(sprite, 'parser, performance');
		const cost = performance.now() - start;

		expect(Object.keys(icons).length).toBe(300);
		expect(icons['large-0'].path[1]).toEqual({ d: `M0 0${segment.repeat(16)}z`, fill: '' });
		expect(icons['large-1'].path[1]).toEqual({ d: `M1 1${segment.repeat(16)}z`, fill: '#FFFFFF' });
		expect(cost).toBeLessThan(50);
	});
});
