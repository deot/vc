// @vitest-environment jsdom

import { getFitIndex } from '../utils';

/**
 * jsdom 不会真正进行文本布局, clientHeight 永远为 0。
 * 这里通过 patch HTMLDivElement.prototype.clientHeight 让其根据当前 innerText 长度
 * 模拟 "每个字符占一行高度" 的虚拟布局, 以便覆盖 getFitIndex 的截断与回退分支。
 */
const charHeight = 10; // 模拟每行高度 10px

const installVirtualLayout = (paddingPx = 0) => {
	const desc = Object.getOwnPropertyDescriptor(HTMLDivElement.prototype, 'clientHeight');
	Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', {
		configurable: true,
		get(this: HTMLDivElement) {
			const text = (this as any).innerText || '';
			return text.length * charHeight + paddingPx;
		}
	});
	return () => {
		if (desc) {
			Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', desc);
		} else {
			delete (HTMLDivElement.prototype as any).clientHeight;
		}
	};
};

const createEl = (style: Partial<CSSStyleDeclaration> = {}, attrs: Record<string, string> = {}) => {
	const el = document.createElement('div');
	Object.entries(style).forEach(([k, v]) => {
		(el.style as any)[k] = v;
	});
	Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
	document.body.appendChild(el);
	return el;
};

describe('utils.ts > getFitIndex', () => {
	let restoreLayout: (() => void) | null = null;

	afterEach(() => {
		document.body.innerHTML = '';
		restoreLayout?.();
		restoreLayout = null;
	});

	it('value 为空时返回 -1, 不抛错', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		expect(getFitIndex({ el, line: 2, value: '', ellipsis: '...' })).toBe(-1);
		expect(getFitIndex({ el, line: 2, value: undefined, ellipsis: '...' })).toBe(-1);
	});

	it('value 为数字时会被转为字符串处理', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// 数字 -> 字符串 -> 没有明显超长 -> -1
		expect(getFitIndex({ el, line: 5, value: 12345, ellipsis: '...' })).toBe(-1);
	});

	it('内容未超出 line 时返回 -1', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// 模拟布局下, "abc" 高度 = 3*10=30, line=5*lineHeight=5*10=50, 不超 -> -1
		expect(getFitIndex({ el, line: 5, value: 'abc', ellipsis: '...' })).toBe(-1);
	});

	it('内容超出 line 时返回截断 index, 加上 ellipsis 后仍能容纳', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// lineHeight=10, line=2 -> 阈值 20; 12 chars = 120 高度, 必然超
		// 第 3 个字符 (i=2, innerText length=3) 时 30 > 20, endIndex 设为 2
		// 然后回退: i=1, innerText=ab+ellipsis(3) = 5 chars => 50 不 <= 20
		//          i=0, innerText=a+ellipsis(3) = 4 chars => 40 不 <= 20
		// 没满足条件 + slice 未传 -> endIndex 保持 2
		expect(getFitIndex({ el, line: 2, value: 'abcdefghijkl', ellipsis: '...' })).toBe(2);
	});

	it('回退能找到合适的截断点 (ellipsis 短到能容纳)', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// line=10 -> 阈值 100; 价值 12 chars (120) 超出
		// 首次截断 i 满足 (i+1)*10 > 100 => i=10 (11 chars), endIndex=10
		// 回退: i=9, 'abcdefghi'(9) + ''(0)=9 chars, 90<=100, 命中, endIndex=9
		expect(getFitIndex({ el, line: 10, value: 'abcdefghijkl', ellipsis: '' })).toBe(9);
	});

	it('indent 会叠加到 text-indent 中且不影响计算结果接口', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// 不抛错, 返回值与无 indent 一致
		const a = getFitIndex({ el, line: 5, value: 'abcdef', ellipsis: '...', indent: 0 });
		const b = getFitIndex({ el, line: 5, value: 'abcdef', ellipsis: '...', indent: 100 });
		expect(a).toBe(b);
	});

	it('当宿主元素有有效 line-height 时跳过 NaN 兜底分支', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl({ lineHeight: '20px' });
		// line=2 -> 阈值 20*2=40; 6 chars => 60>40 => endIndex 由首轮设置
		// 回退: i=2, innerText='ab'+ellipsis(3)=5 => 50>40, 不命中
		//       i=1, 'a'+'...'=4 chars => 40<=40, 命中 endIndex=1
		expect(getFitIndex({ el, line: 2, value: 'abcdef', ellipsis: '...' })).toBe(1);
	});

	it('当宿主有 wrap 属性时同步给隐藏节点, 否则移除', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl({}, { wrap: 'soft' });
		getFitIndex({ el, line: 2, value: 'abcdef', ellipsis: '...' });
		const hidden = document.body.lastElementChild as HTMLElement;
		expect(hidden.getAttribute('wrap')).toBe('soft');

		// 第二次去掉 wrap 后应被移除
		el.removeAttribute('wrap');
		getFitIndex({ el, line: 2, value: 'abcdef', ellipsis: '...' });
		expect(hidden.getAttribute('wrap')).toBeNull();
	});

	it('boxSizing=border-box 时把 borderSize 计入 sideHeight', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl({ boxSizing: 'border-box', borderTopWidth: '5px', borderBottomWidth: '5px' });
		// 不抛错且能正常返回 (具体值不强校验)
		const idx = getFitIndex({ el, line: 2, value: 'abcdefghij', ellipsis: '...' });
		expect(typeof idx).toBe('number');
	});

	it('多次调用复用同一隐藏节点 (不会重复创建)', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		getFitIndex({ el, line: 2, value: 'abc', ellipsis: '...' });
		const after1 = document.body.children.length;
		getFitIndex({ el, line: 2, value: 'def', ellipsis: '...' });
		const after2 = document.body.children.length;
		// 第二次调用不会再向 body 增加节点
		expect(after2).toBe(after1);
	});

	it('slice=-5: 尾部固定保留 5 字符, 回退时把 ellipsis+sliceText 算进容量', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// line=10 -> 阈值 100
		// value=16 chars 'abcdefghijklmnop', sliceText=value.slice(-5)='lmnop' (5 chars)
		// 首轮: i=10 时 length=11, 110>100, endIndex=10
		// 回退: i=9..3 全部 prefix+3+5 > 100, 不命中
		//       i=2, 'ab'(2)+'...'(3)+'lmnop'(5)=10 chars=100<=100, 命中 endIndex=2
		// 渲染串: 'ab' + '...' + 'lmnop' = 'ab...lmnop' (10 chars 恰好填满 line=10)
		expect(getFitIndex({
			el,
			line: 10,
			value: 'abcdefghijklmnop',
			ellipsis: '...',
			slice: -5
		})).toBe(2);
	});

	it('slice=-5: 渲染串 prefix+ellipsis+sliceText 仍能容纳 line 行 (跨多个 line)', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// line=20 -> 阈值 200
		// 16 chars 总 160 < 200 -> 完全装得下, 应直接返回 -1
		expect(getFitIndex({
			el,
			line: 20,
			value: 'abcdefghijklmnop',
			ellipsis: '...',
			slice: -5
		})).toBe(-1);
	});

	it('slice=0: sliceText=整串, 回退始终装不下, 边界保护返回 0', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// line=10 -> 阈值 100
		// value 16 chars, sliceText=value.slice(0)='abcdefghijklmnop' (16 chars)
		// 回退每一步: i + 3 + 16 >= 19 chars >= 190 > 100, 永远不 fit
		// 触发边界保护 -> 返回 0
		expect(getFitIndex({
			el,
			line: 10,
			value: 'abcdefghijklmnop',
			ellipsis: '...',
			slice: 0
		})).toBe(0);
	});

	it('slice=正数 (slice 起点): 尾部从中间开始, 回退命中', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// line=10 -> 阈值 100
		// value 16 chars, sliceText=value.slice(10)='klmnop' (6 chars)
		// 首轮: endIndex=10
		// 回退: i=9 -> 9+3+6=18=180 > 100
		//       ... i=1 -> 1+3+6=10=100 <= 100, 命中 endIndex=1
		expect(getFitIndex({
			el,
			line: 10,
			value: 'abcdefghijklmnop',
			ellipsis: '...',
			slice: 10
		})).toBe(1);
	});

	it('slice 设为 null 等价 undefined: 不保留尾部, 行为同旧版本', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// 同 "回退能找到合适的截断点" case, 显式传 slice=null 应得到一致结果
		expect(getFitIndex({
			el,
			line: 10,
			value: 'abcdefghijkl',
			ellipsis: '',
			slice: null
		})).toBe(9);
	});

	it('slice 越界 (>= value.length) 时 sliceText 为空, 回退退化为仅 ellipsis 测量', () => {
		restoreLayout = installVirtualLayout();
		const el = createEl();
		// line=10 -> 阈值 100, value=12 chars, slice=20 -> sliceText=''
		// 首轮: endIndex=10
		// 回退: i=9, 'abcdefghi'(9)+'...'(3)+''(0)=12=120>100, no
		//       i=8, 8+3=11=110>100, no
		//       i=7, 7+3=10=100<=100, 命中 endIndex=7
		expect(getFitIndex({
			el,
			line: 10,
			value: 'abcdefghijkl',
			ellipsis: '...',
			slice: 20
		})).toBe(7);
	});
});

