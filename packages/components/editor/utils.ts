import type Quill from 'quill';
import { ImagePreview } from '../file-preview/image-preview';

/**
 * 预览容器内的全部图片，并定位到被点击的那张；按节点定位，相同地址的图片也能对上。
 * 每张图都作为缩略图传入：切到哪一张，关闭时就回到哪一张
 * @param container 图片所在的容器
 * @param target 被点击的图片
 */
export const previewImages = (container: Element, target: Element) => {
	const images = Array.from(container.querySelectorAll('img'));
	ImagePreview.open({
		current: images.indexOf(target as HTMLImageElement),
		data: images.map(img => ({ source: img.currentSrc || img.src, element: img }))
	});
};

const NBSP = '\u00a0';
// 段落级元素：按其中的文字整体判断空格是否位于开头、结尾
const BLOCK_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, blockquote';

/**
 * getSemanticHTML 会把所有空格转为 &nbsp;，展示时英文无法换行。
 * 这里还原为普通空格：连续空格交替保留 &nbsp;，段首段尾保留 &nbsp;，保证显示宽度不变；
 * pre / code 内的内容原样保留
 * @param body 解析后的内容
 */
const restoreSpaces = (body: HTMLElement) => {
	body.querySelectorAll(BLOCK_SELECTOR).forEach((block) => {
		const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
		// pre / code 内的文字参与判断首尾，但不改动
		const nodes: Array<{ node: Text; fixed: boolean }> = [];
		while (walker.nextNode()) {
			const node = walker.currentNode as Text;
			// 嵌套的段落级元素各自处理
			if (node.parentElement!.closest(BLOCK_SELECTOR) !== block) continue;
			nodes.push({ node, fixed: !!node.parentElement!.closest('pre, code') });
		}
		const length = nodes.reduce((sum, { node }) => sum + node.data.length, 0);
		let index = 0;
		let previous = '';
		nodes.forEach(({ node, fixed }) => {
			let data = '';
			for (const char of node.data) {
				const isSpace = !fixed
					&& char === NBSP
					&& index > 0
					&& index < length - 1
					&& previous !== ' ';
				previous = isSpace ? ' ' : char;
				data += previous;
				index++;
			}
			fixed || (node.data = data);
		});
	});
};

/**
 * getSemanticHTML 生成列表时丢掉了列表项上的段落格式（对齐、行高等），从编辑区的列表项补回。
 * 缩进由嵌套的 ol / ul 表达，不保留 ql-indent-*；缩进跳级时会多出空的 li，数量对不上就不处理
 * @param body 解析后的内容
 * @param root 编辑区根节点
 */
const restoreListFormats = (body: HTMLElement, root: HTMLElement) => {
	const sources = root.querySelectorAll('li');
	const targets = body.querySelectorAll('li');
	if (!sources.length || sources.length !== targets.length) return;
	sources.forEach((source, index) => {
		const target = targets[index];
		const style = source.getAttribute('style');
		style && target.setAttribute('style', style);
		source.classList.forEach(name => !name.startsWith('ql-indent-') && target.classList.add(name));
	});
};

/**
 * 规范 getSemanticHTML 的结果：还原空格，补回列表项格式
 * @param html getSemanticHTML 的结果
 * @param root 编辑区根节点；提供时补回列表项格式
 * @returns ~
 */
export const normalizeHTML = (html: string, root?: HTMLElement) => {
	const hasList = !!root && html.includes('<li');
	if (!html.includes('&nbsp;') && !hasList) return html;
	// 只解析不挂载：DOMParser 得到的文档不执行脚本、不加载资源
	const { body } = new DOMParser().parseFromString(html, 'text/html');
	restoreSpaces(body);
	hasList && restoreListFormats(body, root!);
	return body.innerHTML;
};

/**
 * 编辑器当前内容；空文档返回 ''
 * @param editor Quill 实例
 * @returns ~
 */
export const getEditorHTML = (editor: Quill) => {
	const html = editor.getSemanticHTML();
	return html === '<p><br></p>' ? '' : normalizeHTML(html, editor.root);
};
