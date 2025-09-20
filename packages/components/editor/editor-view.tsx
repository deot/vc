/** @jsxImportSource vue */

import { defineComponent, computed, onUnmounted, onMounted } from 'vue';
import type { PropType } from 'vue';

import * as Load from '@deot/helper-load';
import { getUid } from '@deot/helper-utils';
import { ImagePreview } from '../image-preview/index';
import { insertFontSizeStyle, insertLineHeightStyle, insertLetterSpacingStyle } from './utils';
import { toolbarDefaultsMap } from './default-options';

const COMPONENT_NAME = 'vc-editor-view';

const setImages = (v: string) => {
	if (!v) return;

	const IMG_REGX = /<img.*?(?:>|\/>)/gi;
	const SRC_REGX = /src=[\'\"]?([^\'\"]*)[\'\"]?/i;

	const imgs = v.match(IMG_REGX);
	if (imgs) {
		const imgUrls: string[] = [];
		for (let i = 0; i < imgs.length; i++) {
			const src = imgs[i].match(SRC_REGX);
			// 获取图片地址
			src?.[1] && imgUrls.push(src?.[1]);
		}
		return imgUrls;
	}

	return;
};

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
	},
	setup(props) {
		const styleId = getUid('editor-view-style');
		const lineHeightStyleId = getUid('editor-toolbar-style');
		const letterSpacingStyleId = getUid('editor-toolbar-style');

		// value
		const currentValue = computed(() => {
			return props.value || '';
		});

		const currentImages = computed(() => {
			return setImages(currentValue.value) || [];
		});

		const initListener = () => {
			const dom = document.getElementsByClassName('ql-editor');
			Array.from(dom).forEach((it: any) => {
				if (it.parentNode.className.indexOf('vc-quilleditor-view ql-snow') !== -1) {
					it.addEventListener('click', (e: any) => {
						if (e.target.nodeName === 'IMG') {
							const index = (currentImages.value).indexOf(e.target.currentSrc);
							ImagePreview.open({
								current: index,
								data: currentImages.value
							});
						}
					});
				}
			});
		};

		onMounted(() => {
			insertFontSizeStyle(props.fontSize, styleId);
			insertLineHeightStyle(props.lineHeight, lineHeightStyleId);
			insertLetterSpacingStyle(props.letterSpacing, letterSpacingStyleId);

			initListener();
		});

		onUnmounted(() => {
			Load.removeStyle(styleId);
			Load.removeStyle(lineHeightStyleId);
			Load.removeStyle(letterSpacingStyleId);
		});

		return () => {
			return (
				<div class="vc-editor-view">
					<div class="ql-editor ql-snow ql-container" innerHTML={currentValue.value} />
				</div>
			);
		};
	}
});
