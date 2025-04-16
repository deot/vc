/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { IS_SERVER } from '@deot/vc-shared';
import { useAttrs } from '@deot/vc-hooks';
import * as $ from '@deot/helper-dom';
import { throttle } from 'lodash-es';
import { props as imageProps } from './image-props';
import IMGStore from './store';

const COMPONENT_NAME = 'vc-image';

let isSupportObjectFit = false;

window.addEventListener('DOMContentLoaded', () => {
	isSupportObjectFit = !IS_SERVER && document.documentElement.style.objectFit !== undefined;
});

const ObjectFit = {
	NONE: 'none',
	CONTAIN: 'contain',
	COVER: 'cover',
	FILL: 'fill',
	SCALE_DOWN: 'scale-down'
};

export const Image = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: imageProps,
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance()!;
		const its = useAttrs({ merge: false, exclude: ['onLoad', 'onError'] });
		const isLoading = ref(true);
		const isError = ref(false);
		const isActive = ref(!props.lazy);
		const isAuto = ref(false);
		const originW = ref(0);
		const originH = ref(0);
		const pStyle = ref({});
		const scroller = ref<any>(null);

		const setScroller = () => {
			const { wrapper } = props;

			if (typeof wrapper === 'object') {
				scroller.value = wrapper;
			} else if (typeof wrapper === 'string') {
				scroller.value = document.querySelector(wrapper);
			} else {
				scroller.value = $.getScroller(instance.vnode.el as any);
			}
		};

		const initPlaceholder = () => {
			isAuto.value = instance.vnode.el!.clientHeight === 1 || instance.vnode.el!.clientWidth === 1;

			// el上是否有width和height
			const { width, height } = instance.vnode.el!.style;

			if (width && height) return;

			const { w, h } = IMGStore.getSize(props.src!, {
				clientW: instance.vnode.el!.clientWidth,
				clientH: instance.vnode.el!.clientHeight,
				style: {
					width,
					height
				},
				wrapperW: scroller.value && scroller.value.clientWidth,
				// TODO
				wrapperH: scroller.value && scroller.value.clientHeight,
			});

			if (w && h) {
				pStyle.value = {
					width: `${w}px`,
					height: `${h}px`,
				};
			}
		};

		let handleLazyLoad;
		const removeLazyLoadListener = () => {
			if (!scroller.value || !handleLazyLoad) return;
			scroller.value.removeEventListener('scroll', handleLazyLoad);

			scroller.value = null;
			handleLazyLoad = null;
		};

		const addLazyLoadListener = () => {
			if (scroller.value) {
				handleLazyLoad = throttle(() => {
					if ($.contains(scroller.value, instance.vnode.el as any)) {
						isActive.value = true;
						removeLazyLoadListener();
					}
				}, 200);
				scroller.value.addEventListener('scroll', handleLazyLoad);
				handleLazyLoad();
			}
		};

		const handleLoad = (e, img) => {
			originW.value = img.naturalWidth || img.width;
			originH.value = img.naturalHeight || img.height;

			isLoading.value = false;

			emit('load', e, img, instance);

			IMGStore.add(props.src!, {
				originW: originW.value,
				originH: originH.value,
			});
		};

		const handleError = (e: any, img: any) => {
			isLoading.value = false;
			isError.value = true;
			emit('error', e, img, instance);
		};

		const loadImage = () => {
			if (!props.src) return;
			// reset status
			isLoading.value = true;
			isError.value = false;

			const img = new window.Image();
			img.onload = e => handleLoad(e, img);
			img.onerror = e => handleError(e, img);

			// bind html attrs
			Object.keys(its.value.attrs || {})
				.forEach(key => img.setAttribute(key, its.value.attrs![key]));

			img.src = props.src;
		};

		const hackFit = (fit: string) => {
			const {
				clientWidth: elW,
				clientHeight: elH
			} = instance.vnode.el!;

			if (!originW.value || !originH.value || !elW || !elH) return {};

			const vertical = originW.value / originH.value < 1;

			if (fit === ObjectFit.SCALE_DOWN) {
				const isSmaller = originW.value < elW && originH.value < elH;
				fit = isSmaller ? ObjectFit.NONE : ObjectFit.CONTAIN;
			}

			switch (fit) {
				case ObjectFit.NONE:
					return { width: 'auto', height: 'auto' };
				case ObjectFit.CONTAIN:
					return vertical ? { width: 'auto' } : { height: 'auto' };
				case ObjectFit.COVER:
					return vertical ? { height: 'auto' } : { width: 'auto' };
				default:
					return {};
			}
		};

		const style = computed(() => {
			if (!props.fit) return;
			return isSupportObjectFit
				? { 'object-fit': props.fit }
				: hackFit(props.fit);
		});

		const alignCenter = computed(() => {
			return !isSupportObjectFit && props.fit !== ObjectFit.FILL;
		});

		watch(
			() => props.src,
			(v) => {
				if (!v && !isLoading.value) {
					isLoading.value = true;
				}
				isActive.value && loadImage();
			}
		);

		watch(
			() => isActive.value,
			(v) => {
				v && loadImage();
			}
		);

		onMounted(() => {
			setScroller();
			initPlaceholder();
			props.lazy
				? addLazyLoadListener()
				: loadImage();
		});

		onBeforeUnmount(() => {
			props.lazy && removeLazyLoadListener();
		});
		return () => {
			return (
				<div style={its.value.style} class={[its.value.class, 'vc-image']}>
					{
						isLoading.value && (
							slots.placeholder
								? slots.placeholder()
								: (<div class={[{ 'is-auto': isAuto.value }, 'vc-image__placeholder']} style={pStyle.value} />)
						)
					}
					{
						(!isLoading.value && isError.value) && (slots.error ? slots.error() : (<div class="vc-image__error"> 加载失败</div>))
					}
					{
						!isLoading.value && !isError.value && (
							<img
								src={props.src}
								// @ts-ignore
								style={style.value}
								class={[{ 'is-center': alignCenter }, 'vc-image__inner']}
								{
									...{
										// 包含所有on*都会被绑定, 且listeners中覆盖将由listener内触发（inheritAttrs: false）
										...its.value.attrs,
										...its.value.listeners,
									}
								}
							/>
						)
					}
				</div>
			);
		};
	}
});
