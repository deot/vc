/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance } from 'vue';
import { props as printProps } from './print-props';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-print';

export const Print = defineComponent({
	name: COMPONENT_NAME,
	props: printProps,
	setup(props, { expose, slots }) {
		const instance = getCurrentInstance()!;
		// 执行
		const print = () => {
			// filter
			const $ = Array.from(document.body.children).filter(
				item => item.nodeName === 'DIV' && (item as any).style.display !== 'none'
			);
			// hide it
			$.forEach(item => (item as any).style.display = 'none');

			// regiser print
			const div = document.createElement('div');
			console.log(instance.vnode.el!);
			div.appendChild(instance.vnode.el!.cloneNode(true));

			document.body.appendChild(div);
			window.print();

			// remove print
			$.forEach(item => (item as any).style.removeProperty('display'));
			document.body.removeChild(div);
		};

		expose({ print });
		return () => {
			// value 本身就是 HTML
			return (
				<Customer wrap class="vc-print" render={slots.default || { type: 'html', value: props.value }} />
			);
		};
	}
});
