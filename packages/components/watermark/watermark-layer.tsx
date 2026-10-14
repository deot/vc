/** @jsxImportSource vue */

import { computed, defineComponent, h, normalizeClass, normalizeStyle, onBeforeUnmount, onMounted, ref, shallowRef, Teleport, watch } from 'vue';
import { isEqual } from 'lodash-es';
import { loadImage } from '../image-processor/utils';
import { props as watermarkProps } from './watermark-props';
import { drawImage, drawText, getFont, toPair } from './utils';
import type { WatermarkFont, WatermarkTile } from './utils';

const COMPONENT_NAME = 'vc-watermark-layer';

/**
 * 水印层：绘制位图，挂到 to 指定的容器（不传则留在原位、铺满父元素；满屏时默认为 body），被移除或篡改后重建
 */
export const WatermarkLayer = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: watermarkProps,
	setup(props, { attrs }) {
		const layer = shallowRef<HTMLElement>();
		// 挂载目标：满屏时默认为 body，避开会让固定定位失效的祖先（transform、filter 等）
		const to = computed(() => props.to || (props.fullscreen ? 'body' : undefined));
		// to 解析出的元素
		const target = shallowRef<HTMLElement | null>(null);
		// 水印层被移除、篡改或更换容器后递增，使其重建
		const token = ref(0);
		// 水印层的字体，由 class / style / 主题决定（见 refresh）
		const font = shallowRef<WatermarkFont>();
		// 已加载的图片；加载失败为 null，没有 src 或加载中为 undefined
		const image = shallowRef<HTMLImageElement | null>();

		// 值不变时沿用旧数组：数组字面量每次渲染都是新引用，不应引起重绘
		const lines = computed<string[]>((prev) => {
			const { value } = props;
			const next = (Array.isArray(value) ? value : [value]).filter(Boolean).map(String);
			return isEqual(prev, next) ? prev! : next;
		});
		const gap = computed<number[]>((prev) => {
			const next = toPair(props.gap, [100, 100]);
			return isEqual(prev, next) ? prev! : next;
		});
		const offset = computed(() => toPair(props.offset, [gap.value[0] / 2, gap.value[1] / 2]));

		// 位图由输入派生，id 每次绘制递增；图片未加载完时沿用上一张
		let tileId = 0;
		const tile = computed<(WatermarkTile & { id: number }) | null>((prev) => {
			if (props.src && typeof image.value === 'undefined') return prev || null;

			const options = {
				width: props.width,
				height: props.height,
				rotate: props.rotate,
				gap: gap.value
			};
			const value = image.value
				? drawImage({ ...options, image: image.value })
				: font.value && lines.value.length
					? drawText({ ...options, lines: lines.value, font: font.value })
					: null;

			return value && { ...value, id: ++tileId };
		});

		// 瓦片内容居中、四周各留半个 gap：offset 为 gap 的一半时从 0 0 开始平铺，其余按差值平移
		const background = computed(() => {
			if (!tile.value) return;
			const { id, url, width, height } = tile.value;
			const x = offset.value[0] - gap.value[0] / 2;
			const y = offset.value[1] - gap.value[1] / 2;
			return {
				key: `${id},${x},${y}`,
				style: {
					backgroundImage: `url("${url}")`,
					backgroundSize: `${width}px ${height}px`,
					backgroundPosition: `${x}px ${y}px`
				}
			};
		});

		// 先按原地址加载以命中浏览器缓存；失败（如缓存的响应不带跨域头）再带时间戳重试
		const setImage = async () => {
			const { src } = props;
			image.value = undefined;
			if (!src) return;

			const value = await loadImage(src, 'anonymous', false)
				.catch(() => loadImage(src, 'anonymous'))
				.catch(() => null);
			// 加载期间 src 又变化时丢弃
			if (src === props.src) image.value = value;
		};

		// 水印层创建或其 transition 结束后读取字体，变化才更新（文字随之重绘）
		const refresh = () => {
			const el = layer.value;
			if (!el) return;
			const value = getFont(el);
			if (value.signature !== font.value?.signature) font.value = value;
		};

		// 为水印层提供定位的容器（满屏时相对视口，不需要），及其被改写前的内联 position
		let host: HTMLElement | null = null;
		let position: string | undefined;

		const resetHost = () => {
			if (host && typeof position === 'string') {
				host.style.position = position;
			}
			host = null;
			position = undefined;
		};

		// 容器未定位时写入 relative，换容器、改为满屏或卸载后还原
		const setHost = () => {
			const el = (!props.fullscreen && layer.value?.parentElement) || null;
			if (el === host) return;
			resetHost();
			host = el;
			if (!el) return;

			const value = getComputedStyle(el).position;
			if (!value || value === 'static') {
				position = el.style.position;
				el.style.position = 'relative';
			}
		};

		// 水印层所在的容器：观察其子节点，水印层被移除后放回
		let container: HTMLElement | null = null;
		let observer: MutationObserver | undefined;

		// 水印层创建后不会被组件改写（见 renderLayer），它被移除或属性变化都来自外部，重建
		const handleMutations = (records: MutationRecord[]) => {
			const el = layer.value;
			if (!el) return;
			const isChanged = records.some((record) => {
				return record.type === 'attributes'
					? record.target === el
					: Array.from(record.removedNodes).includes(el);
			});
			if (!isChanged) return;

			// 先放回容器：留在原位时水印层是根节点，Vue 需要它仍在文档中才能在原处重建
			!el.parentNode && container?.appendChild(el);
			token.value++;
		};

		// 只观察容器的直接子节点与水印层自身的属性，容器内其它更新不会进入回调
		const observe = () => {
			const el = layer.value;
			observer?.disconnect();
			container = el?.parentElement || null;
			if (!el || !container) return;

			observer = observer || new MutationObserver(handleMutations);
			observer.observe(container, { childList: true });
			observer.observe(el, { attributes: true });
		};

		// 换容器时重建水印层，而不是把它移过去：容器的定位与观察只跟随水印层的创建
		const setTarget = () => {
			const value = to.value;
			const el = (typeof value === 'string' ? document.querySelector<HTMLElement>(value) : value) || null;
			if (el === target.value) return;
			target.value = el;
			token.value++;
		};

		watch(to, setTarget, { flush: 'post' });
		watch(() => props.src, setImage);

		// 水印层创建（或消失）后：同步容器、重新观察、读取字体
		watch(
			layer,
			() => {
				setHost();
				observe();
				refresh();
			},
			{ flush: 'post' }
		);

		onMounted(() => {
			setTarget();
			setImage();
		});

		onBeforeUnmount(() => {
			observer?.disconnect();
			resetHost();
		});

		/**
		 * 水印层的属性在创建后保持不变：
		 * 决定其属性的输入（透传属性、层级、背景）都进入 key，变化时整体重建；
		 * key 不变时沿用同一个 style 对象，Vue 不会再写 DOM。
		 */
		let binds: { key: string; style: Record<string, any> } | undefined;

		const renderLayer = () => {
			const { class: className, style, ...rest } = attrs;
			const layerClass = normalizeClass(['vc-watermark__layer', { 'is-fullscreen': props.fullscreen }, className]);
			// 层级未传时由样式决定；style 可以覆盖层级，不能覆盖生成的背景
			const layerStyle = normalizeStyle([{ zIndex: props.zIndex }, style as any]) as Record<string, any>;
			const key = [token.value, background.value?.key, layerClass, JSON.stringify([layerStyle, rest])].join('|');

			if (binds?.key !== key) {
				binds = { key, style: { ...layerStyle, ...background.value?.style } };
			}

			return h('div', {
				...rest,
				key,
				ref: layer,
				class: layerClass,
				style: binds.style,
				onTransitionend: refresh
			});
		};

		return () => {
			if (!to.value) return renderLayer();

			// key 放在 Teleport 上：目标容器被清空时，连同其中的定位锚点一起重建
			return target.value && (
				<Teleport key={token.value} to={target.value}>
					{renderLayer()}
				</Teleport>
			);
		};
	}
});
