import realDayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import ownDayjs from '../helper/_dayjs';

/**
 * _dayjs 与 dayjs（en + customParseFormat）的对照：同样的输入，结果必须逐项相同
 * 以后改为依赖 dayjs 时，这里通过就说明可以直接替换
 */
realDayjs.extend(customParseFormat);

type AnyDayjs = ReturnType<typeof realDayjs> | ReturnType<typeof ownDayjs>;
const serialize = (date: AnyDayjs) => (date.isValid() ? date.valueOf() : 'Invalid Date');

const DATES = [
	new Date(2024, 0, 31, 8, 30, 15, 250),
	new Date(2024, 1, 29, 23, 59, 59, 999),
	new Date(2023, 11, 31, 0, 0, 0, 0),
	new Date(2023, 2, 26, 2, 30),
	new Date(2023, 9, 29, 2, 30),
	new Date(2023, 6, 9, 12, 0, 0, 5),
	(() => {
		const date = new Date(2024, 0, 15, 10);
		date.setFullYear(50);
		return date;
	})(),
	(() => {
		const date = new Date(2024, 1, 29, 10);
		date.setFullYear(4);
		return date;
	})()
];

const ADD_UNITS = ['d', 'day', 'days', 'w', 'week', 'weeks', 'M', 'month', 'months', 'y', 'year', 'years'] as const;
const START_OF_UNITS = ['day', 'month', 'year'] as const;

