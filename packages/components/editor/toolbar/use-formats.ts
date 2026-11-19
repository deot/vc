import { shallowRef, watch, onBeforeUnmount } from 'vue';
import type { ShallowRef } from 'vue';
import type Quill from 'quill';
import type { FormatValue } from './utils';

export type Formats = Record<string, any>;

const isSame = (a: Formats, b: Formats) => {
	const keys = Object.keys(a);
	return keys.length === Object.keys(b).length && keys.every(key => String(a[key]) === String(b[key]));
};

/**
 * 当前选区的格式与应用格式；供工具栏和 toolbar 插槽使用
 * @param editor Quill 实例
 * @param isDisabled 是否禁用
 * @returns ~
 */
export const useFormats = (editor: ShallowRef<Quill | undefined>, isDisabled: () => boolean) => {
	const formats = shallowRef<Formats>({});

	// 失焦时保留最后一次的格式，避免工具栏状态闪烁
	const refresh = () => {
		const quill = editor.value;
		const range = quill?.getSelection();
		if (!quill || !range) return;
		const next = quill.getFormat(range);
		isSame(next, formats.value) || (formats.value = next);
	};

	let off: (() => void) | undefined;
	watch(editor, (quill) => {
		off?.();
		if (!quill) return;
		quill.on('editor-change', refresh);
		off = () => quill.off('editor-change', refresh);
	}, { immediate: true });
	onBeforeUnmount(() => off?.());

	/**
	 * 应用格式
	 * - 按钮（toggle 为 true）：与当前取值相同则清除，否则设置
	 * - 选择项：false 表示清除
	 * @param name 格式名
	 * @param value 取值；按钮不带取值时为开关
	 * @param toggle 是否按按钮切换
	 */
	const format = (name: string, value?: FormatValue, toggle = false) => {
		const quill = editor.value;
		if (!quill || isDisabled()) return;
		const range = quill.getSelection(true);
		const current = quill.getFormat(range)[name];
		let next: any = value ?? true;

		if (name === 'clean') {
			// 没有选中文字时只清除光标处的行内格式
			if (range.length) {
				quill.removeFormat(range.index, range.length, 'user');
			} else {
				const { Scope } = (quill.constructor as typeof Quill).import('parchment') as any;
				Object.keys(quill.getFormat(range)).forEach((key) => {
					quill.scroll.query(key, Scope.INLINE) && quill.format(key, false, 'user');
				});
			}
		} else if (name === 'indent') {
			const step = (value === '+1' ? 1 : -1) * (quill.getFormat(range).direction === 'rtl' ? -1 : 1);
			quill.format('indent', step > 0 ? '+1' : '-1', 'user');
		} else {
			if (toggle) {
				if (name === 'list' && value === 'check') {
					next = current === 'checked' || current === 'unchecked' ? false : 'unchecked';
				} else {
					next = String(current) === String(next) ? false : next;
				}
			}
			// 从左到右切到从右到左时一并右对齐，反向时取消
			if (name === 'direction') {
				const align = quill.getFormat(range).align;
				if (next === 'rtl' && !align) {
					quill.format('align', 'right', 'user');
				} else if (!next && align === 'right') {
					quill.format('align', false, 'user');
				}
			}
			quill.format(name, next, 'user');
		}
		refresh();
	};

	/**
	 * 按钮是否处于激活状态
	 * @param name 格式名
	 * @param value 按钮取值
	 * @returns ~
	 */
	const isActive = (name: string, value?: FormatValue) => {
		const current = formats.value[name];
		if (value === undefined) return !!current;
		if (name === 'list' && value === 'check') return current === 'checked' || current === 'unchecked';
		return String(current) === String(value);
	};

	return {
		formats,
		format,
		isActive,
		refresh
	};
};
