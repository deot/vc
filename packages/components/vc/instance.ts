import { reactive } from 'vue';
import { defaults } from './options';
import type { Options } from './options';

let globalEvent: MouseEvent;

typeof window !== 'undefined' && document.addEventListener('click', (e: MouseEvent) => {
	globalEvent = e;
}, true);

class Instance {
	/**
	 * 组件的配置项
	 */
	options = reactive(defaults);

	/**
	 * 处理全局捕获的事件, 用于计算位置
	 */
	globalEvent: MouseEvent = globalEvent || ({} as MouseEvent);

	configure(options?: Options) {
		if (options) {
			Object.keys(options).forEach(i => {
				this.options[i] = options[i];
			});
		}

		return this;
	}
}

export const VcInstance = new Instance();
