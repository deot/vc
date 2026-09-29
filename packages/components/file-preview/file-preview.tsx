/** @jsxImportSource vue */

import { defineComponent, computed, getCurrentInstance } from 'vue';
import { Image } from '../image/index';
import { props as filePreviewProps } from './file-preview-props';
import { FILE_TYPES, getFileExtension, normalize } from './utils';
import { open } from './open';
import type { FilePreviewItem } from './types';

const COMPONENT_NAME = 'vc-file-preview';

export const FilePreview = defineComponent({
	name: COMPONENT_NAME,
	props: filePreviewProps,
	setup(props, { slots }) {
		const instance = getCurrentInstance()!;
		const list = computed(() => normalize(props.data));

		// 分组时仍使用data中的原始索引，预览顺序与混编一致
		const groups = computed(() => {
			if (props.type !== 'group') return [];
			const buckets = FILE_TYPES.map(() => [] as { row: FilePreviewItem; index: number }[]);
			list.value.forEach((row, index) => buckets[FILE_TYPES.indexOf(row.type)].push({ row, index }));
			return buckets.filter(group => group.length);
		});

		const preview = (index: number) => open({ data: list.value, current: index, instance });

		const renderThumbnail = (row: FilePreviewItem, className: string) => {
			return (
				<Image
					// @ts-ignore
					src={row.type === 'image' ? row.source : row.thumbnail}
					thumbnail={row.type === 'image' ? row.thumbnail : undefined}
					fit="cover"
					previewable={false}
					class={className}
				/>
			);
		};

		// group中的图片、视频使用方格
		const renderSquare = (row: FilePreviewItem) => {
			return (
				<div class="vc-file-preview__square">
					{
						row.type === 'image' || row.thumbnail
							? renderThumbnail(row, 'vc-file-preview__media')
							: <video src={row.source} class="vc-file-preview__media" preload="metadata" muted playsinline />
					}
					{ row.type === 'video' && <span class="vc-file-preview__play" /> }
				</div>
			);
		};

		const renderCard = (row: FilePreviewItem) => {
			const isGroup = props.type === 'group';
			const extension = isGroup && row.type === 'file'
				? getFileExtension(row.name) || getFileExtension(row.source)
				: '';
			// group中的图片、视频走方格，这里只有mix会带缩略图
			const hasThumbnail = row.type === 'image' || (row.type === 'video' && !!row.thumbnail);
			return (
				<div class={[{ 'is-thumbnail': hasThumbnail }, 'vc-file-preview__card']}>
					{ hasThumbnail && renderThumbnail(row, 'vc-file-preview__thumbnail') }
					{ isGroup && row.type === 'audio' && <span class="vc-file-preview__dot" /> }
					{ extension && <span class="vc-file-preview__extension">{extension}</span> }
					<span class="vc-file-preview__name">{row.name}</span>
				</div>
			);
		};

		const renderItem = (row: FilePreviewItem, index: number) => {
			const isSquare = props.type === 'group' && (row.type === 'image' || row.type === 'video');
			// 使用插槽时由插槽调用preview，外层不再绑定点击
			const clickable = !slots.default && props.previewable;
			return (
				<div
					key={`${index}-${row.source}`}
					title={row.name}
					class={[`is-${row.type}`, { 'is-previewable': clickable }, 'vc-file-preview__item']}
					onClick={clickable ? () => preview(index) : undefined}
				>
					{
						slots.default
							? slots.default({ row, index, preview: () => preview(index) })
							: isSquare ? renderSquare(row) : renderCard(row)
					}
				</div>
			);
		};

		return () => {
			return (
				<div class={[`is-${props.type}`, `is-${props.size}`, { 'is-vertical': props.vertical }, 'vc-file-preview']}>
					{
						props.type === 'group'
							? groups.value.map(group => (
									<div key={group[0].row.type} class={[`is-${group[0].row.type}`, 'vc-file-preview__group']}>
										{ group.map(({ row, index }) => renderItem(row, index)) }
									</div>
								))
							: list.value.map((row, index) => renderItem(row, index))
					}
				</div>
			);
		};
	}
});
