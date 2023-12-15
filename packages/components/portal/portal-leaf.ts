import type { App, ComponentPublicInstance, Ref } from 'vue';
import { VcError } from '../vc';

export class PortalLeaf {
	app?: App;

	/**
	 * 目标的实例，挂载到app上
	 */
	wrapper?: ComponentPublicInstance & Record<string, any>;

	propsData?: Ref<Record<string, any>>;

	/**
	 * 销毁的函数，挂载到app上，避免冲突
	 */
	destroy: (...args: any[]) => void;

	/**
	 * 自动销毁的标记，挂载到app上，避免冲突
	 */
	autoDestroy: boolean;

	target: Promise<any>;

	constructor(target: Promise<any>) {
		this.target = target;
		this.autoDestroy = false;
		this.destroy = /* istanbul ignore next */ () => {
			throw new VcError('portal', '未注册的destroy方法');
		};
	}

	then(resolve: (...args: any[]) => any, reject?: (...args: any[]) => any) {
		return this.target.then(resolve, reject);
	}

	catch(callback?: (...args: any[]) => any) {
		return this.target.catch(callback);
	}

	finally(callback?: (...args: any[]) => any) {
		return this.target.finally(callback);
	}
}
