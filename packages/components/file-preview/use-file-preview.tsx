/** @jsxImportSource vue */

import { computed, getCurrentInstance } from 'vue';
import type { SetupContext } from 'vue';
import type { Props } from './file-preview-props';
import { normalize } from './utils';
import { MEDIA_SELECTOR, renderFileItem, renderFileItems, resolveLayout, splitGroup } from './item';
import type { FileItemKind } from './item';
import { open } from './open';
import type { FilePreviewItem } from './types';

interface Entry {
	row: FilePreviewItem;
	// data 中的原始索引：group 只改变显示的位置，预览顺序不变
	index: number;
}

/**
 * FilePreview 与 MFilePreview 共用的状态与渲染
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MFilePreview）：根节点加标记类 vcm-file-preview、vcm-file-items，尺寸按 750 稿覆盖；预览打开移动端查看器
 * @returns render
 */
export const useFilePreview = (props: Props, { slots }: SetupContext, options: { mobile?: boolean } = {}) => {
	const name = options.mobile ? 'vc-file-preview vcm-file-preview vcm-file-items' : 'vc-file-preview';
	const instance = getCurrentInstance()!;

	// 列表、布局与 group 的拆分只在 data、type 变化时计算
	const sections = computed(() => {
		const entries: Entry[] = normalize(props.data).map((row, index) => ({ row, index }));
		const layout = props.type || resolveLayout(entries.map(entry => entry.row.type));
		const [media, others] = layout === 'group' ? splitGroup(entries, entry => entry.row.type) : [];
		return { entries, layout, media, others };
	});

	// 查看器从各项看得到的那块放大打开，切到哪一项关闭时就回到哪一项：方格、整行里的缩略图，其余用这一项本身
	const items: Array<Element | null> = [];
	const elementOf = (item: Element | null) => item?.querySelector(MEDIA_SELECTOR) ?? item;
	// 点在缩略图上从缩略图放大；点在同一项的其它位置（名称、空白）时，缩略图只是项的开头，改从这一项开始
	const preview = (index: number, e?: MouseEvent) => {
		const data = sections.value.entries.map(({ row }, i) => ({ ...row, element: elementOf(items[i]) }));
		open({
			data,
			current: index,
			instance,
			triggerElement: e && !data[index].element?.contains(e.target as Node) ? items[index] : undefined,
			placeholder: props.placeholder,
			mobile: options.mobile
		});
	};

	const renderItem = ({ row, index }: Entry, kind: FileItemKind) => {
		const setRef = (el: unknown) => {
			items[index] = el as Element | null;
		};
		// 使用插槽时由插槽调用 preview，外层不再绑定点击
		if (slots.default) {
			return (
				<div key={`${index}-${row.source}`} ref={setRef} title={row.name} class={`vc-file-preview__item is-${row.type}`}>
					{slots.default({ row, index, preview: () => preview(index) })}
				</div>
			);
		}
		return renderFileItem(row, kind, {
			key: `${index}-${row.source}`,
			ref: setRef,
			title: row.name,
			class: 'vc-file-preview__item',
			onClick: props.previewable ? (e: MouseEvent) => preview(index, e) : undefined
		});
	};

	const renderBlock = (entries: Entry[], kind: FileItemKind) => entries.map(entry => renderItem(entry, kind));

	return () => {
		const { entries, layout, media, others } = sections.value;
		return renderFileItems({
			class: name,
			layout,
			tileSize: props.size,
			rowSize: props.size,
			items: entries,
			media,
			others,
			block: renderBlock
		});
	};
};
