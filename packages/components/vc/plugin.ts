import type { App, Component } from 'vue';
import type { Options as VcOptions } from './options';
import { VcInstance } from './instance';

/**
 * 基于给定的组件集合创建插件工厂，自身不引用任何组件，便于按需引入时 tree-shaking
 * @param components 需要注册的组件，键名即注册名
 * @returns createVcPlugin(options?, transfromComponentKey?)
 */
export const defineVcPlugin = (components: Record<string, Component>) => {
	return (options?: VcOptions, transfromComponentKey = (x: string) => x) => {
		return {
			install: (app: App) => {
				app.config.globalProperties.$vc = VcInstance.configure(options);
				Object.keys(components).forEach((key) => {
					app.component(transfromComponentKey(key) || key, components[key]);
				});
			}
		};
	};
};
