/** @jsxImportSource vue */

import { defineComponent, onUnmounted, onMounted } from 'vue';
import type { PropType } from 'vue';

import * as Load from '@deot/helper-load';
import { getUid } from '@deot/helper-utils';
import { insertFontSizeStyle, insertLineHeightStyle, insertLetterSpacingStyle, previewImages } from './utils';
import { toolbarDefaultsMap } from './default-options';

const COMPONENT_NAME = 'vc-editor-view';

export const EditorView = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: {
			type: String,
			default: undefined
		},

		fontSize: {
			type: Array as PropType<string[]>,
			default: () => toolbarDefaultsMap['font-size']
		},
		lineHeight: {
			type: Array as PropType<string[]>,
			default: () => toolbarDefaultsMap['line-height']
		},
		letterSpacing: {
			type: Array as PropType<string[]>,
			default: () => toolbarDefaultsMap['letter-spacing']
		},
		// 点击内容里的图片是否打开预览
		previewable: {
			type: Boolean,
			default: true
		}
	},
	setup(props) {
		const styleId = getUid('editor-view-style');
		const lineHeightStyleId = getUid('editor-toolbar-style');
		const letterSpacingStyleId = getUid('editor-toolbar-style');

		const handleClick = (e: MouseEvent) => {
			const target = e.target as Element;
			props.previewable && target.nodeName === 'IMG' && previewImages(e.currentTarget as Element, target);
		};

		onMounted(() => {
			insertFontSizeStyle(props.fontSize, styleId);
			insertLineHeightStyle(props.lineHeight, lineHeightStyleId);
			insertLetterSpacingStyle(props.letterSpacing, letterSpacingStyleId);
		});

		onUnmounted(() => {
			Load.removeStyle(styleId);
			Load.removeStyle(lineHeightStyleId);
			Load.removeStyle(letterSpacingStyleId);
		});

		return () => {
			return (
				<div class="vc-editor-view" onClick={handleClick}>
					<div class="ql-editor ql-snow ql-container" innerHTML={props.value} />
				</div>
			);
		};
	}
});
