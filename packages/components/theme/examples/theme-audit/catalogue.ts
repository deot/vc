export const GROUPS = [
	{
		id: 'general',
		label: '通用',
		names: ['Button', 'Icon', 'Scroller', 'Text']
	},
	{
		id: 'layout',
		label: '布局',
		names: ['Affix', 'Divider', 'Grid']
	},
	{
		id: 'navigation',
		label: '导航',
		names: ['Dropdown', 'Pagination', 'Steps', 'Tabs', 'Tour']
	},
	{
		id: 'entry',
		label: '数据录入',
		names: [
			'Artboard', 'Cascader', 'Checkbox', 'ColorPicker', 'DatePicker', 'Editor', 'Form', 'ImageCrop', 'Input', 'Picker',
			'Radio', 'Rate', 'Select', 'Slider', 'SortList', 'Switch', 'Textarea', 'TimePicker', 'Upload', 'UploadPicker'
		]
	},
	{
		id: 'display',
		label: '数据展示',
		names: [
			'Badge', 'Calendar', 'Card', 'Carousel', 'Chart', 'Collapse', 'Countdown', 'Counter', 'Descriptions', 'FilePreview', 'Image',
			'ImageProcessor', 'List', 'Marquee', 'Popover', 'Progress', 'RecycleList', 'Table', 'Tag', 'Timeline', 'Tree'
		]
	},
	{
		id: 'feedback',
		label: '反馈',
		names: ['ActionSheet', 'Alert', 'Drawer', 'Message', 'Modal', 'Notice', 'Popconfirm', 'Spin', 'Toast', 'Watermark']
	},
	{
		id: 'utilities',
		label: '辅助',
		names: [
			'Clipboard', 'Customer', 'Debounce', 'Defer', 'Expand', 'Fragment', 'Gesture', 'Popup', 'Portal', 'Print',
			'Resizer', 'Snapshot', 'Transition'
		]
	}
] as const;

export type AuditComponentName = typeof GROUPS[number]['names'][number] | 'Theme';
export const COMPONENT_COUNT = GROUPS.reduce((total, group) => total + group.names.length, 1);
export const MOBILE_COMPONENTS = new Set<AuditComponentName>([
	'Input', 'Textarea', 'Checkbox', 'Radio', 'Switch',
	'Picker', 'DatePicker', 'Form', 'List', 'Tabs', 'Carousel', 'UploadPicker',
	'SortList', 'Modal', 'ActionSheet', 'Toast'
]);

export const MOBILE_ONLY = new Set<AuditComponentName>(['Picker', 'List', 'ActionSheet', 'Toast']);
