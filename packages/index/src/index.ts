import type { App } from 'vue';

export { Utils } from '@deot/vc-shared';
export * from '@deot/vc-hooks';
export * from '@deot/vc-components';
import type { VcOptions } from '@deot/vc-components';

import {
	VcInstance,

	// Components
	ActionSheet,
	MActionSheet,
	Alert,
	MAlert,
	Artboard,
	MArtboard,
	Button,
	MButton,
	ButtonGroup,
	MButtonGroup,
	Calendar,
	MCalendar,
	Card,
	MCard,
	Carousel,
	MCarousel,
	// CarouselItem,
	// MCarouselItem,
	Cascader,
	MCascader,
	// MCascaderView,
	Chart,
	MChart,
	Checkbox,
	MCheckbox,
	// CheckboxGroup,
	// MCheckboxGroup,
	Clipboard,
	MClipboard,
	Collapse,
	MCollapse,
	// CollapseItem,
	// MCollapseItem,
	ColorPicker,
	// ColorPickerView,
	MColorPicker,
	// MColorPickerView,
	Countdown,
	MCountdown,
	Customer,
	MCustomer,
	DatePicker,
	MDatePicker,
	// MDatePickerView,
	Debounce,
	MDebounce,
	Divider,
	MDivider,
	Drawer,
	MDrawer,
	Dropdown,
	MDropdown,
	// DropdownItem,
	// MDropdownItem,
	// DropdownMenu,
	// MDropdownMenu,
	Editor,
	MEditor,
	// EditorView,
	// MEditorView,
	Expand,
	MExpand,
	Form,
	MForm,
	FormItem,
	MFormItem,
	Fragment,
	MFragment,
	HTMLToImage,
	MHTMLToImage,
	Icon,
	MIcon,
	Image,
	MImage,
	ImageCrop,
	MImageCrop,
	ImagePreview,
	MImagePreview,
	ImageProcessing,
	MImageProcessing,
	Input,
	MInput,
	InputNumber,
	MInputNumber,
	InputSearch,
	MInputSearch,
	List,
	MList,
	ListItem,
	MListItem,
	Marquee,
	MMarquee,
	Modal,
	MModal,
	Notice,
	MNotice,
	Option,
	MOption,
	Page,
	MPage,
	Picker,
	MPicker,
	// PickerView,
	// MPickerView,
	// PickerPopup,
	// MPickerPopup,
	Popconfirm,
	MPopconfirm,
	Popover,
	MPopover,
	Popup,
	MPopup,
	Print,
	MPrint,
	Progress,
	MProgress,
	Radio,
	MRadio,
	// RadioGroup,
	// MRadioGroup,
	Rate,
	MRate,
	RecycleList,
	MRecycleList,
	Resizer,
	MResizer,
	Scroller,
	MScroller,
	Select,
	MSelect,
	Slider,
	MSlider,
	SortList,
	MSortList,
	Spin,
	MSpin,
	Steps,
	MSteps,
	// Step,
	// MStep,
	// StepsBar,
	// MStepsBar,
	Switch,
	MSwitch,
	Table,
	MTable,
	// TableItem,
	// MTableItem,
	// TableColumn,
	// MTableColumn,
	Tabs,
	MTabs,
	TabsPane,
	MTabsPane,
	Tag,
	MTag,
	Text,
	MText,
	Textarea,
	MTextarea,
	Timeline,
	MTimeline,
	// TimelineItem,
	// MTimelineItem,
	TimePicker,
	MTimePicker,
	Touch,
	MTouch,
	Transition,
	MTransition,
	TransitionFade,
	MTransitionFade,
	TransitionScale,
	MTransitionScale,
	TransitionSlide,
	MTransitionSlide,
	TransitionZoom,
	MTransitionZoom,
	TransitionCollapse,
	MTransitionCollapse,
	Tree,
	MTree,
	// TreeSelect,
	// MTreeSelect,
	Upload,
	MUpload,
	UploadPicker,
	MUploadPicker
} from '@deot/vc-components';

