import { createApp, h, onMounted, onUnmounted } from 'vue';
import type { Component } from 'vue';
import * as Utils from '@deot/helper-utils';
import * as DOM from '@deot/helper-dom';
import { IS_SERVER, Utils as VcUtils } from '@deot/vc-shared';
// import { cloneDeep } from 'lodash-es';
import type { PortalOptions } from './default-options';

import { VcInstance, VcError } from '../vc';
import { defaults } from './default-options';
import { PortalLeaf } from './portal-leaf';

// 全部
const leafs = new Map<string, PortalLeaf>();


export class Portal<T extends Component> {
	/**
	 * 清理Portals类型组件
	 * @param  {string | string[]} name 清理的组件名
	 * @param  {boolean} force 是否强制清理, name 存在会变为true
	 */
	static clear(name: string | string[], force: boolean = false) {
		try {
			// 清理对象 
			let target = new Map<string, any>();
			if (name) {
				let names: string[] = [];
				if (typeof name === 'string') {
					names = [name];
				} else if (name instanceof Array && name.length > 0) {
					names = name;
				}

				names.forEach(i => target.set(i, '')); 

				// 清理
				force = true;
			} else {
				target = leafs;
			}
			for (let key of target.keys()) {
				const leaf = leafs.get(key);
				if (leaf && (force === true || leaf.autoDestroy === true)) {
					leaf.destroy();
				}
			}
		} catch (e) {
			throw new VcError('instance', e);
		}
	}

	/**
	 * 清理全部Portals
	 */
	static clearAll() {
		try {
			leafs.forEach((item) => item[1].destroy());
		} catch (e) {
			throw new VcError('instance', e);
		}
	}

	wrapper: T;

	waiting = false;

	globalOptions: PortalOptions;

	constructor(wrapper: T, options?: PortalOptions) {
		this.wrapper = wrapper;

		this.globalOptions = {
			...options,
			name: options?.name || wrapper.name || Utils.getUid('vc-portal')
		};
	}

	popup = (options: PortalOptions) => {
		const $options = { ...this.getDefaultOptions(), ...options };
		const { onBefore, onFulfilled, onRejected, promise, ...rest } = $options;

		return promise 
			? new Promise((resolve, reject) => {
				(async () => {
					if (typeof onBefore === 'function' && !this.waiting) {
						try {
							this.waiting = true;
							let response = await onBefore(options);
							this.render(rest, resolve, reject, response);
						} catch (res) {
							this.waiting = false;
							reject(res);
						}
					} else {
						this.render(rest, resolve, reject);
					}
				})();
			})
			: this.render(rest, onFulfilled, onRejected);
	};

	/**
	 * 销毁当前Portal下的节点
	 * @param {string | PortalLeaf} target [description]
	 */
	destroy = (target?: string | PortalLeaf) => {
		const { multiple, name } = this.getDefaultOptions();
		target = target || name;
		const instance: PortalLeaf = typeof target === 'object' 
			? target 
			: (leafs.get(target!) as PortalLeaf);

		if (instance) {
			instance.destroy();
		} else if (multiple) {
			leafs.forEach((item, key) => {
				if (key.includes(name)) {
					item.destroy();
				}
			});
		}
	};

	private getDefaultOptions() {
		return {
			...defaults, 
			...(VcInstance.options as any).Portal,
			...this.globalOptions
		};
	}

	private createCallback(getLeaf: () => PortalLeaf, options: PortalOptions, callback?: any) {
		const { leaveDelay } = options;

		return (...res: any[]) => {
			setTimeout(() => {
				let leaf = getLeaf();
				if (!leaf) {
					throw new VcError('portal', '实例不存在或已卸载');
				}

				leaf.destroy();
			}, leaveDelay);
			callback?.(...res);
		};
	}

