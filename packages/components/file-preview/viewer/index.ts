import type { ComponentInternalInstance } from 'vue';
import { Portal } from '../../portal';
import { VcInstance } from '../../vc';
import type { FilePreviewItem } from '../types';
import { resolveCurrent } from '../utils';
import { FileViewer } from './viewer';
import './style.scss';

export type ViewerOpenOptions = {
	data: FilePreviewItem[];
	current?: number;
	instance?: ComponentInternalInstance | null;
	triggerElement?: Element | null;
	onClose?: () => void;
};

const portal = new Portal(FileViewer, {
	multiple: true,
	leaveDelay: 0
});

const elementOf = (target: EventTarget | null) => {
	if (target instanceof Element) return target;
	if (target instanceof Node) return target.parentElement;
	return null;
};

// 点击进行中 eventPhase 才非 0；文本节点取它所在的元素
export const getTriggerElement = () => {
	const event = VcInstance.globalEvent;
	if (!event?.eventPhase) return null;
	return elementOf(event.target);
};

export const openViewer = (options: ViewerOpenOptions) => {
	const { data, current, instance = null, triggerElement = null, onClose } = options;
	if (!data.length) return;
	return portal.popup({
		data,
		current: resolveCurrent(data, current),
		instance,
		triggerElement,
		onClose
	});
};
