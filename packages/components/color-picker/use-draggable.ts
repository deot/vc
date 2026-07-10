import { onBeforeUnmount, onMounted } from 'vue';
import { IS_SERVER } from '@deot/vc-shared';

type DragEventLike = MouseEvent | TouchEvent;
type DragHandler = (e: MouseEvent & { originalEvent?: DragEventLike }) => void;

interface DraggableOptions {
	start?: DragHandler;
	drag?: DragHandler;
	end?: DragHandler;
}

let isDragging = false;

const draggableEvents = {
	start: ['touchstart', 'mousedown'],
	move: ['touchmove', 'mousemove'],
	end: ['touchend', 'touchcancel', 'mouseup']
};

const eventOptions = { capture: true, passive: false };

const normalizeEvent = (e: DragEventLike) => {
	const touchEvent = e as TouchEvent;
	const touch = touchEvent.touches?.[0] || touchEvent.changedTouches?.[0];

	if (!touch) {
		return e as MouseEvent & { originalEvent?: DragEventLike };
	}

	if (e.cancelable) {
		e.preventDefault();
	}

	return {
		...e,
		clientX: touch.clientX,
		clientY: touch.clientY,
		originalEvent: e
	} as MouseEvent & { originalEvent?: DragEventLike };
};

export const useDraggable = (
	el: HTMLElement | undefined | null | (() => HTMLElement | undefined | null),
	options: DraggableOptions
) => {
	if (IS_SERVER) return;

	const getElement = () => (typeof el === 'function' ? el() : el);

	const handleMove = (e: DragEventLike) => {
		options.drag?.(normalizeEvent(e));
	};

	const handleEnd = (e: DragEventLike) => {
		draggableEvents.move.forEach((eventName) => {
			document.removeEventListener(eventName, handleMove as EventListener, eventOptions);
		});
		draggableEvents.end.forEach((eventName) => {
			document.removeEventListener(eventName, handleEnd as EventListener);
		});
		document.onselectstart = null;
		document.ondragstart = null;

		isDragging = false;
		options.end?.(normalizeEvent(e));
	};

	const handleStart = (e: DragEventLike) => {
		if (isDragging) return;

		document.onselectstart = () => false;
		document.ondragstart = () => false;

		draggableEvents.move.forEach((eventName) => {
			document.addEventListener(eventName, handleMove as EventListener, eventOptions);
		});
		draggableEvents.end.forEach((eventName) => {
			document.addEventListener(eventName, handleEnd as EventListener);
		});

		isDragging = true;
		options.start?.(normalizeEvent(e));
	};

	onMounted(() => {
		const element = getElement();
		if (!element) return;

		draggableEvents.start.forEach((eventName) => {
			element.addEventListener(eventName, handleStart as EventListener);
		});
	});

	onBeforeUnmount(() => {
		const element = getElement();

		if (element) {
			draggableEvents.start.forEach((eventName) => {
				element.removeEventListener(eventName, handleStart as EventListener);
			});
		}

		draggableEvents.move.forEach((eventName) => {
			document.removeEventListener(eventName, handleMove as EventListener, eventOptions);
		});
		draggableEvents.end.forEach((eventName) => {
			document.removeEventListener(eventName, handleEnd as EventListener);
		});

		document.onselectstart = null;
		document.ondragstart = null;
		isDragging = false;
	});
};
