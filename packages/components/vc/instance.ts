import { reactive } from 'vue';
import { defaults } from './options';
import type { Options } from './options';

class Instance {
	/**
	 * 组件的配置项
	 */
	options = reactive(defaults);

	configure(options?: Options) {
		if (options) {
			Object.keys(options).forEach((i) => {
				if (i === 'locale' && options.locale === undefined) return;
				this.options[i] = options[i];
			});
		}

		return this;
	}
}

export const VcInstance = new Instance();
