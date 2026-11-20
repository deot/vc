import type Quill from 'quill';
import type { Parchment } from 'quill';
import { escape } from 'lodash-es';

const MODULE_NAME = 'formats/vc/mention';
export const MENTION_CLASS = 'vc-editor-mention';
// Quill 在内联嵌入节点两侧放的占位字符
const GUARD = /\uFEFF/g;

export interface MentionValue {
	value: string;
	prefix: string;
	label: string;
}

/**
 * 节点上的提及：value / prefix 在 data-* 上，显示的文字为 前缀 + label
 * @param node ~
 * @returns ~
 */
export const readMention = (node: HTMLElement): MentionValue => {
	const prefix = node.dataset.prefix || '';
	const text = (node.textContent || '').replace(GUARD, '');
	return {
		value: node.dataset.value || '',
		prefix,
		label: text.startsWith(prefix) ? text.slice(prefix.length) : text
	};
};

/**
 * 提及：原子的内联节点（整体选中、整体删除），保存 value（如成员 id）与显示的文字
 * 输出的 HTML：<span class="vc-editor-mention" data-value="…" data-prefix="@">@文字</span>；粘贴、回填同样的 HTML 时还原为提及
 * @param quillInstance Quill 构造器
 */
export const registerMentionBlot = (quillInstance: typeof Quill) => {
	if (quillInstance.imports[MODULE_NAME]) return;
	const Embed = quillInstance.import('blots/embed') as typeof Parchment.EmbedBlot;

	class MentionBlot extends Embed {
		static blotName = 'vc/mention';

		static tagName = 'span';

		static className = MENTION_CLASS;

		static create(data: MentionValue) {
			const node = super.create() as HTMLElement;
			node.dataset.value = String(data.value ?? '');
			node.dataset.prefix = data.prefix || '';
			node.textContent = `${data.prefix || ''}${data.label ?? data.value ?? ''}`;
			return node;
		}

		static value(node: HTMLElement) {
			return readMention(node);
		}

		// getSemanticHTML：不带编辑用的占位字符与 contenteditable 节点
		html() {
			const { value, prefix, label } = readMention(this.domNode as HTMLElement);
			return `<span class="${MENTION_CLASS}" data-value="${escape(value)}" data-prefix="${escape(prefix)}">${escape(prefix + label)}</span>`;
		}
	}

	quillInstance.register(MODULE_NAME, MentionBlot);
};

/**
 * 富文本（HTML）中的提及，按出现顺序；如提交时取出要通知的成员
 * @param html Editor 的值
 * @returns ~
 */
export const getMentions = (html: string): MentionValue[] => {
	if (!html || !html.includes(MENTION_CLASS)) return [];
	const { body } = new DOMParser().parseFromString(html, 'text/html');
	return Array.from(body.querySelectorAll<HTMLElement>(`span.${MENTION_CLASS}`)).map(readMention);
};
