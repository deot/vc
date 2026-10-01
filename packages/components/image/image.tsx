/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { IS_SERVER } from '@deot/vc-shared';
import { useAttrs } from '@deot/vc-hooks';
import * as $ from '@deot/helper-dom';
import { throttle } from 'lodash-es';
// 叶子模块（只依赖photoswipe），避免与FilePreview（依赖Image）形成循环引用
import { ImagePreview } from '../file-preview/image-preview';
import { useLocale } from '../locale';
import { useMeasuring } from '../measuring';
import { VcInstance } from '../vc';
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
		const { t } = useLocale();
		const its = useAttrs({ merge: false, exclude: ['onLoad', 'onError'] });
		const isLoading = ref(true);
		const isError = ref(false);
		const isActive = ref(!props.lazy);
		const isAuto = ref(false);
		const originW = ref(0);
		const originH = ref(0);
		const pStyle = ref({});
		const scroller = ref<any>(null);

		const resolvePath = (path: string, type: string) => {
			const fn = props.formatter || VcInstance.options.Image?.formatter;
			if (typeof fn === 'function') {
				return fn(path, type, instance) || path;
			}
			return path;
		};

		const displaySrc = computed(() => {
			const raw = props.thumbnail || props.src;
			return resolvePath(raw!, props.thumbnail ? 'thumbnail' : 'src');
		});
		const previewSrc = computed(() => {
			const raw = props.src || props.thumbnail;
			return resolvePath(raw!, props.src ? 'src' : 'thumbnail');
		});

		const setScroller = () => {
			if (scroller.value) return;
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
			const el = instance.vnode.el!;
			isAuto.value = el.clientHeight === 1 || el.clientWidth === 1;

			// el上是否有width和height
			const { width, height } = el.style;

			// 没有缓存过原始尺寸时算不出占位尺寸：不必再读尺寸、找滚动容器
			if ((width && height) || !IMGStore.has(displaySrc.value!)) return;

			// 找滚动容器要逐级读样式，只在用得到它的宽度时才找（两个方向都没给尺寸）
			!width && !height && setScroller();

			const { w, h } = IMGStore.getSize(displaySrc.value!, {
				clientW: el.clientWidth,
				clientH: el.clientHeight,
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

		/**
		 * 进行中的预加载
		 *
		 * 它的回调引用着组件实例：卸载后若不取消，请求结束前整棵已卸载的子树（组件与 DOM）都无法回收，
		 * 列表快速卸载大量行时内存会随未完成的图片请求一起堆积
		 */
		let loader: HTMLImageElement | null = null;

		// 取消预加载：先摘掉回调，再清空 src 中止请求
		const cancelLoad = () => {
			if (!loader) return;
			loader.onload = null;
			loader.onerror = null;
			loader.src = '';
			loader = null;
		};

		const handleLoad = (e, img) => {
			loader = null;
			originW.value = img.naturalWidth || img.width;
			originH.value = img.naturalHeight || img.height;

			isLoading.value = false;

			emit('load', e, img, instance);

			IMGStore.add(displaySrc.value!, {
				originW: originW.value,
				originH: originH.value,
			});
		};

		const handleError = (e: any, img: any) => {
			loader = null;
			isLoading.value = false;
			isError.value = true;
			emit('error', e, img, instance);
		};

		// 渲染在虚拟列表的隐藏测量池里：那份渲染只为量尺寸、不会展示，只占位，不发请求
		const measuring = useMeasuring();

		const loadImage = () => {
			// 换图时上一张还没加载完：取消它，迟到的回调不能覆盖新图的状态
			cancelLoad();
			if (measuring || !displaySrc.value) return;
			// reset status
			isLoading.value = true;
			isError.value = false;

			const img = new window.Image();
			loader = img;
			img.onload = e => handleLoad(e, img);
			img.onerror = e => handleError(e, img);

			// bind html attrs
			Object.keys(its.value.attrs || {})
				.forEach(key => img.setAttribute(key, its.value.attrs![key]));

			img.src = displaySrc.value;
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

		const handlePreview = () => {
			if (!props.previewable || !previewSrc.value) return;
			ImagePreview.open({
				current: 0,
				data: [previewSrc.value] as any,
				onClose() {}
			});
		};

		watch(
			() => displaySrc.value,
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
			initPlaceholder();
			if (measuring) return;
			if (!props.lazy) return loadImage();
			// 只有懒加载要监听滚动容器
			setScroller();
			addLazyLoadListener();
		});

		onBeforeUnmount(() => {
			props.lazy && removeLazyLoadListener();
			cancelLoad();
		});
		return () => {
			return (
				<div style={its.value.style} class={[its.value.class, { 'is-allow-preview': props.previewable }, 'vc-image']}>
					{
						isLoading.value && (
							slots.placeholder
								? slots.placeholder()
								: (<div class={[{ 'is-auto': isAuto.value }, 'vc-image__placeholder']} style={pStyle.value} />)
						)
					}
					{
						(!isLoading.value && isError.value) && (
							slots.error
								? slots.error()
								: (<div class="vc-image__error">{t('vc.Image.loadError')}</div>)
						)
					}
					{
						!isLoading.value && !isError.value && (
							<img
								src={displaySrc.value}
								// @ts-ignore
								style={style.value}
								class={[{ 'is-center': alignCenter.value }, 'vc-image__inner']}
								{
									...{
										// 包含所有on*都会被绑定, 且listeners中覆盖将由listener内触发（inheritAttrs: false）
										...its.value.attrs,
										...its.value.listeners,
									}
								}
								onClick={handlePreview}
							/>
						)
					}
				</div>
			);
		};
	}
});
