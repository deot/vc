/** @jsxImportSource vue */

import type { ComponentInternalInstance } from 'vue';
import { Text } from '../text';
import { Image } from '../image';
import { FilePreview } from '../file-preview';
import type { Clipboard as ClipboardComponent } from '../clipboard';
import { normalize, allowedUrl } from '../file-preview/utils';
import type { DescriptionsContext, DescriptionsSize } from './types';

interface Extra {
	size: DescriptionsSize;
	instance: ComponentInternalInstance;
	// 桌面端Clipboard（Message提示）或移动端MClipboard（Toast提示）
	Clipboard: typeof ClipboardComponent;
}

const toText = (value: any) => (Array.isArray(value) ? value.join(',') : `${value}`);

// 链接只放行这些协议，其余（如javascript:）不生成链接
const LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

// 复制图标：前后两张叠放的卡片
const COPY_BACK = 'M5 1h8a2 2 0 0 1 2 2v8h-1.5V3a.5.5 0 0 0-.5-.5H5z';
const COPY_FRONT = 'M3 4h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'
	+ 'm0 1.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V6a.5.5 0 0 0-.5-.5z';

const renderText = ({ value, row }: DescriptionsContext) => {
	const options = row.options || {};
	return options.line
		? <Text {...options} value={toText(value)} />
		: <span {...options}>{ toText(value) }</span>;
};

/**
 * 字符串（逗号分隔）、字符串数组、{ source | src | url }数组；未写type的都按图片处理
 * @param value ~
 * @returns ~
 */
const toImages = (value: any) => {
	const source = typeof value === 'string' ? value.split(',') : Array.isArray(value) ? value : [value];
	return normalize(source.map((item) => {
		if (typeof item === 'string') return { source: item.trim(), type: 'image' };
		if (!item || typeof item !== 'object') return null;
		return { ...item, source: item.source || item.src || item.url, type: item.type || 'image' };
	}) as any);
};

const renderImage = ({ value, row }: DescriptionsContext, { instance }: Extra) => {
	const list = toImages(value);
	if (!list.length) return null;
	const { size, fit = 'cover', previewable = true, ...rest } = row.options || {};
	const [width, height] = Array.isArray(size) ? size : [size, size];
	const style = size ? { width: `${width}px`, height: `${height ?? width}px` } : null;
	const handleClick = (e: MouseEvent, current: number) => {
		const elements = (e.currentTarget as HTMLElement).parentElement!.children;
		FilePreview.open({
			data: list.map((item, i) => ({ ...item, element: elements[i] })),
			current,
			instance
		});
	};
	return (
		<span class="vc-descriptions__images">
			{
				list.map((item, i) => (
					<span
						key={i}
						class={['vc-descriptions__image', { 'is-previewable': previewable }]}
						style={style}
						onClick={previewable ? (e: MouseEvent) => handleClick(e, i) : undefined}
					>
						<Image {...rest} src={item.source} thumbnail={item.thumbnail} fit={fit} previewable={false} />
					</span>
				))
			}
		</span>
	);
};

const renderFile = ({ value, row }: DescriptionsContext, { size }: Extra) => {
	return <FilePreview size={size} {...row.options} data={value} />;
};

const renderLink = ({ value, row }: DescriptionsContext) => {
	const href = toText(value);
	return (
		<a
			class="vc-descriptions__link"
			href={allowedUrl(href, LINK_PROTOCOLS)}
			target="_blank"
			rel="noopener noreferrer"
		>
			<Text line={1} {...row.options} value={href} />
		</a>
	);
};

const renderCopy = ({ value, row }: DescriptionsContext, { Clipboard }: Extra) => {
	const text = toText(value);
	return (
		<span class="vc-descriptions__copy">
			<Text line={1} {...row.options} value={text} />
			<Clipboard tag="span" value={text} class="vc-descriptions__copy-icon">
				<i class="vc-icon">
					<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
						<path d={COPY_BACK} />
						<path fill-rule="evenodd" d={COPY_FRONT} />
					</svg>
				</i>
			</Clipboard>
		</span>
	);
};

/**
 * options.data为[{ label, value }]或{ [value]: label }，没有对应项时显示原值
 * @param context ~
 * @returns ~
 */
const renderSelect = (context: DescriptionsContext) => {
	const { value, row } = context;
	const { data, ...rest } = row.options || {};
	const map: Record<string, any> = Array.isArray(data)
		? data.reduce((pre, cur) => (pre[cur.value] = cur.label, pre), {})
		: data || {};
	const values = Array.isArray(value) ? value : [value];
	return <span {...rest}>{ values.map(v => map[v] ?? v).join(',') }</span>;
};

const RENDERS = {
	text: renderText,
	image: renderImage,
	file: renderFile,
	link: renderLink,
	copy: renderCopy,
	select: renderSelect
};

/**
 * 内置类型，未知type按text处理；返回null时显示placeholder
 * @param context ~
 * @param extra ~
 * @returns ~
 */
export const renderBuiltin = (context: DescriptionsContext, extra: Extra) => {
	const render = RENDERS[context.row.type] || renderText;
	return render(context, extra);
};
