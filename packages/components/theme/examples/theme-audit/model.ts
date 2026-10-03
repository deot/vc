export type AuditMode = 'light' | 'dark' | 'system';
export type ParameterKind = 'color' | 'shadow' | 'dimension';
export interface ThemeParameter {
	name: string;
	mode: 'shared' | 'paired';
	kind: ParameterKind;
	light: string;
	dark: string;
}
export interface ThemeChanges {
	shared: Record<string, string>;
	light: Record<string, string>;
	dark: Record<string, string>;
}
export const STORAGE_KEY = 'vc:theme-audit:v2';
export const createChanges = (): ThemeChanges => ({
	shared: {},
	light: {},
	dark: {}
});

export const readParameters = (exports: Record<string, string>): ThemeParameter[] => {
	return Object.keys(exports).filter(key => key.endsWith('__mode')).map((key) => {
		const name = key.slice(0,
			-6);
		return {
			name,
			mode: exports[key] as ThemeParameter['mode'],
			kind: exports[`${name}__kind`] as ParameterKind,
			light: exports[`${name}__light`],
			dark: exports[`${name}__dark`]
		};
	});
};

export const parameterProperty = ({ name, kind }: ThemeParameter) => {
	if (kind === 'color') return 'color';
	if (kind === 'shadow') return 'box-shadow';
	if (name.startsWith('font-size')) return 'font-size';
	if (name.startsWith('line-height')) return 'line-height';
	return 'border-radius';
};

export const validValue = (
	parameter: ThemeParameter,
	value: string,
	supports: (property: string, value: string) => boolean = CSS.supports.bind(CSS)
) => {
	// 导出的是具体 Sass 值，不接受样式注入或依赖其他变量的表达式。
	return !!value.trim()
		&& !/[;{}]|\/\*|\*\//.test(value)
		&& !/\b(var|url|color-mix)\s*\(|^(inherit|initial|unset|revert|currentcolor)$/i.test(value.trim())
		&& supports(parameterProperty(parameter),
			value.trim());
};

export const parameterValue = (parameter: ThemeParameter, changes: ThemeChanges, mode: 'light' | 'dark') => {
	const bucket = parameter.mode === 'shared' ? 'shared' : mode;
	return changes[bucket][parameter.name] ?? parameter[mode];
};

export const setParameter = (parameter: ThemeParameter, changes: ThemeChanges, mode: 'light' | 'dark', value: string) => {
	const bucket = parameter.mode === 'shared' ? 'shared' : mode;
	const normalized = value.trim();
	if (normalized === parameter[mode]) delete changes[bucket][parameter.name];
	else changes[bucket][parameter.name] = normalized;
};

export const restoreParameter = (parameter: ThemeParameter, changes: ThemeChanges) => {
	delete changes.shared[parameter.name];
	delete changes.light[parameter.name];
	delete changes.dark[parameter.name];
};

export const readSaved = (
	raw: string | null,
	parameters: ThemeParameter[],
	supports: (property: string, value: string) => boolean
) => {
	const changes = createChanges();
	let mode: AuditMode = 'light';
	try {
		const saved = JSON.parse(raw || '{}');
		if (['light', 'dark', 'system'].includes(saved.mode)) mode = saved.mode;
		for (const parameter of parameters) {
			const buckets = parameter.mode === 'shared' ? ['shared'] as const : ['light', 'dark'] as const;
			for (const bucket of buckets) {
				const value = saved.changes?.[bucket]?.[parameter.name];
				if (typeof value === 'string' && validValue(parameter,
					value,
					supports)) {
					setParameter(parameter,
						changes,
						bucket === 'shared' ? 'light' : bucket,
						value);
				}
			}
		}
	} catch {
		// 本地存储损坏时恢复默认，保留 demo 的可用性。
	}
	return {
		mode,
		changes
	};
};

export const exportScss = (parameters: ThemeParameter[], changes: ThemeChanges) => {
	const rows = parameters.map((parameter) => {
		const light = parameterValue(parameter,
			changes,
			'light');
		const dark = parameterValue(parameter,
			changes,
			'dark');
		return `\t${parameter.name}: ${parameter.mode === 'paired' ? `(light: ${light}, dark: ${dark})` : light},`;
	});
	return `$theme: (\n${rows.join('\n')}\n) !default;`;
};

export const exportCss = (parameters: ThemeParameter[], changes: ThemeChanges, scope = ':root') => {
	const declarations = (mode: 'light' | 'dark', indent = '\t') => parameters
		.map(parameter => `${indent}--vc-${parameter.name}: ${parameterValue(parameter,
			changes,
			mode)};`).join('\n');
	const pageScope = scope !== ':root';
	const systemSelector = pageScope ? `${scope}:not([data-vc-theme])` : scope;
	const forcedSelector = (mode: string) => pageScope ? `${scope}[data-vc-theme="${mode}"]` : `[data-vc-theme="${mode}"]`;
	return `${systemSelector} {\n${declarations('light')}\n}\n\n@media (prefers-color-scheme: dark) {\n\t${systemSelector} {\n${declarations('dark',
		'\t\t')}\n\t}\n}\n\n${forcedSelector('light')} {\n${declarations('light')}\n}\n\n${forcedSelector('dark')} {\n${declarations('dark')}\n}`;
};
