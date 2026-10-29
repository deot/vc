import type { ComponentInternalInstance, VNode } from 'vue';
import type { CustomerData, CustomerValue } from '../customer/types';
import type { GridResponsive, GridSpan } from '../grid/types';

export type DescriptionsTheme = 'fill' | 'inverted' | 'plain' | 'border';

export type DescriptionsSize = 'mini' | 'small' | 'medium' | 'large';

export type DescriptionsLabelPosition = 'left' | 'right' | 'top';

/**
 * 单项；options中的每一项与DescriptionsItem的props同名
 */
export interface DescriptionsItemOption {
	[key: string]: any;
	label?: CustomerValue;
	// 读取data的路径
	prop?: string;
	// 显式传值，优先于prop；函数作为渲染函数
	value?: any;
	type?: string;
	span?: GridResponsive<GridSpan>;
	tooltip?: string | CustomerData | ((context: DescriptionsContext) => string);
	// 透传给内置控件
	options?: Record<string, any>;
	prefix?: CustomerValue;
	suffix?: CustomerValue;
	hidden?: boolean;
	labelClass?: any;
	labelStyle?: any;
	contentClass?: any;
	contentStyle?: any;
	class?: any;
	style?: any;
}

/**
 * 分组；children为该组的项
 */
export interface DescriptionsGroupOption {
	[key: string]: any;
	label?: CustomerValue;
	children: DescriptionsItemOption[];
	class?: any;
	style?: any;
}

export type DescriptionsOption = DescriptionsItemOption | DescriptionsGroupOption;

/**
 * 当前项，已补上默认值：type默认为text，span为当前断点下解析后的值
 */
export interface DescriptionsRow extends DescriptionsItemOption {
	type: string;
	span: GridSpan;
}

/**
 * 插槽、函数形式的value、全局renderValue共用的上下文
 */
export interface DescriptionsContext {
	value: any;
	row: DescriptionsRow;
	index: number;
	data: Record<string, any>;
}

/**
 * 全局renderValue：返回VNode时使用它，返回false或空值时使用内置类型
 */
export type DescriptionsRenderValue = (
	data: DescriptionsContext & { instance: ComponentInternalInstance }
) => VNode | false | null | undefined | void;

export interface DescriptionsOptions {
	renderValue?: DescriptionsRenderValue;
}
