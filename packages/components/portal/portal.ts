/* eslint-disable no-dupe-class-members */
/* eslint-disable lines-between-class-members */

import { createApp, h, onMounted, onBeforeUnmount, ref } from 'vue';
import type { Component } from 'vue';
import * as Utils from '@deot/helper-utils';
import * as DOM from '@deot/helper-dom';
import { Utils as VcUtils } from '@deot/vc-shared';
import type { PortalOptions } from './default-options';

import { VcInstance, VcError } from '../vc';
import { defaults } from './default-options';
import { PortalLeaf } from './portal-leaf';


const COMPONENT_NAME = 'vc-portal';

export class Portal<T extends Component> {
	/**
	 * 清理Portals类型组件
	 * @param  {string | string[] | boolean} name 清理的组件名, boolean表示全部leafs是否强制清理
	 */
	static clear(name?: string | string[] | boolean) {
		try {
			let force = false;
			// 清理对象 
			let target = new Map<string, any>();
			if (name && typeof name !== 'boolean') {
				let names: string[] = [];
				if (typeof name === 'string') {
					names = [name];
				} else if (name instanceof Array && name.length > 0) {
					names = name;
				}

				names.forEach(i => target.set(i, '')); 
				force = true;
			} else {
				force = !!name;
				target = Portal.leafs;
			}
			for (let key of target.keys()) {
				const leaf = Portal.leafs.get(key);
				if (leaf && (force === true || leaf.autoDestroy === true)) {
					leaf.destroy();
				}
			}
		} catch (e) {
			/* istanbul ignore next -- @preserve */ 
			throw new VcError('instance', e);
		}
	}

	/**
	 * 清理全部Portals
	 */
	static clearAll() {
		try {
			Portal.leafs.forEach((leaf) => leaf.destroy());
		} catch (e) {
			/* istanbul ignore next -- @preserve */
			throw new VcError('instance', e);
		}
	}

	static leafs = new Map<string, PortalLeaf>();

	wrapper: T;

	globalOptions: PortalOptions;

	constructor(wrapper: T, options?: PortalOptions) {
		this.wrapper = wrapper;

		this.globalOptions = {
			...options,
			name: options?.name || wrapper.name || Utils.getUid(COMPONENT_NAME)
		};
	}

	popup(): PortalLeaf;
	popup(options: PortalOptions): PortalLeaf;
	popup(propsData: Record<string, any>, options: PortalOptions): PortalLeaf;
	popup(propsData?: Record<string, any>, options?: PortalOptions): PortalLeaf {
		if (!options) {
			options = propsData || {};
		} else {
			options.propsData = propsData;
		}

		const $options = { ...this.getDefaultOptions(), ...options };
		const { onFulfilled, onRejected, ...rest } = $options;

		let onFulfilled$ = /* istanbul ignore next -- @preserve */ () => {};
		let onRejected$ = /* istanbul ignore next -- @preserve */ () => {};
		const target = new Promise<any>((resolve, reject) => {
			onFulfilled$ = (v?: any) => {
				onFulfilled?.(v);
				resolve(v);
			};
			onRejected$ = (v?: any) => {
				onRejected?.(v);
				reject(v);
			};
		});

		return this.render(rest, target, onFulfilled$, onRejected$);
	}

