import type { App } from 'vue';
import type { Options } from './options';

import { VcError } from './error';
import { VcInstance } from './instance';

export const install = (app: App, options?: Options) => {
	app.config.globalProperties.$vc = VcInstance.configure(options);
};

export {
	VcError,
	VcInstance
};
