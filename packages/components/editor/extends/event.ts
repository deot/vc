import type Quill from 'quill';
import { ImagePreview } from '../../image-preview';
import { Upload } from '../../upload';
import { EXTENDS_CONTEXT_KEY } from './constant';
import { recognizer, IMAGE_ACCEPTS, VIDEO_ACCEPTS } from '../../upload-picker/utils';
import type { UploadFile } from '../../upload/types';

const MODULE_NAME = 'modules/EventExtend';

const accepts = {
	image: IMAGE_ACCEPTS,
	video: VIDEO_ACCEPTS
};
export const insertFile = (body: any, context: any) => {
	if (!body.target) {
		body.target = {
			name: body.value?.replace?.(/^.*\/([^/]+)$/, '$1')
		};
	}
	const fileType = recognizer(body.target.name);
	const index = (context.editor.getSelection() || {}).index || context.editor.getLength();
	switch (fileType) {
		case 'image':
			context.editor.insertEmbed(index, 'image', body.value);
			break;
		case 'file':
			context.editor.insertText(index, body.target.name);
			context.editor.setSelection(index, body.target.name.length);
			context.editor.format('link', body.value);
			break;
		case 'video':
			context.editor.insertEmbed(index, 'vc/video', {
				src: body.value,
				poster: context.parent?.poster?.(body.value, fileType) || body.value
			});
			break;
		default :
			break;
	}
	context.editor.setSelection(index + 1);
};
export const uploadFile = (type: File | string, context: any) => {
	const slient = typeof type !== 'string';
	const leaf = Upload.open({
		slient,
		accept: slient ? (void 0) : accepts[type],
		onBegin: context.parent.onLoading,
		onComplete: context.parent.onLoaded,
		onFileSuccess: (response: any, vFile: UploadFile) => {
			const value = response.value || response.source || response.url;
			insertFile({ value, target: vFile.target as File }, context);
		}
	});

	slient && leaf.wrapper?.uploadFiles([type]);
	return leaf;
};
/**
 * 对图片模块的扩展
 * 1. 输入框内可拖入图片文件
 * 2. 输入款内可以粘帖文件
 * 3. 点击图片可预览
 * @param QuillClass ~
 */
export const registerEventModule = (QuillClass: typeof Quill) => {
	if (QuillClass.imports[MODULE_NAME]) return;
	class EventModule {
		editor: Quill;
		options: any;
		spinEl: any;
		parent: any;
		constructor(editor: Quill, options = {}) {
			this.editor = editor;
			this.options = options;
			this.spinEl = null;

			// @ts-ignore
			this.parent = editor.options[EXTENDS_CONTEXT_KEY];
			this.operateDOMEvents('add');
			this.parent.onUnmounted(() => this.operateDOMEvents('remove'));
		}

		operateDOMEvents = (type: string) => {
			const fn = type === 'add' ? this.editor.root.addEventListener : this.editor.root.removeEventListener;
			fn('paste', this.handlePaste, true);
			fn('drop', this.handleDrop, true);
			fn('click', this.handlePreview, true);
		};

		handlePaste = (e: ClipboardEvent) => {
			if (!this.editor.root.contains(e.target as Node)) return;
			if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
				// word复制过来files存在，这里用text做个区分
				const text = e.clipboardData.getData('text');
				if (!text) {
					e.preventDefault();
					this.readFiles(e.clipboardData.files as any);
				}
			}
		};

		handleDrop = (e: any) => {
			if (!this.editor.root.contains(e.target)) return;
			e.preventDefault();
			if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
				if (document.caretRangeFromPoint) {
					const selection = document.getSelection();
					const range = document.caretRangeFromPoint(e.clientX, e.clientY);
					if (selection && range) {
						selection.setBaseAndExtent(range.startContainer, range.startOffset, range.startContainer, range.startOffset);
					}
				}
				this.readFiles(e.dataTransfer.files);
			}
		};

		handlePreview = (e: any) => {
			if (!this.parent.previewable) return;
			const ImageBlot = QuillClass.import('formats/image');
			const current = QuillClass.find(e.target) as any;
			// @ts-ignore
			if (current instanceof ImageBlot) {
				const images = Array.from(this.editor.root.querySelectorAll('.ql-container img')).map((i: any) => i.src);
				ImagePreview.open({
					current: images.findIndex(i => i === current.domNode.src),
					data: images,
				});
			}
		};

		readFiles = (files: any[]) => {
			[].forEach.call(files, (file: any) => {
				if (!file.type && !file.name) return;
				uploadFile(file, this);
			});
		};
	};
	QuillClass.register(MODULE_NAME, EventModule);
};