	private render(
		options: PortalOptions, 
		onFulfilled?: (...args: any[]) => void,
		onRejected?: (...args: any[]) => void, 
		response?: any,
	) {
		let { 
			el, 
			tag, 
			alive,
			aliveRegExp,
			aliveKey,
			name,
			leaveDelay,
			autoDestroy,
			getInstance, 
			multiple,
			fragment,

			// 全局注册
			globalProperties,
			install,
			components,
			uses,

			slots,
			parent,

			propsData,
			...rest
		} = options;

		let useAllNodes = fragment;
		name = (multiple ? `${name}__${Utils.getUid('vc-portal')}` : name);

		const container: HTMLElement & { _children?: HTMLElement[] } = document.createElement(tag as any);
		const root: HTMLElement | null = typeof el === 'object' ? el : document.querySelector(el || 'body');

		// destroy
		!alive && leafs.get(name!)?.destroy();

		propsData = propsData || rest;
		if (response && !propsData.dataSource) {
			propsData.dataSource = response;
		}

		let leaf = new PortalLeaf();
		const $onDestory = () => {
			if (!root) return;

			leaf.app?.unmount();
			if (useAllNodes) {
				root.contains(container) && root.removeChild(container);
			} else if (container && container._children) {
				container._children.forEach(i => {
					if (!root) return;
					root.contains(i) && root.removeChild(i);
				});
			}

			leafs.delete(name!);
		};

		const $onRejected = this.createCallback(() => leaf, options, onRejected);
		const $onFulfilled = this.createCallback(() => leaf, options, onFulfilled);

		if (alive && leafs.has(name!)) {
			leaf = leafs.get(name!) as PortalLeaf;

			for (let key in propsData) {
				(leaf.wrapper as any)[key] = propsData[key];
			}

			// update
			let fn = leaf.wrapper?.update || leaf.wrapper?.loadData;
			fn && fn(options);
		} else {
			let wrapper = this.wrapper;
			// if (typeof this.wrapper == 'object') {
			// 	wrapper = cloneDeep(this.wrapper);

			// 	(wrapper as any).props = wrapper.props || {};

			// 	wrapper.props.onPortalFulfilled = Function;
			// 	wrapper.props.onPortalRejected = Function;
			// }

			const app = createApp({
				name: 'vc-portal',
				parent,
				setup() {
					const handleExtra = (e: Event) => {
						// close默认不传，用户可传递参数判断输入自己的触发的close
						try {
							let path = (e as any).path || DOM.composedPath(e) || [];
							if (
								container 
								&& e.target
								&& !container.contains(e.target as HTMLElement) 
								&& !path.some((item: any) => VcUtils.eleInRegExp(item, aliveRegExp!))
							) {
								if (
									leaf.wrapper 
									&& leaf.wrapper?.[aliveKey!]
								) {
									leaf.wrapper[aliveKey!] = false;
									setTimeout(() => $onRejected(), leaveDelay!);
								} else {
									$onRejected();
								}
							}
						} catch (error) {
							throw new VcError('portal', error);
						}
					};

					onMounted(() => {
						alive && document.addEventListener('click', handleExtra, true);
					});

					onUnmounted(() => {
						alive && document.addEventListener('click', handleExtra, true);
					});

					return () => h(
						wrapper, 
						{
							...propsData,
							ref: (vm: any) => (leaf.wrapper = vm),
							onPortalFulfilled: (...args: any[]) => $onFulfilled(...args),
							onPortalRejected: (...args: any[]) => $onRejected(...args)
						}, 

						slots || undefined
					);
				}
			});

			leaf.app = app;

			if (globalProperties) {
				app.config.globalProperties = globalProperties;
			}

			// store, router等
			for (let key in components) {
				app.component(key, components[key]);
			}

			for (let key in uses) {
				app.use(uses[key]);
			}

			install?.(app);
			
			app.mount(container);
		}

		// destroy method
		leaf.destroy = $onDestory;

		// tag
		leaf.autoDestroy = !!autoDestroy;

		// 回调leaf实例
		getInstance?.(leaf);

		// 标记
		leafs.set(name!, leaf);

		/**
		 * if 
		 * 渲染结果为: <div data-v-app> <wrapper /> </div>
		 * 两种情况
		 * 1. wrapper根节点使用v-if
		 * 2. fragment: true, 解决渲染问题
		 * 
		 * （因为wrapper没有根节点, childs中的根节点使用v-if，后续不会渲染出来）
		 *
		 * else
		 * 渲染结果为: <wrapper /> 
		 */
		if (
			fragment 
			|| (
				typeof container._children === 'undefined'
				&& !Array.from(container.children).length
			) 
		) {
			useAllNodes = true;
			container.parentElement === null && root?.appendChild(container);
		} else {
			!container._children && (
				container._children = [],
				Array
					.from(container.children)
					.forEach(i => {
						root?.appendChild(i as HTMLElement);
						container._children?.push?.(i as HTMLElement);
					})
			);
		}

		this.waiting = false;
		return leaf;
	}
}