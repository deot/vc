/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as pageProps } from './page-props';

const COMPONENT_NAME = 'vc-page';

export const Page = defineComponent({
	name: COMPONENT_NAME,
	props: pageProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-page">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
