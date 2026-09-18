import { nextTick, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import { Wheel } from '@deot/helper-wheel';

type Options = {
	headerWrapper: Ref<any>;
	footerWrapper: Ref<any>;
	bodyXWrapper: Ref<any>;
	bodyYWrapper: Ref<any>;
	bodyScroller: Ref<any>;
};

/**
 * 在表头 / 合计行上滚动滚轮时，把滚动转交给表体
 *
 * 自行管理 Wheel 的创建与销毁；原先位于 Table 的 bindEvents / unbindEvents
 * @param options 相关元素与表体滚动容器
 */
export const useWheelForward = (options: Options) => {
	const { headerWrapper, footerWrapper, bodyXWrapper, bodyYWrapper, bodyScroller } = options;

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

	let wheels: any[] = [];

	// 等表头 / 合计行挂载后再绑定（原 bindEvents 内的 nextTick）
	onMounted(() => {
		nextTick(() => {
			wheels = [headerWrapper, footerWrapper].map((wrapper) => {
				if (!wrapper.value) return;
				const wheel = new Wheel(wrapper.value, {
					shouldWheelX: (delta) => {
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
			});
		});
	});

	onUnmounted(() => {
		wheels.forEach(wheel => wheel && wheel.off(handleMousewheel));
	});
};
