import type Quill from 'quill';
import type { Parchment } from 'quill';

const MODULE_NAME = 'formats/vc/video';

export const registerVideoBlot = (quillInstance: typeof Quill) => {
	const BlockEmbed = quillInstance.import('blots/block/embed') as typeof Parchment.EmbedBlot;
	// 生成video 标签插入editor中
	class VideoBlot extends BlockEmbed {
		static blotName = 'vc/video';

		static tagName = 'video';

		static create(value: any) {
			const node = super.create() as any; // BlockEmbed
			node.setAttribute('src', value.src);
			node.setAttribute('controls', value.controls || 'controls');
			node.setAttribute('width', value.width || 'auto');
			node.setAttribute('height', value.height || 'auto');
			node.setAttribute('style', value.style || 'max-width: 100%');
			node.setAttribute('webkit-playsinline', true);
			node.setAttribute('playsinline', true);
			node.setAttribute('x5-playsinline', true);
			node.setAttribute('poster', value.poster);
			return node;
		}

		static value(node: any) {
			return {
				url: node.getAttribute('src'),
				controls: node.getAttribute('controls'),
				width: node.getAttribute('width'),
				height: node.getAttribute('height'),
				style: node.getAttribute('style'),
				poster: node.getAttribute('poster'),
			};
		}
	}
	if (quillInstance.imports[MODULE_NAME]) return;
	quillInstance.register(MODULE_NAME, VideoBlot);
};
