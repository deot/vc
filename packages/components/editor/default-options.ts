import { IS_SERVER } from '@deot/vc-shared';
import type { QuillOptions } from 'quill';

interface Options extends QuillOptions {
	toolbar: any[];
}

export const toolbarDefaultsMap = {
	'font-size': ['12px', '14px', '16px', '18px', '20px', '22px', '24px', '50px'],
	'header': [1, 2, 3, 4, 5, 6, 'selected'],
	'color': [
		'selected', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc',
		'#9933ff', '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc',
		'#cce0f5', '#ebd6ff', '#bbbbbb', '#f06666', '#ffc266', '#ffff66',
		'#66b966', '#66a3e0', '#c285ff', '#888888', '#a10000', '#b26b00',
		'#b2b200', '#006100', '#0047b2', '#6b24b2', '#444444', '#5c0000',
		'#663d00', '#666600', '#003700', '#002966', '#3d1466'
	],
	'background': [
		'#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc',
		'#9933ff', 'selected', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc',
		'#cce0f5', '#ebd6ff', '#bbbbbb', '#f06666', '#ffc266', '#ffff66',
		'#66b966', '#66a3e0', '#c285ff', '#888888', '#a10000', '#b26b00',
		'#b2b200', '#006100', '#0047b2', '#6b24b2', '#444444', '#5c0000',
		'#663d00', '#666600', '#003700', '#002966', '#3d1466'
	],
	'font': ['selected', 'serif', 'monospace'],
	'align': ['selected', 'center', 'right', 'justify'],
	'line-height': ['1', '1.2', '1.4', '1.6', '1.8', '2.0', '2.2', '2.4', '2.6', '2.8', '3.0'],
	'letter-spacing': ['0px', '1px', '2px', '3px', '4px', '5px', '6px', '7px', '8px', '9px', '10px']
};

export const defaults: Options = {
	theme: 'snow',
	bounds: IS_SERVER ? null : document.body,
	modules: {
		EventExtend: {} // 必须要配置，否则该扩展不生效
	},
	placeholder: '请输入内容',
	readOnly: false,
	toolbar: [
		['bold', 'italic', 'underline', 'strike'],
		['blockquote', 'code-block'],
		[{ header: 1 }, { header: 2 }],
		[{ list: 'ordered' }, { list: 'bullet' }],
		[{ script: 'sub' }, { script: 'super' }],
		[{ indent: '-1' }, { indent: '+1' }],
		[{ direction: 'rtl' }],
		[{ header: [1, 2, 3, 4, 5, 6, false] }],
		[{ color: [] }, { background: [] }],
		[{ font: [] }],
		[{ align: [] }],
		['font-size', 'line-height', 'letter-spacing'],
		// ['clean'],
		['link', 'upload/video', 'upload/image', 'undo', 'redo']
	]
};
