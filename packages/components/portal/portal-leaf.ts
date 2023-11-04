import type { App, ComponentPublicInstance } from 'vue';
import { VcError } from '../vc';

export class PortalLeaf {
	app?: App;

	/**
	 * 目标的实例，挂载到app上
	 */
	wrapper?: ComponentPublicInstance & Record<string, any>;

	/**
	 * 销毁的函数，挂载到app上，避免冲突
	 */
	destroy: (...args: any[]) => void;

	/**
	 * 自动销毁的标记，挂载到app上，避免冲突
	 */
	autoDestroy: boolean;
	
	constructor() {
		this.autoDestroy = false;
		this.destroy = () => {
			throw new VcError('portal', '未注册的destroy方法');
		};
	}
}