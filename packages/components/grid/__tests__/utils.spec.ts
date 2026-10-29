import { layout, resolveTracks, resolveGap, resolveResponsive, resolveSpan, getBreakpoint } from '../utils';

const pick = (result: ReturnType<typeof layout>) => result.cells.map(({ row, rowspan, start, span, hidden }) => {
	return hidden ? null : [row, start, span, rowspan];
});

describe('grid/utils', () => {
	it('resolveTracks: 数字为等宽列', () => {
		expect(resolveTracks(24)).toEqual({ template: 'repeat(24, minmax(0, 1fr))', count: 24 });
		expect(resolveTracks(0)).toEqual({ template: 'repeat(1, minmax(0, 1fr))', count: 1 });
		expect(resolveTracks(3.6).count).toBe(3);
	});

	it('resolveTracks: 数组中数字为px, 字符串原样', () => {
		expect(resolveTracks([100, '1fr', 'minmax(120px, 2fr)'])).toEqual({
			template: '100px 1fr minmax(120px, 2fr)',
			count: 3
		});
	});

	it('resolveTracks: 字符串展开repeat, 忽略网格线名称', () => {
		expect(resolveTracks('100px repeat(3, 1fr)').count).toBe(4);
		expect(resolveTracks('[a] 100px [b c] repeat(2, 1fr minmax(0, 2fr)) [end]').count).toBe(5);
		expect(resolveTracks(' 1fr  auto ').template).toBe('1fr  auto');
	});

	it('resolveTracks: auto-fill按1次计算并提示', () => {
		const NODE_ENV = process.env.NODE_ENV;
		process.env.NODE_ENV = 'development';
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(resolveTracks('repeat(auto-fill, minmax(100px, 1fr))').count).toBe(1);
		expect(error).toHaveBeenCalledTimes(1);
		expect(error.mock.calls[0][0]).toContain('auto-fill');
		error.mockRestore();
		process.env.NODE_ENV = NODE_ENV;
	});

	it('resolveGap: [水平, 垂直]', () => {
		expect(resolveGap(8)).toBe('8px 8px');
		expect(resolveGap([16, 4])).toBe('4px 16px');
	});

	it('resolveResponsive: 取当前及更小断点中第一个已设置的值', () => {
		expect(resolveResponsive(8, 'xl', 1)).toBe(8);
		expect(resolveResponsive(undefined, 'xl', 1)).toBe(1);
		expect(resolveResponsive([1, 2], 'xl', [0])).toEqual([1, 2]);

		const value = { xs: 24, md: 12, xl: 8 };
		expect(resolveResponsive(value, 'xxl', 1)).toBe(8);
		expect(resolveResponsive(value, 'lg', 1)).toBe(12);
		expect(resolveResponsive(value, 'sm', 1)).toBe(24);
		expect(resolveResponsive({ md: 12 }, 'sm', 1)).toBe(1);
	});

	it('getBreakpoint', () => {
		expect([0, 575, 576, 768, 992, 1200, 1600].map(getBreakpoint)).toEqual(['xs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl']);
	});

	it('resolveSpan: 数组或对象', () => {
		expect(resolveSpan(undefined)).toEqual({ hidden: false });
		expect(resolveSpan([2, 8])).toEqual({ rowspan: 2, colspan: 8, hidden: false });
		expect(resolveSpan({ colspan: 0 })).toEqual({ rowspan: undefined, colspan: 0, hidden: true });
	});

	it('layout: 放不下时换行', () => {
		const result = layout({ columns: 24, items: [{ span: 8 }, { span: 12 }, { span: 8 }, { span: 24 }] });
		expect(pick(result)).toEqual([[0, 0, 8, 1], [0, 8, 12, 1], [1, 0, 8, 1], [2, 0, 24, 1]]);
		expect(result.rows).toBe(3);
		expect(result.overflow).toBe(false);
	});

	it('layout: span超出时按列数处理, offset计入换行', () => {
		const result = layout({ columns: 24, items: [{ span: 30 }, { span: 8, offset: 8 }, { span: 8, offset: 12 }] });
		expect(pick(result)).toEqual([[0, 0, 24, 1], [1, 8, 8, 1], [2, 12, 8, 1]]);
	});

	it('layout: span为auto时占满本行剩余', () => {
		const result = layout({ columns: 24, items: [{ span: 6 }, { span: 'auto' }, { span: 24 }, { span: 'auto' }] });
		expect(pick(result)).toEqual([[0, 0, 6, 1], [0, 6, 18, 1], [1, 0, 24, 1], [2, 0, 24, 1]]);
	});

	it('layout: rowspan跳过被占用的格子', () => {
		const result = layout({
			columns: 24,
			items: [{ span: 6, rowspan: 2 }, { span: 18 }, { span: 12 }, { span: 12 }, { span: 12 }]
		});
		expect(pick(result)).toEqual([[0, 0, 6, 2], [0, 6, 18, 1], [1, 6, 12, 1], [2, 0, 12, 1], [2, 12, 12, 1]]);
		expect(result.rows).toBe(3);
	});

	it('layout: auto只占到被占用的格子为止', () => {
		const result = layout({
			columns: 24,
			items: [{ span: 6 }, { span: 6, rowspan: 2 }, { span: 12 }, { span: 'auto' }]
		});
		expect(pick(result)).toEqual([[0, 0, 6, 1], [0, 6, 6, 2], [0, 12, 12, 1], [1, 0, 6, 1]]);
	});

	it('layout: hidden不占位', () => {
		const result = layout({ columns: 24, items: [{ span: 12 }, { span: 12, hidden: true }, { span: 12 }] });
		expect(pick(result)).toEqual([[0, 0, 12, 1], null, [0, 12, 12, 1]]);
	});

	it('layout: fill时每行最右一项补满', () => {
		const result = layout({
			columns: 24,
			fill: true,
			items: [{ span: 8 }, { span: 8 }, { span: 12 }, { span: 6, rowspan: 2 }, { span: 8 }]
		});
		// 第1行第2项补满到24；第2行跨2行的项补满到24；第3行的项补到被跨行项占用的第12格为止
		expect(pick(result)).toEqual([[0, 0, 8, 1], [0, 8, 16, 1], [1, 0, 12, 1], [1, 12, 12, 2], [2, 0, 12, 1]]);
	});

	it('layout: suffix放在最后并靠右', () => {
		const result = layout({ columns: 24, items: [{ span: 8, suffix: true }, { span: 8 }, { span: 12 }] });
		expect(pick(result)).toEqual([[1, 16, 8, 1], [0, 0, 8, 1], [0, 8, 12, 1]]);

		const fits = layout({ columns: 24, items: [{ span: 8 }, { span: 8, suffix: true }] });
		expect(pick(fits)).toEqual([[0, 0, 8, 1], [0, 16, 8, 1]]);
	});

	it('layout: 折叠时预留suffix, 之后的项都隐藏', () => {
		const items = [{ span: 8 }, { span: 8 }, { span: 8 }, { span: 8 }, { span: 8, suffix: true }];
		const result = layout({ columns: 24, collapsed: true, items });
		expect(pick(result)).toEqual([[0, 0, 8, 1], [0, 8, 8, 1], null, null, [0, 16, 8, 1]]);
		expect(result.overflow).toBe(true);
		expect(result.rows).toBe(1);

		const two = layout({ columns: 24, collapsed: true, collapsedRows: 2, items });
		expect(pick(two)).toEqual([[0, 0, 8, 1], [0, 8, 8, 1], [0, 16, 8, 1], [1, 0, 8, 1], [1, 16, 8, 1]]);
		expect(two.overflow).toBe(false);
	});

	it('layout: 折叠时跨出最后一行的项隐藏', () => {
		const result = layout({ columns: 24, collapsed: true, items: [{ span: 12 }, { span: 12, rowspan: 2 }] });
		expect(pick(result)).toEqual([[0, 0, 12, 1], null]);
		expect(result.overflow).toBe(true);
	});

	it('layout: 折叠时最后一行的auto让出suffix', () => {
		const result = layout({ columns: 24, collapsed: true, items: [{ span: 6 }, { span: 'auto' }, { span: 6, suffix: true }] });
		expect(pick(result)).toEqual([[0, 0, 6, 1], [0, 6, 12, 1], [0, 18, 6, 1]]);
	});
});
