/** @jsxImportSource vue */

import { defineComponent, ref, nextTick, watch, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import type Quill from 'quill';
import { Popover } from '../../popover';
import { Input } from '../../input';
import { Button } from '../../button';
import { useLocale } from '../../locale';
import type { PromptMode } from './utils';
import type { EditorComponents } from '../types';

const COMPONENT_NAME = 'vc-editor-prompt';

type Range = { index: number; length: number };

/**
 * 链接、视频地址、公式的输入浮层；光标停在链接里时显示链接预览（打开 / 编辑 / 删除）。
 * 浮层定位在编辑区内对应文字处的锚点上
 */
export const EditorPrompt = defineComponent({
	name: COMPONENT_NAME,
	props: {
		editor: Object as PropType<Quill>,
		disabled: Boolean,
		// 移动端：输入改为底部弹出层，链接预览仍为浮层
		mobile: Boolean,
		components: Object as PropType<Partial<EditorComponents>>
	},
	setup(props, { expose }) {
		const { t } = useLocale();
		const isActive = ref(false);
		const mode = ref<PromptMode | 'preview'>('link');
		const value = ref('');
		const href = ref('');
		const anchor = ref<Record<string, string>>({});
		const input = ref<any>();

		let range: Range | undefined;
		// 移动端输入弹出层
		let leaf: any;
		// 光标所在链接的范围；编辑、删除时作用于整个链接
		let linkRange: Range | undefined;

		const getLinkRange = (quill: Quill, at: Range): Range | undefined => {
			const LinkBlot = (quill.constructor as typeof Quill).import('formats/link') as any;
			const [link, offset] = quill.scroll.descendant(LinkBlot, at.index) as any;
			if (!link) return;
			// 选中文字时，只有完全落在同一个链接里才算
			if (at.length && at.length > link.length() - offset) return;
			return { index: at.index - offset, length: link.length() };
		};

		const position = (quill: Quill, target: Range) => {
			const bounds = quill.getBounds(target.index, target.length);
			if (!bounds) return;
			const { container } = quill;
			anchor.value = {
				top: `${container.offsetTop + bounds.top}px`,
				left: `${container.offsetLeft + bounds.left}px`,
				width: `${bounds.width}px`,
				height: `${bounds.height}px`
			};
		};

		const close = () => {
			isActive.value = false;
			leaf?.wrapper?.toggle?.(false);
			leaf = undefined;
		};

		/**
		 * 打开输入浮层
		 * @param next 输入类型
		 */
		const open = async (next: PromptMode) => {
			const quill = props.editor;
			if (!quill || props.disabled) return;
			range = quill.getSelection(true);
			linkRange = next === 'link' ? getLinkRange(quill, range) : undefined;
			mode.value = next;
			value.value = linkRange ? String(quill.getFormat(linkRange).link || '') : '';
			if (props.mobile && props.components?.Popup) {
				isActive.value = false;
				leaf = props.components.Popup.open({
					title: t(`vc.Editor.${next}`),
					closable: true,
					contentClass: 'vcm-editor-prompt-popup',
					content: renderEditor,
					onClose: () => (leaf = undefined)
				});
			} else {
				position(quill, linkRange || range);
				isActive.value = true;
			}
			await nextTick();
			input.value?.focus();
		};

		const handleSave = () => {
			const quill = props.editor;
			if (!quill || !range) return close();
			const text = value.value.trim();
			if (mode.value === 'link') {
				if (linkRange) {
					quill.formatText(linkRange.index, linkRange.length, 'link', text || false, 'user');
				} else if (!text) {
					// 未输入时不做处理
				} else if (range.length) {
					quill.formatText(range.index, range.length, 'link', text, 'user');
				} else {
					// 没有选中文字：插入地址本身作为链接文字
					quill.insertText(range.index, text, 'link', text, 'user');
					range = { index: range.index + text.length, length: 0 };
				}
			} else if (text) {
				quill.insertEmbed(range.index, mode.value, text, 'user');
				range = { index: range.index + 1, length: 0 };
			}
			close();
			quill.setSelection(range.index + range.length, 0, 'user');
		};

		const handleEdit = () => {
			mode.value === 'preview' && open('link');
		};

		const handleRemove = () => {
			const quill = props.editor;
			if (!quill || !linkRange) return close();
			quill.formatText(linkRange.index, linkRange.length, 'link', false, 'user');
			close();
		};

		const handleKeydown = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			close();
			props.editor?.focus();
		};

		// 光标停在链接里时显示预览，离开时关闭
		const handleSelectionChange = (current: Range | null) => {
			const quill = props.editor;
			if (!quill || !current || leaf || (isActive.value && mode.value !== 'preview')) return;
			const link = current.length ? undefined : getLinkRange(quill, current);
			if (!link || props.disabled) {
				mode.value === 'preview' && close();
				return;
			}
			range = current;
			linkRange = link;
			href.value = String(quill.getFormat(link).link || '');
			mode.value = 'preview';
			position(quill, link);
			isActive.value = true;
		};

		const handleScroll = () => isActive.value && close();

		let off: (() => void) | undefined;
		watch(() => props.editor, (quill) => {
			off?.();
			if (!quill) return;
			quill.on('selection-change', handleSelectionChange);
			quill.container.addEventListener('scroll', handleScroll, true);
			off = () => {
				quill.off('selection-change', handleSelectionChange);
				quill.container.removeEventListener('scroll', handleScroll, true);
			};
		}, { immediate: true });
		onBeforeUnmount(() => off?.());

		expose({ open, close });

		// 输入框：桌面端在浮层里，移动端在底部弹出层里（使用移动端的输入框与按钮）
		const renderEditor = () => {
			const Field: any = (props.mobile && props.components?.Input) || Input;
			const Action: any = (props.mobile && props.components?.Button) || Button;
			return (
				<div class={['vc-editor-prompt', { 'is-mobile': props.mobile }]} onKeydown={handleKeydown}>
					<span class="vc-editor-prompt__label">{t(`vc.Editor.${mode.value}`)}</span>
					<Field
						ref={input}
						modelValue={value.value}
						class="vc-editor-prompt__input"
						allowDispatch={false}
						// placeholder 透传给输入框
						{...{ placeholder: mode.value === 'video' ? t('vc.Editor.videoPlaceholder') : mode.value === 'link' ? 'https://' : '' }}
						onInput={(next: string) => (value.value = next)}
						onEnter={handleSave}
					/>
					<Action size="small" type="primary" onClick={handleSave}>{t('vc.Editor.save')}</Action>
				</div>
			);
		};

		const renderContent = () => {
			if (mode.value === 'preview') {
				return (
					<div class="vc-editor-prompt is-preview">
						<span class="vc-editor-prompt__label">{t('vc.Editor.open')}</span>
						<a class="vc-editor-prompt__link" href={href.value} target="_blank" rel="noopener noreferrer">{href.value}</a>
						<span class="vc-editor-prompt__action" onClick={handleEdit}>{t('vc.Editor.edit')}</span>
						<span class="vc-editor-prompt__action" onClick={handleRemove}>{t('vc.Editor.remove')}</span>
					</div>
				);
			}
			return renderEditor();
		};

		return () => (
			<span class="vc-editor__anchor" style={anchor.value}>
				<Popover
					v-model={isActive.value}
					trigger="custom"
					// 预览随光标出现：点击编辑区移动光标时不当作外部点击关闭，由选区变化决定是否显示
					outsideClickable={mode.value !== 'preview'}
					placement="bottom-left"
					portalClass={['vc-editor-prompt-wrapper', { 'vcm-editor-prompt-wrapper': props.mobile }]}
					class="vc-editor__anchor-target"
				>
					{{ content: renderContent }}
				</Popover>
			</span>
		);
	}
});
