import { reactive } from 'vue';
import { defaults } from './options';
import type { Options } from './options';

class Instance {
	/**
	 * 组件的配置项
	 */
	options = reactive(defaults);

	/**
	 * 本次点击所在的任务里点中的元素；下一个任务清掉，不再强引用
	 */
	private clicked: Element | null = null;

	/**
	 * 最近一次点击的元素，留给之后的任务（如请求回来后）打开的第一个弹层；弱引用，元素移除后可回收
	 */
	private lastClicked: WeakRef<Element> | null = null;

	constructor() {
		if (typeof window === 'undefined') return;
		// 点击所在的任务结束后清掉 clicked，取先到的一个：
		// setTimeout 在处理函数之前注册，处理函数里的 setTimeout 已属于之后的任务；消息不受定时器节流和测试里假定时器的影响
		const release = () => (this.clicked = null);
		const channel = new MessageChannel();
		channel.port1.onmessage = release;
		document.addEventListener('click', (e: MouseEvent) => {
			const { target } = e;
			const el = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
			this.clicked = el;
			this.lastClicked = el && new WeakRef(el);
			setTimeout(release);
			channel.port2.postMessage(null);
		}, true);
	}

	/**
	 * 打开弹层的那次点击点中的元素，文本节点取它所在的元素。
	 * - 点击所在的任务里（分发中、之后的微任务和组件更新）：总是返回它，同一次点击打开的多个弹层都从它展开
	 * - 之后的任务里（请求、定时器回来）：返回最近一次点击的元素，只给第一个来取的
	 * - 已移出文档时为 null
	 * - 一次点击只给一处用：点击所在的任务里取过，之后再取为 null
	 * @returns 点中的元素
	 */
	getTriggerElement() {
		const el = this.clicked || this.lastClicked?.deref();
		this.lastClicked = null;
		return el?.isConnected ? el : null;
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
