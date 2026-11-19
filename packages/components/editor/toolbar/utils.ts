import type { PickerType } from '../../upload-picker/types';
import { defaults, toolbarDefaultsMap } from '../default-options';

export type FormatValue = string | number | boolean;

// 弹出输入框的工具：链接、嵌入视频地址、公式
export type PromptMode = 'link' | 'video' | 'formula';

export type ToolbarItem
	= | { type: 'button'; name: string; value?: FormatValue }
		| { type: 'select'; name: string; options: FormatValue[] }
		| { type: 'color'; name: 'color' | 'background'; options: FormatValue[] }
		| { type: 'upload'; value: PickerType }
		| { type: 'prompt'; name: PromptMode }
		| { type: 'action'; name: 'undo' | 'redo' | 'clean' };

const PROMPTS = ['link', 'video', 'formula'];
const ACTIONS = ['undo', 'redo', 'clean'];
const COLORS = ['color', 'background'];

/**
 * 选择项的取值：'selected' 与空值表示默认（清除该格式），统一为 false
 * @param values 配置的取值
 * @returns ~
 */
const toOptions = (values: any[]): FormatValue[] => values.map(value => (value === 'selected' || !value ? false : value));

const toItem = (item: any): ToolbarItem | undefined => {
	if (typeof item === 'string') {
		if (item.startsWith('upload/')) return { type: 'upload', value: item.split('/')[1] as PickerType };
		if (ACTIONS.includes(item)) return { type: 'action', name: item as any };
		if (PROMPTS.includes(item)) return { type: 'prompt', name: item as PromptMode };
		// 内置图片按钮走上传，不插入 base64
		if (item === 'image') return { type: 'upload', value: 'image' };
		if (!toolbarDefaultsMap[item]) return { type: 'button', name: item };
		item = { [item]: toolbarDefaultsMap[item] };
	}
	if (!item || typeof item !== 'object') return;
	const [name, value] = Object.entries<any>(item)[0] || [];
	if (!name) return;
	if (Array.isArray(value)) {
		const options = toOptions(value.length ? value : (toolbarDefaultsMap[name] || []));
		return COLORS.includes(name)
			? { type: 'color', name: name as any, options }
			: { type: 'select', name, options };
	}
	return { type: 'button', name, value };
};

/**
 * 解析 options.toolbar：数组或 { container: [...] }；
 * 顶层的数组为一组，相邻的散项合成一组
 * @param toolbar ~
 * @returns 分组后的工具
 */
export const parseToolbar = (toolbar: any): ToolbarItem[][] => {
	const source = Array.isArray(toolbar)
		? toolbar
		: Array.isArray(toolbar?.container) ? toolbar.container : defaults.toolbar;
	const groups: ToolbarItem[][] = [];
	let loose: ToolbarItem[] | undefined;
	source.forEach((entry: any) => {
		if (Array.isArray(entry)) {
			loose = undefined;
			const group = entry.flat(Infinity).map(toItem).filter(Boolean) as ToolbarItem[];
			group.length && groups.push(group);
			return;
		}
		const item = toItem(entry);
		if (!item) return;
		if (!loose) groups.push(loose = []);
		loose.push(item);
	});
	return groups;
};

// 图标：格式名 → 图标类型；带取值的按钮按取值区分
export const ICONS: Record<string, string | Record<string, string>> = {
	'bold': 'bold',
	'italic': 'italic',
	'underline': 'underline',
	'strike': 'strike',
	'blockquote': 'blockquote',
	'code': 'code',
	'code-block': 'code-block',
	'header': { 1: 'header-1', 2: 'header-2' },
	'list': { ordered: 'list-order', bullet: 'list-bullet', check: 'list-check' },
	'script': { sub: 'subscript', super: 'superscript' },
	'indent': { '+1': 'indent', '-1': 'outdent' },
	'direction': { rtl: 'right-to-left' },
	'align': { false: 'align-left', center: 'align-center', right: 'align-right', justify: 'align-justify' },
	'clean': 'clean',
	'link': 'link',
	'video': 'video',
	'formula': 'formula',
	'undo': 'undo',
	'redo': 'redo',
	'color': 'font-color',
	'background': 'background-color'
};

export const UPLOAD_ICONS: Record<string, string> = {
	image: 'image',
	video: 'video',
	file: 'file',
	audio: 'file'
};

export const getIcon = (name: string, value?: FormatValue) => {
	const icon = ICONS[name];
	return typeof icon === 'object' ? icon[String(value ?? false)] : icon;
};
