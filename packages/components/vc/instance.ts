import { reactive } from 'vue';
import { defaults } from './options';
import type { Options } from './options';

class Instance {
	/**
	 * 组件的配置项
	 */
	options = reactive(defaults);

	/**
	 * 处理全局捕获的事件, 用于计算位置
	 */
	globalEvent: MouseEvent = {} as MouseEvent;

	constructor() {
		typeof window !== 'undefined' && document.addEventListener('click', (e: MouseEvent) => {
			this.globalEvent = e;
		}, true);
	}

	/**
	 * 正在分发的那次点击点中的元素，文本节点取它所在的元素；不在点击中时为 null。
	 * 只有分发中 eventPhase 才非 0；处理函数之后的微任务（含组件更新）也在分发中执行，v-model 打开同样读得到
	 * @returns 点中的元素
	 */
	getTriggerElement() {
		const target = this.globalEvent?.eventPhase ? this.globalEvent.target : null;
		if (target instanceof Element) return target;
		return target instanceof Node ? target.parentElement : null;
	}

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
