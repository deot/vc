import type { Component } from 'vue';
import type { AuditComponentName } from './catalogue';
import ActionSheet from './modules/action-sheet.vue';
import Affix from './modules/affix.vue';
import Alert from './modules/alert.vue';
import Artboard from './modules/artboard.vue';
import Button from './modules/button.vue';
import Calendar from './modules/calendar.vue';
import Card from './modules/card.vue';
import Carousel from './modules/carousel.vue';
import Cascader from './modules/cascader.vue';
import Chart from './modules/chart.vue';
import Checkbox from './modules/checkbox.vue';
import Clipboard from './modules/clipboard.vue';
import Collapse from './modules/collapse.vue';
import ColorPicker from './modules/color-picker.vue';
import Countdown from './modules/countdown.vue';
import Counter from './modules/counter.vue';
import Customer from './modules/customer.vue';
import DatePicker from './modules/date-picker.vue';
import Debounce from './modules/debounce.vue';
import Defer from './modules/defer.vue';
import Divider from './modules/divider.vue';
import Drawer from './modules/drawer.vue';
import Dropdown from './modules/dropdown.vue';
import Editor from './modules/editor.vue';
import Expand from './modules/expand.vue';
import FilePreview from './modules/file-preview.vue';
import Form from './modules/form.vue';
import Fragment from './modules/fragment.vue';
import Icon from './modules/icon.vue';
import Image from './modules/image.vue';
import ImageCrop from './modules/image-crop.vue';
import ImageProcessor from './modules/image-processor.vue';
import Input from './modules/input.vue';
import List from './modules/list.vue';
import Marquee from './modules/marquee.vue';
import Message from './modules/message.vue';
import Modal from './modules/modal.vue';
import Notice from './modules/notice.vue';
import Pagination from './modules/pagination.vue';
import Picker from './modules/picker.vue';
import Popconfirm from './modules/popconfirm.vue';
import Popover from './modules/popover.vue';
import Popup from './modules/popup.vue';
import Portal from './modules/portal.vue';
import Print from './modules/print.vue';
import Progress from './modules/progress.vue';
import Radio from './modules/radio.vue';
import Rate from './modules/rate.vue';
import RecycleList from './modules/recycle-list.vue';
import Resizer from './modules/resizer.vue';
import Scroller from './modules/scroller.vue';
import Select from './modules/select.vue';
import Slider from './modules/slider.vue';
import Snapshot from './modules/snapshot.vue';
import SortList from './modules/sort-list.vue';
import Spin from './modules/spin.vue';
import Steps from './modules/steps.vue';
import Switch from './modules/switch.vue';
import Table from './modules/table.vue';
import Tabs from './modules/tabs.vue';
import Tag from './modules/tag.vue';
import Text from './modules/text.vue';
import Textarea from './modules/textarea.vue';
import Theme from './modules/theme.vue';
import Timeline from './modules/timeline.vue';
import TimePicker from './modules/time-picker.vue';
import Toast from './modules/toast.vue';
import Touch from './modules/touch.vue';
import Tour from './modules/tour.vue';
import Transition from './modules/transition.vue';
import Tree from './modules/tree.vue';
import Upload from './modules/upload.vue';
import UploadPicker from './modules/upload-picker.vue';

export const MODULES = {
	ActionSheet,
	Affix,
	Alert,
	Artboard,
	Button,
	Calendar,
	Card,
	Carousel,
	Cascader,
	Chart,
	Checkbox,
	Clipboard,
	Collapse,
	ColorPicker,
	Countdown,
	Counter,
	Customer,
	DatePicker,
	Debounce,
	Defer,
	Divider,
	Drawer,
	Dropdown,
	Editor,
	Expand,
	FilePreview,
	Form,
	Fragment,
	Icon,
	Image,
	ImageCrop,
	ImageProcessor,
	Input,
	List,
	Marquee,
	Message,
	Modal,
	Notice,
	Pagination,
	Picker,
	Popconfirm,
	Popover,
	Popup,
	Portal,
	Print,
	Progress,
	Radio,
	Rate,
	RecycleList,
	Resizer,
	Scroller,
	Select,
	Slider,
	Snapshot,
	SortList,
	Spin,
	Steps,
	Switch,
	Table,
	Tabs,
	Tag,
	Text,
	Textarea,
	Theme,
	Timeline,
	TimePicker,
	Toast,
	Touch,
	Tour,
	Transition,
	Tree,
	Upload,
	UploadPicker
} as Record<AuditComponentName, Component>;
