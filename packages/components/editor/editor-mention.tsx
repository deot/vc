/** @jsxImportSource vue */

import { computed, defineComponent, onBeforeUnmount, onMounted, ref, shallowRef, nextTick, watch } from 'vue';
import type { Component, PropType, Slots } from 'vue';
import type Quill from 'quill';
import { Popover } from '../popover/index';
import { useSuggest, SUGGEST_DEFAULTS } from '../suggest';
import type { SuggestConfig } from '../suggest';
import { findMention, toPrefixes } from '../mention/utils';
import type { MentionMatch } from '../mention/utils';
import { useMentionMatch } from '../mention/use-mention-match';
import type { TreeData } from '../select/utils';
import type { EditorMentionOptions } from './editor-props';

const COMPONENT_NAME = 'vc-editor-mention';

// 嵌入节点（图片、提及等）在行文字里的占位：保持下标与编辑器一致，且不算作空白（紧跟在它后面的前缀不触发）
const EMBED_CHAR = '￼';
// 选中后补在提及之后的分隔符
const SPLIT = ' ';

/**
 * Editor / MEditor 的提及（mentionOptions），只在开启时挂载
 * 	- 光标所在行、光标之前的文字里找提及（规则同 Mention），嵌入节点按占位字符计；同一轮的 text-change 与 selection-change 只找一次
 * 	- 选中后删除 前缀 + 搜索词，在原处插入原子的提及节点（vc/mention）与一个空格，光标移到空格之后
 * 	- 弹层的锚点是编辑区里前缀所在位置的绝对定位节点（getBounds）；编辑区滚动时重新定位
 * 	- 移动端同样是下拉，外观与尺寸为 750 稿，按可视区翻转、限高（见 Popover）
 */
export const EditorMention = defineComponent({
	name: COMPONENT_NAME,
	props: {
		editor: {
			type: Object as PropType<Quill>,
			required: true
		},
		// Editor 的根节点：锚点相对它定位
		root: Object as PropType<HTMLElement>,
		options: {
			type: Object as PropType<EditorMentionOptions>,
			required: true
		},
		disabled: Boolean,
		mobile: Boolean,
		components: Object as PropType<{ RecycleList?: Component; Spin?: Component }>
	},
	emits: ['select'],
	setup(props, { emit }) {
		const match = shallowRef<MentionMatch | null>(null);
		const anchorStyle = shallowRef<Record<string, string>>({});
		const popover = ref<{ update: () => void }>();
		const config = computed<SuggestConfig>(() => ({ ...SUGGEST_DEFAULTS, ...props.options }));

		const pick = (item: TreeData) => {
			const quill = props.editor;
			const current = match.value;
			if (!current) return;
			const value = String(item.value ?? '');
			const label = String(item.label ?? item.value ?? '');
			matcher.apply(null);
			quill.deleteText(current.start, current.end - current.start, 'user');
			quill.insertEmbed(current.start, 'vc/mention', { value, label, prefix: current.prefix }, 'user');
			quill.insertText(current.start + 1, SPLIT, 'user');
			quill.setSelection(current.start + 1 + SPLIT.length, 0, 'user');
			emit('select', { value, item, prefix: current.prefix, editor: quill });
		};

		const suggest = useSuggest(() => config.value, {} as Slots, {
			keyword: () => match.value?.keyword ?? '',
			pick,
			loadExtra: () => ({ prefix: match.value?.prefix }),
			mobile: props.mobile,
			components: props.components
		});

		// 前缀所在位置（相对 Editor 根节点）
		const place = () => {
			const current = match.value;
			const bounds = current && props.editor.getBounds(current.start, current.prefix.length);
			if (!bounds || !props.root) return;
			const container = props.editor.container.getBoundingClientRect();
			const rect = props.root.getBoundingClientRect();
			anchorStyle.value = {
				position: 'absolute',
				top: `${container.top - rect.top + bounds.top}px`,
				left: `${container.left - rect.left + bounds.left}px`,
				width: `${bounds.width}px`,
				height: `${bounds.height}px`
			};
		};

		const matcher = useMentionMatch(match, suggest, { onOpen: place });

		// 光标所在行的文字（到行尾，用于找词的结束位置）；嵌入节点按占位字符计
		const getLine = (index: number) => {
			const [line, offset] = props.editor.getLine(index);
			if (!line) return null;
			const start = index - offset;
			const text = props.editor.getContents(start, Math.max(0, line.length() - 1)).ops
				.map(op => (typeof op.insert === 'string' ? op.insert : EMBED_CHAR))
				.join('');
			return { start, offset, text };
		};

		const detect = () => {
			const range = props.disabled ? null : props.editor.getSelection();
			const line = range && !range.length ? getLine(range.index) : null;
			const found = line && findMention(line.text, line.offset, toPrefixes(props.options.prefix ?? '@'), SPLIT);
			if (!line || !found) {
				match.value && matcher.clear();
				return;
			}
			matcher.apply({ ...found, start: line.start + found.start, end: line.start + found.end });
		};

		// 一次输入先后触发 text-change 与 selection-change：合并到同一个微任务里只找一次
		let isPending = false;
		const schedule = () => {
			if (isPending) return;
			isPending = true;
			queueMicrotask(() => {
				isPending = false;
				detect();
			});
		};

		// 编辑区内容滚动：锚点随之移动
		const handleScroll = () => {
			if (!suggest.visible.value) return;
			place();
			nextTick(() => popover.value?.update());
		};

		onMounted(() => {
			props.editor.on('editor-change', schedule);
			props.editor.container.addEventListener('scroll', handleScroll, true);
		});
		onBeforeUnmount(() => {
			props.editor.off('editor-change', schedule);
			props.editor.container.removeEventListener('scroll', handleScroll, true);
			suggest.close();
		});

		watch(() => props.disabled, v => v && matcher.clear());

		const anchorSlots = { default: () => null, content: suggest.renderContent };

		return () => {
			return (
				<Popover
					ref={popover}
					{...suggest.popover.value}
					tag="span"
					autoWidth
					class="vc-editor__mention-anchor"
					style={anchorStyle.value}
				>
					{ anchorSlots }
				</Popover>
			);
		};
	}
});
