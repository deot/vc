import { enUS, zhCN } from '@deot/vc-locale';

const getLeafPaths = (value: unknown, prefix = ''): string[] => {
	if (typeof value === 'string') return [prefix];
	if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

	return Object.entries(value).flatMap(([key, child]) => {
		return getLeafPaths(child, prefix ? `${prefix}.${key}` : key);
	});
};

const allLeavesAreStrings = (value: unknown): boolean => {
	if (typeof value === 'string') return true;
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

	return Object.values(value).every(allLeavesAreStrings);
};

const getNestedValue = (value: unknown, path: string): unknown => {
	return path.split('.').reduce<unknown>((current, key) => {
		return current && typeof current === 'object'
			? (current as Record<string, unknown>)[key]
			: undefined;
	}, value);
};

describe('locale', () => {
	it('exports side-effect free language data', () => {
		expect(zhCN.name).toBe('zh-CN');
		expect(enUS.name).toBe('en-US');
	});

	it('keeps Calendar locale keys and leaf types aligned', () => {
		const zhCalendar = zhCN.vc.Calendar;
		const enCalendar = enUS.vc.Calendar;

		expect(getLeafPaths(zhCalendar)).toEqual(getLeafPaths(enCalendar));
		expect(allLeavesAreStrings(zhCalendar)).toBe(true);
		expect(allLeavesAreStrings(enCalendar)).toBe(true);
		expect(getNestedValue(zhCalendar, 'months.may')).toBe('五月');
		expect(getNestedValue(enCalendar, 'months.may')).toBe('May');
		expect(getNestedValue(zhCalendar, 'weekdays.sunday')).toBe('日');
		expect(getNestedValue(enCalendar, 'weekdays.sunday')).toBe('Sun');
	});

	it('keeps Modal locale keys and leaf types aligned', () => {
		const zhModal = zhCN.vc.Modal;
		const enModal = enUS.vc.Modal;

		expect(getLeafPaths(zhModal)).toEqual(getLeafPaths(enModal));
		expect(allLeavesAreStrings(zhModal)).toBe(true);
		expect(allLeavesAreStrings(enModal)).toBe(true);
		expect(getNestedValue(zhModal, 'okButtonText')).toBe('确定');
		expect(getNestedValue(enModal, 'okButtonText')).toBe('OK');
		expect(getNestedValue(zhModal, 'cancelButtonText')).toBe('取消');
		expect(getNestedValue(enModal, 'cancelButtonText')).toBe('Cancel');
	});

	it('keeps Image locale keys and leaf types aligned', () => {
		const zhImage = zhCN.vc.Image;
		const enImage = enUS.vc.Image;

		expect(getLeafPaths(zhImage)).toEqual(getLeafPaths(enImage));
		expect(allLeavesAreStrings(zhImage)).toBe(true);
		expect(allLeavesAreStrings(enImage)).toBe(true);
		expect(getNestedValue(zhImage, 'loadError')).toBe('加载失败');
		expect(getNestedValue(enImage, 'loadError')).toBe('Failed to load image');
	});

	it('keeps file preview family keys, leaf types and placeholders aligned', () => {
		for (const name of ['FilePreview', 'ImagePreview']) {
			const zh = zhCN.vc[name];
			const en = enUS.vc[name];
			const paths = getLeafPaths(zh);
			expect(paths.length).toBeGreaterThan(0);
			expect(paths).toEqual(getLeafPaths(en));
			expect(allLeavesAreStrings(zh)).toBe(true);
			expect(allLeavesAreStrings(en)).toBe(true);
			for (const path of paths) {
				const placeholders = (value: unknown) => (String(value).match(/\{\w+\}/g) || []).sort();
				expect(placeholders(getNestedValue(zh, path))).toEqual(placeholders(getNestedValue(en, path)));
			}
		}
	});
});
