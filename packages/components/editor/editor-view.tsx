/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { Customer } from '../customer';
import { previewImages } from './utils';

const COMPONENT_NAME = 'vc-editor-view';

export const EditorView = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: {
			type: String,
			default: undefined
		},
		// 点击内容里的图片是否打开预览
		previewable: {
			type: Boolean,
			default: true
		}
	},
	setup(props) {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Element;
			props.previewable && target.nodeName === 'IMG' && previewImages(e.currentTarget as Element, target);
		};

		return () => {
			return (
				<div class="vc-editor-view" onClick={handleClick}>
					<Customer
						wrap
						class="ql-editor ql-snow ql-container"
						// 富文本内容本身就是 HTML
						render={{ type: 'html', value: props.value }}
					/>
				</div>
			);
		};
	}
});