export const Components = {
	ActionSheet,
	MActionSheet,
	Alert,
	MAlert,
	Artboard,
	MArtboard,
	Button,
	MButton,
	ButtonGroup,
	MButtonGroup,
	Calendar,
	MCalendar,
	Card,
	MCard,
	Carousel,
	MCarousel,
	// CarouselItem,
	// MCarouselItem,
	Cascader,
	MCascader,
	// MCascaderView,
	Chart,
	MChart,
	Checkbox,
	MCheckbox,
	// CheckboxGroup,
	// MCheckboxGroup,
	Clipboard,
	MClipboard,
	Collapse,
	MCollapse,
	// CollapseItem,
	// MCollapseItem,
	ColorPicker,
	// ColorPickerView,
	MColorPicker,
	// MColorPickerView,
	Countdown,
	MCountdown,
	Customer,
	MCustomer,
	DatePicker,
	MDatePicker,
	// MDatePickerView,
	Debounce,
	MDebounce,
	Divider,
	MDivider,
	Drawer,
	MDrawer,
	Dropdown,
	MDropdown,
	// DropdownItem,
	// MDropdownItem,
	// DropdownMenu,
	// MDropdownMenu,
	Editor,
	MEditor,
	// EditorView,
	// MEditorView,
	Expand,
	MExpand,
	Form,
	MForm,
	FormItem,
	MFormItem,
	Fragment,
	MFragment,
	HTMLToImage,
	MHTMLToImage,
	Icon,
	MIcon,
	Image,
	MImage,
	ImageCrop,
	MImageCrop,
	ImagePreview,
	MImagePreview,
	ImageProcessing,
	MImageProcessing,
	Input,
	MInput,
	InputNumber,
	MInputNumber,
	InputSearch,
	MInputSearch,
	List,
	MList,
	ListItem,
	MListItem,
	Marquee,
	MMarquee,
	Modal,
	MModal,
	Notice,
	MNotice,
	Option,
	MOption,
	Page,
	MPage,
	Picker,
	MPicker,
	// PickerView,
	// MPickerView,
	// PickerPopup,
	// MPickerPopup,
	Popconfirm,
	MPopconfirm,
	Popover,
	MPopover,
	Popup,
	MPopup,
	Print,
	MPrint,
	Progress,
	MProgress,
	Radio,
	MRadio,
	// RadioGroup,
	// MRadioGroup,
	Rate,
	MRate,
	RecycleList,
	MRecycleList,
	Resizer,
	MResizer,
	Scroller,
	MScroller,
	Select,
	MSelect,
	Slider,
	MSlider,
	SortList,
	MSortList,
	Spin,
	MSpin,
	Steps,
	MSteps,
	// Step,
	// MStep,
	// StepsBar,
	// MStepsBar,
	Switch,
	MSwitch,
	Table,
	MTable,
	// TableItem,
	// MTableItem,
	// TableColumn,
	// MTableColumn,
	Tabs,
	MTabs,
	TabsPane,
	MTabsPane,
	Tag,
	MTag,
	Text,
	MText,
	Textarea,
	MTextarea,
	Timeline,
	MTimeline,
	// TimelineItem,
	// MTimelineItem,
	TimePicker,
	MTimePicker,
	Touch,
	MTouch,
	Transition,
	MTransition,
	TransitionFade,
	MTransitionFade,
	TransitionScale,
	MTransitionScale,
	TransitionSlide,
	MTransitionSlide,
	TransitionZoom,
	MTransitionZoom,
	TransitionCollapse,
	MTransitionCollapse,
	Tree,
	MTree,
	// TreeSelect,
	// MTreeSelect,
	Upload,
	MUpload,
	UploadPicker,
	MUploadPicker
};
export const createVcPlugin = (options?: VcOptions, transfromComponentKey = (x: string) => x) => {
	return {
		install: (app: App) => {
			app.config.globalProperties.$vc = VcInstance.configure(options);
			Object.keys(Components).forEach((key) => {
				app.component(transfromComponentKey(key) || key, Components[key]);
			});
		}
	};
};
