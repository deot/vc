import type { App, Plugin, VNodeNormalizedChildren, Component } from 'vue';

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
	 * 点击当前节点不销毁
	 */
	aliveRegExp: { 
		className?: RegExp;
		id?: RegExp;
	};

	/**
	 * 控制实例显示和隐藏的key值
	 */
	aliveVisibleKey: string;

	/**
	 * 控制实例更新后执行的函数
	 */
	aliveUpdateKey: string;

	/**
	 * 延迟销毁，考虑transition动画时间，单位s
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

	install: (app: App) => any;

	/**
	 * 调用成功的回调
	 */
	onFulfilled: (...args: any[]) => any;
	/**
	 * 调用失败的回调
	 */
	onRejected: (...args: any[]) => any;

	/**
	 * 销毁时调用
	 */
	onDestoryed: (...args: any[]) => any;

	/**
	 * 创建之前调用
	 */
	onBeforeCreate: (propsData?: Record<string, any>) => Promise<Record<string, any>> | Record<string, any>;
}>;

export const defaults: PortalOptions = {
	tag: 'div', 
	el: 'body', 
	alive: false,
	multiple: false,
	aliveRegExp: { className: /(vc-hack-alive|vc-hack-cp)/ },
	aliveVisibleKey: 'isVisible',
	aliveUpdateKey: 'update',
	leaveDelay: 300,
	autoDestroy: true,
	components: {},
	uses: {},
	fragment: false,
};