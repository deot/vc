/** @jsxImportSource vue */

import { Customer } from '../customer';
import { previewImages } from './utils';
import type { EditorComponents } from './types';
import type { Props } from './editor-view-props';

/**
 * EditorView 与 MEditorView 共用的渲染
 * @param props ~
 * @param options ~
 * @param options.mobile 移动端（MEditorView）：根节点加标记类 vcm-editor-view，字号随 --vc-rem 缩放
 * @param options.components 移动端的图片预览
 * @returns render
 */
export const useEditorView = (
	props: Props,
	options: { mobile?: boolean; components?: Pick<Partial<EditorComponents>, 'ImagePreview'> } = {}
) => {
	const name = options.mobile ? 'vc-editor-view vcm-editor-view' : 'vc-editor-view';
	const handleClick = (e: MouseEvent) => {
		const target = e.target as Element;
		props.previewable
		&& target.nodeName === 'IMG'
		&& previewImages(e.currentTarget as Element, target, options.components?.ImagePreview);
	};

	return () => {
		return (
			<div class={name} onClick={handleClick}>
				<Customer
					wrap
					class="ql-editor ql-container"
					// 富文本内容本身就是 HTML
					render={{ type: 'html', value: props.value }}
				/>
			</div>
		);
	};
};
