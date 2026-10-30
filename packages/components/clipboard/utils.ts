/**
 * 用于清除Dom上选中的文字
 * @returns ~
 */
export const toggleSelection = () => {
	const selection = document.getSelection() as any;
	if (!selection.rangeCount) {
		return () => {};
	}
	let active = document.activeElement as any;

	const ranges = [];
	for (let i = 0; i < selection.rangeCount; i++) {
		// @ts-ignore
		ranges.push(selection.getRangeAt(i));
	}

	switch (active?.tagName.toUpperCase()) { // .toUpperCase handles XHTML
		case 'INPUT':
		case 'TEXTAREA':
			active.blur();
			break;
		default:
			active = null;
			break;
	}

	selection.removeAllRanges();
	return () => {
		selection.type === 'Caret' && selection.removeAllRanges();

		if (!selection.rangeCount) {
			ranges.forEach((range) => {
				selection.addRange(range);
			});
		}
		active && active.focus();
	};
};

/**
 * 复制内容：字符串即纯文本；对象以 MIME 类型为键，一次写入多种格式，如
 * { 'text/plain': text, 'text/html': html }
 */
export type ClipboardValue = string | Record<string, string>;

export const copyToClipboard = (value: ClipboardValue = '') => {
	const data = typeof value === 'string' ? { 'text/plain': value } : value;
	// 在copy事件里写入，保证每种格式都是原样内容，而不是浏览器对选区的序列化
	const handleCopy = (e: ClipboardEvent) => {
		if (!e.clipboardData) return;
		e.preventDefault();
		Object.keys(data).forEach((type) => {
			e.clipboardData!.setData(type, data[type]);
		});
	};

	// 取消用户选中的文字
	const reselectPrevious = toggleSelection();
	const range = document.createRange();
	const selection = document.getSelection()!;

	const mark = document.createElement('span') as any;
	mark.textContent = data['text/plain'] || '';
	// 重置span元素的用户样式
	mark.style.all = 'unset';
	// 防止滚动到页面的末尾
	mark.style.position = 'fixed';
	mark.style.top = 0;
	mark.style.clip = 'rect(0, 0, 0, 0)';
	// 用于保存空格和换行符
	mark.style.whiteSpace = 'pre';
	// 不要继承user-select(可能是“none”)
	mark.style.webkitUserSelect = 'text';
	mark.style.MozUserSelect = 'text';
	mark.style.msUserSelect = 'text';
	mark.style.userSelect = 'text';

	document.body.appendChild(mark);

	// 设置Range的范围，包括referenceNode和它的所有后代(子孙)节点
	range.selectNode(mark);
	selection.addRange(range);
	document.addEventListener('copy', handleCopy);

	let success = false;
	try {
		success = document.execCommand('copy');
	} catch {
		// execCommand不可用时视为失败
	} finally {
		document.removeEventListener('copy', handleCopy);
		if (typeof selection.removeRange == 'function') {
			selection.removeRange(range);
		} else {
			selection.removeAllRanges();
		}
		document.body.removeChild(mark);
		reselectPrevious();
	}
	return success;
};

export const group = {
	get: async () => navigator.clipboard.readText(),
	set: copyToClipboard,
	clear: () => copyToClipboard(''),
	clearSelection: toggleSelection
};
