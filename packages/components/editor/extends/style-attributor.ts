import type Quill from 'quill';
import { toolbarDefaultsMap } from '../default-options';

type StyleKey = 'font-size' | 'line-height' | 'letter-spacing';

/**
 * 工具栏里某个样式的全部取值（含默认值），用于格式白名单
 * @param toolbar options.toolbar：数组或 { container: [...] }
 * @param key 样式名
 * @returns ~
 */
export const getToolbarValues = (toolbar: any, key: StyleKey): string[] => {
	const values = new Set<string>(toolbarDefaultsMap[key]);
	const walk = (item: any) => {
		if (Array.isArray(item)) return item.forEach(walk);
		if (item && typeof item === 'object' && Array.isArray(item[key])) {
			item[key].forEach((value: any) => value && values.add(String(value)));
		}
	};
	walk(Array.isArray(toolbar) ? toolbar : toolbar?.container);
	return [...values];
};

/**
 * 注册样式格式；已注册时把新取值并入白名单（白名单为同一数组，所有编辑器共用）
 * @param QuillClass ~
 * @param key 样式名
 * @param scope INLINE 作用于选中文字，BLOCK 作用于整段
 * @param values 允许的取值
 */
export const registerStyleAttributor = (
	QuillClass: typeof Quill,
	key: StyleKey,
	scope: 'INLINE' | 'BLOCK',
	values: string[] = toolbarDefaultsMap[key]
) => {
	const Parchment = QuillClass.import('parchment') as any;
	// 浏览器读回样式时会规范数值（如 2.0 → 2），两种写法都要放行
	const whitelist = [...new Set(values.flatMap(value => [value, value.replace(/^-?[\d.]+/, n => String(parseFloat(n)))]))];
	const name = `formats/${key}`;
	const existing = QuillClass.imports[name] as any;
	if (existing?.whitelist && existing.scope === Parchment.Scope[`${scope}_ATTRIBUTE`]) {
		whitelist.forEach(value => !existing.whitelist.includes(value) && existing.whitelist.push(value));
		return;
	}
	QuillClass.register({
		[name]: new Parchment.StyleAttributor(key, key, { scope: Parchment.Scope[scope], whitelist })
	}, true);
};
