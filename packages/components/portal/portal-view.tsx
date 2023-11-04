import { defineComponent, Fragment, h, Teleport } from 'vue';
import { props as portalProps } from './portal-view-props';

const COMPONENT_NAME = 'vc-portal-view';

/**
 * 写法不同，但与vue@2.x 保持一致
 */
export const PortalView = defineComponent({
	name: COMPONENT_NAME,
	props: portalProps,
	setup(props, { slots }) {
		return () => {
			/**
			 * 考虑占位的情况下需要渲染default
			 */
			return h(
				Fragment,
				[
					h(props.tag, { class: 'vc-portal-view' }, slots?.default?.()),
					h(Teleport as any, { to: 'body' }, slots?.content?.())
				]
			);
		};
	}
});