describe('utils.ts > getFitIndex 测量次数', () => {
	let restoreLayout: (() => void) | null = null;
	// 每次读取 clientHeight 在浏览器里都是一次强制排版
	let reads: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		restoreLayout = installVirtualLayout();
		reads = vi.spyOn(HTMLDivElement.prototype, 'clientHeight', 'get');
	});

	afterEach(() => {
		document.body.innerHTML = '';
		reads.mockRestore();
		restoreLayout?.();
	});

	/**
	 * 逐字扫描的旧实现，作为结果对照
	 * @param options getFitIndex 的参数
	 * @param options.line 行数
	 * @param options.value 文本
	 * @param options.ellipsis 省略号
	 * @param options.slice 保留的尾部
	 * @returns 截断下标
	 */
	const scan = ({ line, value, ellipsis, slice }: any) => {
		const exceeds = (text: string) => text.length * charHeight > charHeight * line;
		const hasSlice = slice !== undefined && slice !== null;
		const sliceText = hasSlice ? value.slice(slice) : '';
		let endIndex = -1;
		for (let i = 0; i < value.length; i++) {
			if (exceeds(value.slice(0, i + 1))) {
				endIndex = i;
				break;
			}
		}
		if (endIndex < 0) return -1;
		for (let i = endIndex - 1; i >= 0; i--) {
			if (!exceeds(value.slice(0, i) + ellipsis + sliceText)) return i;
		}
		return hasSlice ? 0 : endIndex;
	};

	it('放得下时只量一次', () => {
		const el = createEl();
		expect(getFitIndex({ el, line: 50, value: 'a'.repeat(40), ellipsis: '...' })).toBe(-1);
		// 读 line-height 兜底一次（jsdom 下 line-height 为 NaN）+ 整串一次
		expect(reads).toHaveBeenCalledTimes(2);
	});

	it('溢出时按二分测量，次数与长度成对数关系', () => {
		const el = createEl();
		getFitIndex({ el, line: 10, value: 'a'.repeat(1000), ellipsis: '...' });
		expect(reads.mock.calls.length).toBeLessThan(30);
	});

	it('结果与逐字扫描一致', () => {
		const el = createEl();
		const values = ['', 'a', 'abcdef', 'abcdefghijkl', 'abcdefghijklmnop', 'x'.repeat(37)];
		const cases: any[] = [];
		values.forEach((value) => {
			[1, 2, 5, 10, 20].forEach((line) => {
				['', '.', '...'].forEach((ellipsis) => {
					[undefined, null, 0, -1, -5, 3, 20].forEach((slice) => {
						cases.push({ value, line, ellipsis, slice });
					});
				});
			});
		});
		cases.forEach((options) => {
			expect(getFitIndex({ el, ...options }), JSON.stringify(options)).toBe(scan(options));
		});
	});
});
