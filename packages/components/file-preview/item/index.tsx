/** @jsxImportSource vue */

import type { VNode, VNodeChild, VNodeRef } from 'vue';
import { Image } from '../../image/index';
import { Icon } from '../../icon/index';
import { getItemExtension } from '../utils';
import type { FilePreviewFileType } from '../types';

/**
 * FilePreview 与 UploadPicker 共用的文件项：整行（row）与方格（tile），以及 list / grid / group 三种布局
 * 写成渲染函数，不额外创建组件实例；外层的类名、点击、ref 由调用方传入
 */

export const FILE_ITEM_LAYOUTS = ['list', 'grid', 'group'] as const;
export const FILE_ITEM_SIZES = ['mini', 'small', 'medium', 'large'] as const;
export type FileItemLayout = typeof FILE_ITEM_LAYOUTS[number];
export type FileItemSize = typeof FILE_ITEM_SIZES[number];
export type FileItemKind = 'row' | 'tile';

export interface FileItemView {
	type: FilePreviewFileType;
	// 上传中、失败时可能还没有地址
	source?: string;
	name?: string;
	thumbnail?: string;
}

export interface FileItemOptions {
	key?: string | number;
	class?: unknown;
	title?: string;
	ref?: VNodeRef;
	// 传了点击时加 is-clickable：光标为手形，整行悬停加深
	onClick?: (e: MouseEvent) => void;
	// 右侧（整行）或覆盖层（方格）：上传进度、失败与重试等
	extra?: VNodeChild;
	// 右上角：删除等
	action?: VNodeChild;
	// 整行底部的进度条
	progress?: VNodeChild;
}

const isMedia = (type: FilePreviewFileType) => type === 'image' || type === 'video';

/**
 * 按出现的类型自动选择布局：只有图片、视频用 grid，只有音频、文件用 list，两者都有用 group；没有时按 grid
 * @param types 出现的类型
 * @returns 布局
 */
export const resolveLayout = (types: FilePreviewFileType[]): FileItemLayout => {
	const media = types.some(isMedia);
	const files = types.some(type => !isMedia(type));
	if (media && files) return 'group';
	return files ? 'list' : 'grid';
};

/**
 * group 时先放图片、视频，再放音频、文件；各自保留原来的先后
 * @param items 列表
 * @param typeOf 取类型
 * @returns [媒体, 其它]
 */
export const splitGroup = <T, >(items: T[], typeOf: (item: T) => FilePreviewFileType) => {
	const media: T[] = [];
	const others: T[] = [];
	items.forEach(item => (isMedia(typeOf(item)) ? media : others).push(item));
	return [media, others] as const;
};

// 图片用自身（或 thumbnail），视频用 thumbnail，没有时取首帧
const renderMedia = (row: FileItemView, block: string) => {
	if (!row.source && !row.thumbnail) return null;
	if (row.type === 'image' || row.thumbnail) {
		return (
			<Image
				// @ts-ignore
				src={row.type === 'image' ? row.source : row.thumbnail}
				thumbnail={row.type === 'image' ? row.thumbnail : undefined}
				fit="cover"
				previewable={false}
				class={`${block}__image`}
			/>
		);
	}
	return <video src={row.source} class={`${block}__image`} preload="metadata" muted playsinline />;
};

// 音频、文件的标记：文件有扩展名时显示扩展名，否则为图标
const renderSign = (row: FileItemView, block: string) => {
	const extension = row.type === 'file' && getItemExtension(row);
	return extension
		? <span class={`${block}__ext`}>{extension}</span>
		: <Icon type={row.type === 'audio' ? 'toplay' : 'file'} class={`${block}__icon`} />;
};

// 整行：缩略图或标记、文件名
const renderRowContent = (row: FileItemView) => [
	isMedia(row.type)
		? <span class="vc-file-row__media">{renderMedia(row, 'vc-file-row')}</span>
		: renderSign(row, 'vc-file-row'),
	<span class="vc-file-row__name">{row.name}</span>
];

// 方格：图片、视频铺满（视频带播放标记）；音频、文件为标记加两行文件名
const renderTileContent = (row: FileItemView) => (
	isMedia(row.type)
		? (
				<span class="vc-file-tile__media">
					{renderMedia(row, 'vc-file-tile')}
					{ row.type === 'video' && row.source && <span class="vc-file-tile__play" /> }
				</span>
			)
		: (
				<span class="vc-file-tile__file">
					{renderSign(row, 'vc-file-tile')}
					<span class="vc-file-tile__name">{row.name}</span>
				</span>
			)
);

/**
 * 一个文件项：整行或方格，外层、右侧内容、右上角操作、整行底部进度写一次
 * @param row 文件项
 * @param kind row 整行，tile 方格
 * @param options 外层与插槽
 * @returns VNode
 */
export const renderFileItem = (row: FileItemView, kind: FileItemKind, options: FileItemOptions = {}) => {
	const block = `vc-file-${kind}`;
	return (
		<div
			key={options.key}
			ref={options.ref}
			title={options.title}
			class={[block, `is-${row.type}`, { 'is-clickable': !!options.onClick }, options.class]}
			onClick={options.onClick}
		>
			{ kind === 'row' ? renderRowContent(row) : renderTileContent(row) }
			{ options.extra }
			{ options.action }
			{ options.progress && <span class="vc-file-row__track">{options.progress}</span> }
		</div>
	);
};

export interface FileItemsOptions<T> {
	class?: unknown;
	layout: FileItemLayout;
	tileSize: FileItemSize;
	rowSize: FileItemSize;
	// 全部项；group 时为拆好的媒体与其它
	items: T[];
	media?: T[];
	others?: T[];
	// 渲染一块（grid 或 list）里的项
	block: (items: T[], kind: FileItemKind) => VNodeChild;
	// 列表上方的内容；grid 时方格末尾的内容（如上传入口）
	head?: VNodeChild;
	tail?: VNodeChild;
	// 布局之外的内容，如隐藏的上传控件
	extra?: VNodeChild;
}

/**
 * 三种布局：grid 一块方格；list 一块整行；group 方格在前、整行在后，空的一块不渲染
 * 根节点带 vc-file-items 与 is-<layout>、is-tile-<size>、is-row-<size>，尺寸变量由此写入
 * @param options ~
 * @returns VNode
 */
export const renderFileItems = <T, >(options: FileItemsOptions<T>): VNode => {
	const { layout, items, media = [], others = [], block } = options;
	return (
		<div class={[options.class, 'vc-file-items', `is-${layout}`, `is-tile-${options.tileSize}`, `is-row-${options.rowSize}`]}>
			{ options.head }
			{
				layout === 'grid'
					? (
							<div class="vc-file-grid">
								{block(items, 'tile')}
								{options.tail}
							</div>
						)
					: layout === 'list'
						? items.length > 0 && <div class="vc-file-list">{block(items, 'row')}</div>
						: [
								media.length > 0 && <div class="vc-file-grid">{block(media, 'tile')}</div>,
								others.length > 0 && <div class="vc-file-list">{block(others, 'row')}</div>
							]
			}
			{ options.extra }
		</div>
	);
};

// 查看器放大的起点：缩略图所在的那块，没有时用这一项本身
export const MEDIA_SELECTOR = '.vc-file-tile__media, .vc-file-row__media';