	/**
	 * 销毁当前Portal下的节点
	 * @param {string | PortalLeaf} target [description]
	 */
	destroy = (target?: string | PortalLeaf) => {
		const { multiple, name } = this.getDefaultOptions();
		target = target || name;
		const instance: PortalLeaf = typeof target === 'object' 
			? target 
			: (Portal.leafs.get(target!) as PortalLeaf);

		if (instance) {
			instance.destroy();
		} else if (multiple) {
			Portal.leafs.forEach((item, key) => {
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

	private createCallback(getLeaf: () => PortalLeaf, delay?: number, callback?: any) {
		return (...args: any[]) => {
			let done = () => {
				let leaf = getLeaf();
				/* istanbul ignore next -- @preserve */
				if (!leaf) {
					throw new VcError('portal', '实例不存在或已卸载');
				}

				leaf.destroy();
			};

			delay ? setTimeout(done, delay) : done();
			callback?.(...args);
		};
	}

	private render(
		options: PortalOptions, 
		target: Promise<any>,
		onFulfilled: (v?: any) => any,
		onRejected: (v?: any) => any
	): PortalLeaf {
		let { 
			el, 
			tag, 
			alive,
			aliveRegExp,
			aliveVisibleKey,
			aliveUpdateKey,
			name,
			leaveDelay,
			autoDestroy,
			multiple,
			fragment,
			onDestoryed,

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
		name = (multiple ? `${name}__${Utils.getUid(COMPONENT_NAME)}` : name);

		const container: HTMLElement & { _children?: HTMLElement[] } = document.createElement(tag as any);
		const root: HTMLElement | null = typeof el === 'object' ? el : document.querySelector(el || 'body');

		// destroy
		!alive && Portal.leafs.get(name!)?.destroy();

		const propsData$ = propsData || rest;

		let leaf = new PortalLeaf(target);
		const $onDestoryed = () => {
			// 已经销毁，连续执行destory时不在执行
			if (!Portal.leafs.has(name!)) {
				return;
			}
			onDestoryed?.();
			leaf.app?.unmount();

			/* istanbul ignore else -- @preserve */ 
			if (useAllNodes) {
				root?.contains(container) && root.removeChild(container);
			} else if (container && container._children) {
				container._children.forEach(i => {
					root?.contains(i) && root.removeChild(i);
				});
			}

			Portal.leafs.delete(name!);
		};

		const $onRejected = this.createCallback(() => leaf, leaveDelay, onRejected);
		const $onFulfilled = this.createCallback(() => leaf, leaveDelay, onFulfilled);

		if (alive && Portal.leafs.has(name!)) {
			leaf = Portal.leafs.get(name!) as PortalLeaf;
			leaf.target = target;
			leaf.propsData!.value = propsData$;

			// update
			leaf.wrapper?.[aliveUpdateKey!]?.(options);
		} else {
			let wrapper = this.wrapper;
			const app = createApp({
				name: COMPONENT_NAME,
				parent,
				setup() {
					if (alive) {
						const handleExtra = (e: Event) => {
							// close默认不传，用户可传递参数判断输入自己的触发的close
							try {
								let path = (e as any).path || DOM.composedPath(e);
								/* istanbul ignore else -- @preserve */ 
								if (
									container 
									&& e.target
									&& !container.contains(e.target as HTMLElement) 
									&& !path?.some((item: any) => VcUtils.eleInRegExp(item, aliveRegExp!))
								) {
									/* istanbul ignore else -- @preserve */ 
									if (
										leaf.wrapper 
										&& leaf.wrapper?.[aliveVisibleKey!]
									) {
										leaf.wrapper[aliveVisibleKey!] = false;
									}

									// 注意这里`leaf.target`会一直处于pending状态
									leaveDelay ? setTimeout($onDestoryed, leaveDelay) : $onDestoryed();
								}
							} catch (error) {
								/* istanbul ignore next -- @preserve */ 
								throw new VcError('portal', error);
							}
						};

						onMounted(() => {
							document.addEventListener('click', handleExtra, true);
						});

						onBeforeUnmount(() => {
							document.removeEventListener('click', handleExtra, true);
						});
					}

					const propsData$$ = ref(propsData$);
					leaf.propsData = propsData$$;
					return () => h(
						wrapper, 
						{
							...propsData$$.value,
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
		leaf.destroy = $onDestoryed;

		// tag
		leaf.autoDestroy = !!autoDestroy;

		// 标记
		Portal.leafs.set(name!, leaf);

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

		return leaf;
	}
}