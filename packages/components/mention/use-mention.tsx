/** @jsxImportSource vue */

import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { Component, SetupContext } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import { Popover } from '../popover/index';
import { Textarea } from '../textarea/index';
import { props as textareaProps } from '../textarea/textarea-props';
import { rightProps } from '../input/input-props';
import { emits as textareaEmits } from '../textarea/use-textarea';
import type { TreeData } from '../select/utils';
import { useSuggest, useSuggestHost } from '../suggest';
import type { SuggestOptions } from '../suggest';
import { findMention, insertMention, toPrefixes } from './utils';
import type { MentionMatch } from './utils';
import { useMentionMatch } from './use-mention-match';
import type { Props, MobileProps } from './mention-props';

export const emits = [...textareaEmits, 'select', 'search', 'visible-change'] as const;

// 镜像层照抄文本域的这些样式，文字的排版与文本域一致，前缀所在的节点即光标处的提及位置
const MIRROR_KEYS = [
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontVariant',
	'fontWeight',
	'fontStretch',
	'lineHeight',
	'letterSpacing',
	'wordSpacing',
	'textIndent',
	'textTransform',
	'textAlign',
	'tabSize',
	'direction',
	'wordBreak',
	'overflowWrap'
] as const;

// 只移动光标、不改文字的按键：keyup 时重新找提及（改文字的输入已由 input 处理）
const CARET_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

/**
 * Mention 与 MMention 共用：文本域 + 提及联想
 * 	- 输入、移动光标（方向键等、点击）、聚焦时找出光标处正在输入的提及（见 utils 的 findMention），有则打开联想，搜索词为前缀之后的文字
 * 	- 选中后用 前缀 + value + 分隔符 替换光标处的词，光标移到其后
 * 	- 弹层的锚点：与文本域排版一致的镜像层（不可见）里，前缀所在的节点；文本域滚动时镜像层同步滚动，弹层随之重新定位
 * 	- 镜像层只含打开时前缀之前的文字（打开时取一次）：之后的输入不重渲染它
 * 	- 移动端：同样是跟随光标的下拉，外观与尺寸为 750 稿，按可视区翻转、限高（见 Popover）；不默认高亮
 * 	- Textarea 的属性、事件、方法原样交出，见 useSuggestHost；class / style 在根节点上
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端（MMention）
 * @param options.components 移动端替换的组件（文本域、虚拟列表、加载图标）
 * @returns render
 */
