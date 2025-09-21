import type Quill from 'quill';
import type { Parchment } from 'quill';

const MODULE_NAME = 'formats/vc/audio';

export const registerAudioBlot = (quillInstance: typeof Quill) => {
	const BlockEmbed = quillInstance.import('blots/block/embed') as typeof Parchment.EmbedBlot;
	// 生成audio 标签插入editor中
	class AudioBlot extends BlockEmbed {
		static blotName = 'vc/audio';

		static tagName = 'audio';

		static create(value: any) {
			const node = super.create() as any; // BlockEmbed
			node.setAttribute('src', value.src);
			node.setAttribute('controls', value.controls || 'controls');
			node.setAttribute('width', value.width || 'auto');
			node.setAttribute('height', value.height || 'auto');
			node.setAttribute('style', value.style || 'max-width: 100%');
			return node;
		}

		static value(node: any) {
			return {
				url: node.getAttribute('src'),
			};
		}
	}
	if (quillInstance.imports[MODULE_NAME]) return;
	quillInstance.register(MODULE_NAME, AudioBlot);
};
