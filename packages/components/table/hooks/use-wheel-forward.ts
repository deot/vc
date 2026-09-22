import { onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import { Wheel } from '@deot/helper-wheel';

type Options = {
	headerWrapper: Ref<any>;
	bottomWrapper: Ref<any>;
	bodyXWrapper: Ref<any>;
	bodyYWrapper: Ref<any>;
	bodyScroller: Ref<any>;
};

/**
 * 在表头 / 底部 dock（横向滚动条 + 合计行）上滚动滚轮时，把滚动转交给表体
 *
 * 自行管理 Wheel 的创建与销毁；跟随元素绑定：dock 与表体同一次渲染出现、随 affix 切换重建，
 * 只在挂载时绑定一次会错过或丢失
 * @param options 相关元素与表体滚动容器
 */
export const useWheelForward = (options: Options) => {
	const { headerWrapper, bottomWrapper, bodyXWrapper, bodyYWrapper, bodyScroller } = options;

	const handleMousewheel = (deltaX: number, deltaY: number) => {
		if (!bodyXWrapper.value) return;
		const {
			scrollWidth: contentW,
			clientWidth: wrapperW,
			scrollLeft: scrollX,
			scrollHeight: contentH,
			clientHeight: wrapperH,
			scrollTop: scrollY
		} = bodyXWrapper.value;

		if (!bodyScroller.value) return;
		if (Math.abs(deltaY) > Math.abs(deltaX) && contentH > wrapperH) {
			bodyScroller.value.scrollTo({ y: scrollY + deltaY });
		} else if (deltaX && contentW > wrapperW) {
			bodyScroller.value.scrollTo({ x: scrollX + deltaX });
		}
	};

	const createWheel = (el: HTMLElement) => {
		const wheel = new Wheel(el, {
			shouldWheelX: (delta) => {
				if (!bodyXWrapper.value) return false;
				const {
					scrollWidth: contentW,
					clientWidth: wrapperW,
					scrollLeft: scrollX
				} = bodyXWrapper.value;
				if (wrapperW === contentW) {
					return false;
				}

				delta = Math.round(delta);
				if (delta === 0) {
					return false;
				}

				return (
					(delta < 0 && scrollX > 0)
					|| (delta >= 0 && scrollX < contentW - wrapperW)
				);
			},
			shouldWheelY: (delta) => {
				if (!bodyYWrapper.value) return false;
				const {
					scrollHeight: contentH,
					clientHeight: wrapperH,
					scrollTop: scrollY
				} = bodyYWrapper.value;

				if (wrapperH === contentH) {
					return false;
				}

				delta = Math.round(delta);
				if (delta === 0) {
					return false;
				}
				return (
					(delta < 0 && scrollY > 0)
					|| (delta >= 0 && scrollY < contentH - wrapperH)
				);
			}
		});
		wheel.on(handleMousewheel);
		return wheel;
	};

	// 元素 -> Wheel；元素变化时解绑旧的、绑定新的
	const wheels = new Map<HTMLElement, Wheel>();
	const sync = (els: Array<HTMLElement | null | undefined>) => {
		const next = new Set(els.filter(Boolean) as HTMLElement[]);
		wheels.forEach((wheel, el) => {
			if (next.has(el)) return;
			wheel.off(handleMousewheel);
			wheels.delete(el);
		});
		next.forEach((el) => {
			!wheels.has(el) && wheels.set(el, createWheel(el));
		});
	};

	watch(
		() => [headerWrapper.value, bottomWrapper.value],
		sync,
		{ flush: 'post', immediate: true }
	);

	onUnmounted(() => sync([]));
};