export const useMention = (
	props: Props | MobileProps,
	context: SetupContext<typeof emits[number][]>,
	options: { mobile?: boolean; components?: SuggestOptions['components'] & { Textarea?: Component } } = {}
) => {
	const { emit, expose, slots } = context;
	const mobile = !!options.mobile;
	const it = useAttrs({ merge: false });
	const root = ref<HTMLElement>();
	const mirror = ref<HTMLElement>();
	const popover = ref<{ update: () => void }>();
	const match = shallowRef<MentionMatch | null>(null);
	// 锚点：最近一次提及的前缀与它之前的文字；关闭后保留，弹层的离场动画仍有位置
	const anchorAt = shallowRef({ before: '', prefix: '' });
	const mirrorStyle = shallowRef<Record<string, string>>({});

	const TextareaComponent = (options.components?.Textarea || Textarea) as any;

	const host = useSuggestHost({
		props,
		hostProps: mobile ? { ...textareaProps, ...rightProps } : textareaProps,
		hostEmits: textareaEmits,
		handled: ['focus', 'blur', 'keyup', 'resize'],
		emit,
		expose,
		getSuggest: () => suggest
	});
	const currentValue = host.value;

	const getEl = () => host.getElement<HTMLTextAreaElement>('textarea');

	// 镜像层的滚动与文本域一致，弹层随锚点重新定位
	const syncScroll = () => {
		const el = getEl();
		if (!el || !mirror.value) return;
		mirror.value.scrollTop = el.scrollTop;
		popover.value?.update();
	};

	// 镜像层覆盖在文本域的内容区（不含边框与滚动条）上，照抄排版相关的样式
	const measure = () => {
		const el = getEl();
		if (!el || !root.value) return;
		const source = getComputedStyle(el);
		const rect = el.getBoundingClientRect();
		const rootRect = root.value.getBoundingClientRect();
		const style: Record<string, string> = {
			top: `${rect.top - rootRect.top + el.clientTop}px`,
			left: `${rect.left - rootRect.left + el.clientLeft}px`,
			width: `${el.clientWidth}px`,
			height: `${el.clientHeight}px`
		};
		MIRROR_KEYS.forEach(key => (style[key] = source[key]));
		mirrorStyle.value = style;
	};

	const pickItem = (item: TreeData) => {
		const el = getEl();
		const current = match.value;
		if (!el || !current) return;
		const value = String(item.value ?? '');
		const result = insertMention(currentValue.value, current, value, props.split);
		host.commit(result.text);
		emit('select', { value, item, prefix: current.prefix });
		matcher.apply(null);
		nextTick(() => {
			el.focus();
			el.setSelectionRange(result.caret, result.caret);
		});
	};

	const suggest = useSuggest(() => props, slots, {
		keyword: () => match.value?.keyword ?? '',
		pick: pickItem,
		loadExtra: () => ({ prefix: match.value?.prefix }),
		onVisibleChange: v => emit('visible-change', v),
		mobile,
		components: options.components
	});

	const matcher = useMentionMatch(match, suggest, {
		onSearch: ({ keyword, prefix }) => emit('search', { keyword, prefix }),
		onOpen: ({ start, prefix }) => {
			anchorAt.value = { before: currentValue.value.slice(0, start), prefix };
			measure();
			nextTick(syncScroll);
		}
	});

	// 找出光标处的提及（有选区时没有）
	const detect = () => {
		const el = getEl();
		if (!el || props.disabled) return;
		const { selectionStart, selectionEnd, value } = el;
		matcher.apply(selectionStart === selectionEnd ? findMention(value, selectionStart, toPrefixes(props.prefix), props.split) : null);
	};

	const handleUpdate = (value: string, e?: Event) => {
		host.update(value, e);
		detect();
	};

	const handleKeyup = (e: KeyboardEvent) => {
		!e.isComposing && CARET_KEYS.has(e.key) && detect();
		emit('keyup', e);
	};

	const handleFocus = (...args: any[]) => {
		detect();
		emit('focus', ...args);
	};

	const handleBlur = (...args: any[]) => {
		matcher.clear();
		emit('blur', ...args);
	};

	// 文本域高度变化（autosize、拖动改变大小）：重新测量镜像层
	const handleResize = (...args: any[]) => {
		emit('resize', ...args);
		if (!suggest.active.value) return;
		measure();
		nextTick(syncScroll);
	};

	// 文本域的滚动不冒泡，在根节点上捕获
	const handleScroll = (e: Event) => {
		e.target === getEl() && syncScroll();
	};

	onMounted(() => root.value?.addEventListener('scroll', handleScroll, true));
	onBeforeUnmount(() => root.value?.removeEventListener('scroll', handleScroll, true));

	// 锚点弹层的插槽：同一对象，Mention 重渲染时不必更新弹层
	const anchorSlots = { default: () => anchorAt.value.prefix, content: suggest.renderContent };

	const renderAnchor = () => {
		return (
			<Popover
				ref={popover}
				{...suggest.popover.value}
				tag="span"
				autoWidth
				class="vc-mention__anchor"
			>
				{ anchorSlots }
			</Popover>
		);
	};

	return () => {
		return (
			<div
				ref={root}
				class={[mobile ? 'vc-mention vcm-mention' : 'vc-mention', { 'is-disabled': props.disabled }, it.value.class]}
				style={it.value.style}
			>
				<TextareaComponent
					ref={host.host}
					{...it.value.attrs}
					{...it.value.listeners}
					{...host.binds.value}
					{...host.listeners}
					modelValue={currentValue.value}
					// @ts-ignore
					onUpdate:modelValue={handleUpdate}
					onKeyup={handleKeyup}
					onClick={detect}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onResize={handleResize}
				/>
				<div ref={mirror} class="vc-mention__mirror" style={mirrorStyle.value} aria-hidden="true">
					{ anchorAt.value.before }
					{ renderAnchor() }
				</div>
			</div>
		);
	};
};