describe('_dayjs 与 dayjs 对照', () => {
	it('创建：Date / 时间戳 / 字符串 / null / 克隆', () => {
		const inputs: any[] = [
			null,
			0,
			1709658000000,
			...DATES,
			'2024-03-05',
			'2024-3-5',
			'2024/03/05 12:00',
			'2024-03-05 12:00:00.5',
			'2024-03-05 12:00:00.123456',
			'2024-03-05T12:00:00',
			'2024-03-05T12:00:00Z',
			'2024-03-05T12:00:00+08:00',
			'20240305',
			'2024',
			'0050-01-01',
			'2024-13-45',
			'Tue Mar 05 2024 12:00:00',
			'abc',
			''
		];
		inputs.forEach((input) => {
			expect([input, serialize(ownDayjs(input))]).toEqual([input, serialize(realDayjs(input))]);
		});

		const now = ownDayjs();
		expect(now.isValid()).toBe(true);
		expect(Math.abs(now.valueOf() - realDayjs().valueOf())).toBeLessThan(1000);

		const source = ownDayjs(DATES[0]);
		const copy = ownDayjs(source);
		expect(copy).not.toBe(source);
		expect(copy.valueOf()).toBe(source.valueOf());
		expect(copy.toDate()).not.toBe(source.$d);
		expect(source.toDate()).not.toBe(source.toDate());
	});

	it('按格式解析（customParseFormat）', () => {
		const cases: Array<[any, string]> = [
			['2024-03-05', 'YYYY-MM-DD'],
			['2024-3-5', 'YYYY-MM-DD'],
			['2024-3-5', 'YYYY-M-D'],
			['2024-03-05', 'YYYY-M-D'],
			['2024/03/05', 'YYYY-MM-DD'],
			['2024 - 03 - 05', 'YYYY-MM-DD'],
			['2024年3月5日', 'YYYY-M-D'],
			['2024年03月05日', 'YYYY[年]MM[月]DD[日]'],
			['2024-02-30', 'YYYY-MM-DD'],
			['2024-03-05x', 'YYYY-MM-DD'],
			['2024-03-05', 'YYYY-MM-DD HH:mm:ss'],
			['2024-03-05 9:5:3', 'YYYY-M-D H:m:s'],
			['2024-03-05 14:35:07', 'YYYY-MM-DD HH:mm:ss'],
			['2023-05-09 14:35:07.250', 'YYYY-MM-DD HH:mm:ss.SSS'],
			['2023-05-09 14:35:07.2', 'YYYY-MM-DD HH:mm:ss.S'],
			['2023-05-09 14:35:07.25', 'YYYY-MM-DD HH:mm:ss.SS'],
			['2023-05-09 14:35:07 +08:00', 'YYYY-MM-DD HH:mm:ss Z'],
			['2023-05-09 14:35:07 -0530', 'YYYY-MM-DD HH:mm:ss ZZ'],
			['2023-05-09T14:35:07Z', 'YYYY-MM-DDTHH:mm:ssZ'],
			['2023-05-09 02:30:00 PM', 'YYYY-MM-DD hh:mm:ss A'],
			['2023-05-09 12:00:00 AM', 'YYYY-MM-DD hh:mm:ss A'],
			['2023-05-09 12:00:00 pm', 'YYYY-MM-DD h:mm:ss a'],
			['2023-05-09 11:00:00 PM', 'YYYY-MM-DD h:mm:ss a'],
			['99-05-09', 'YY-MM-DD'],
			['68-05-09', 'YY-MM-DD'],
			['20-05-09', 'YY-MM-DD'],
			['May 9, 2023', 'MMM D, YYYY'],
			['May 9, 2023', 'MMMM D, YYYY'],
			['September 9, 2023', 'MMMM D, YYYY'],
			['Foo 9, 2023', 'MMM D, YYYY'],
			['9th May 2023', 'Do MMM YYYY'],
			['2023 Q3', 'YYYY [Q]Q'],
			['-500', 'Y'],
			['2024', 'YYYY'],
			['2024-03', 'YYYY-MM'],
			['202', 'YYYY'],
			['abc', 'YYYY-MM-DD'],
			['', 'YYYY-MM-DD'],
			['03/05/2024', 'L'],
			['[2024]', '[YYYY]'],
			['1709658000000', 'x'],
			['1709658000', 'X'],
			[1709658000000, 'YYYY-MM-DD'],
			[new Date(2024, 2, 5), 'YYYY-MM-DD'],
			[undefined, 'YYYY-MM-DD'],
			[null, 'YYYY-MM-DD']
		];
		cases.forEach(([text, format]) => {
			expect([text, format, serialize(ownDayjs(text, format))]).toEqual([text, format, serialize(realDayjs(text, format))]);
		});

		// 只有时间：日期取今天
		['14:35', '14:35:07'].forEach((text) => {
			const format = text.length > 5 ? 'HH:mm:ss' : 'HH:mm';
			expect(ownDayjs(text, format).format('YYYY-MM-DD HH:mm:ss')).toBe(realDayjs(text, format).format('YYYY-MM-DD HH:mm:ss'));
		});
	});

	it('format：全部 token、[] 转义、未知 token、默认格式、非法日期', () => {
		const templates = [
			'YYYY-MM-DD HH:mm:ss.SSS',
			'YY YYYY M MM MMM MMMM D DD d dd ddd dddd',
			'H HH h hh a A m mm s ss SSS Z ZZ',
			'Y YYY S SS',
			'YYYY[年]MM[月]DD[日] [YYYY] []',
			'HH点mm分',
			'',
			undefined
		];
		[...DATES, new Date(2024, 4, 5, 0, 5, 9, 7), new Date(2024, 4, 5, 12)].forEach((date) => {
			templates.forEach((template) => {
				expect(ownDayjs(date).format(template)).toBe(realDayjs(date).format(template));
			});
		});
		expect(ownDayjs(null).format('YYYY')).toBe(realDayjs(null).format('YYYY'));
	});

	it('add / subtract', () => {
		DATES.forEach((date) => {
			ADD_UNITS.forEach((unit) => {
				[1, -1, 13, -25, 0.5, 1.5].forEach((amount) => {
					expect([date, unit, amount, serialize(ownDayjs(date).add(amount, unit))])
						.toEqual([date, unit, amount, serialize(realDayjs(date).add(amount, unit))]);
					expect(serialize(ownDayjs(date).subtract(amount, unit))).toBe(serialize(realDayjs(date).subtract(amount, unit)));
				});
			});
		});
	});

	it('startOf', () => {
		DATES.forEach((date) => {
			START_OF_UNITS.forEach((unit) => {
				expect([date, unit, serialize(ownDayjs(date).startOf(unit))]).toEqual([date, unit, serialize(realDayjs(date).startOf(unit))]);
			});
		});
	});
});
