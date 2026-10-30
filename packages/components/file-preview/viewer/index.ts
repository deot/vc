import type { ComponentInternalInstance } from 'vue';
import type { VirtualElement } from '../../vc';
import { Portal } from '../../portal';
import type { FilePreviewItem } from '../types';
import { resolveCurrent } from '../utils';
import { FileViewer } from './viewer';
import './style.scss';

export type ViewerOpenOptions = {
	data: FilePreviewItem[];
	current?: number;
	instance?: ComponentInternalInstance | null;
	triggerElement?: Element | VirtualElement | null;
	placeholder?: boolean;
	onClose?: () => void;
};

const portal = new Portal(FileViewer, {
	multiple: true,
	leaveDelay: 0
});

export const openViewer = (options: ViewerOpenOptions) => {
	const { data, current, instance = null, triggerElement = null, placeholder, onClose } = options;
	if (!data.length) return;
	return portal.popup({
		data,
		current: resolveCurrent(data, current),
		instance,
		triggerElement,
		placeholder,
		onClose
	});
};
