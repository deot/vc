import { defineComponent, h } from 'vue';
import { props as themeProps } from './theme-props';
import { Theme } from './theme';

const COMPONENT_NAME = 'vc-theme-view';

export const ThemeView = defineComponent({
	name: COMPONENT_NAME,
	props: themeProps,
	setup(props, { slots }) {
		return () => {
			return h(
				Theme,
				{
					...props,
					tag: 'div'
				},
				slots
			);
		};
	}
});
