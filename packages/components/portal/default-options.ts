import type { App, Plugin, VNodeNormalizedChildren, Component } from 'vue';
import type { PortalLeaf } from './portal-leaf';

/**
 * Portal配置项
 */
export type PortalOptions = Partial<{
	/**
	 * 当前组件传递的参数方式1
	 */
	[key: string]: any;

	/**
	 * 当前组件传递的参数方式2
	 */
	propsData: {
		[key: string]: any;
	};

	/**
	 * 当前组件的名字
	 */
	name: string;

	/**
	 * 外层节点
	 */
	tag: string;

	/**
	 * 插入的节点
	 */
	el: string | HTMLElement; 

	/**
	 * 再次调用，实例不销毁
	 */
	alive: boolean;

	/**
	 * 多个实例共存
	 */
	multiple: boolean;

	/**
	 * promise调用
	 */
	promise?: boolean;

	/**
	 * 点击当前节点不销毁
	 */
	aliveRegExp: { 
		className?: RegExp;
		id?: RegExp;
	};

	/**
	 * 控制实例显示和隐藏的key值
	 */
	aliveKey: string;

	/**
	 * 延迟销毁，单位s
	 */
	leaveDelay: number;

	/**
	 * 自动销毁
	 */
	autoDestroy: boolean;

	/**
	 * 注入组件
	 */
	components: Record<string, Component>;

	/**
	 * 注入插件
	 */
	uses: Record<string, Plugin>;

	/**
	 * 是否使用片段，即组件没有根节点
	 */
	fragment: boolean;

	/**
	 * 使用插槽
	 */
	slots: VNodeNormalizedChildren;

	/**
	 * 父层实例
	 */
	parent: object;

	/**
	 * 获取实例
	 */
	getInstance: (instance: PortalLeaf) => any; 

	install: (app: App) => any;

	/**
	 * 调用前
	 */
	onBefore: <T = Promise<any>>(options: PortalOptions) => T;
	onFulfilled: (...args: any[]) => void;
	onRejected: (...args: any[]) => void;
}>;


export const defaults: PortalOptions = {
	tag: 'div', 
	el: 'body', 
	alive: false,
	multiple: false,
	promise: true,
	aliveRegExp: { className: /(vc-hack-alive|vc-hack-cp)/ },
	aliveKey: 'isVisible',
	leaveDelay: 300,
	autoDestroy: true,
	components: {},
	uses: {},
	fragment: false,
};