import { defineComponent, h, computed, watch } from 'vue';
import * as Load from '@deot/helper-load';
import * as Utils from '@deot/helper-utils';
import { kebabCase } from 'lodash-es';
import { props as themeProps } from './theme-props';
import { VcInstance } from '../vc';

const COMPONENT_NAME = 'vc-theme';

export const Theme = defineComponent({
	name: COMPONENT_NAME,
	props: themeProps,
	setup(props, { slots }) {
		const themeId = Utils.getUid('vc-theme');
		const setVar = (name?: string) => {
			if (!name) return '';
			const globals = VcInstance.options.Theme.variables;
			return props.variables?.[name] || globals?.[name] || `var(--${name})`;
		};

		const styles = computed(() => {
			const results = [
				'color', 
				'backgroundColor', 
				'borderColor'
			].reduce((pre, key) => {
				pre[key] = props[key] && (setVar(props[key]));
				return pre;
			}, {} as any);

			const { backgroundImage } = props;

			if (backgroundImage) {
				// base64 或 网页地址
				results.backgroundImage = /:/.test(backgroundImage)
					? `url(${backgroundImage})`
					: `url(${setVar(backgroundImage)})`;

				results.backgroundSize = props.backgroundSize;
			}

			return results;
		});

		const classes = computed(() => {
			return {
				[`${themeId}`]: !!props.pseudo,
				'is-image': props.tag === 'img',
				'is-background-image': !!props.backgroundImage,
			};
		});

		const src$ = computed(() => {
			const { src, tag } = props;
			if (tag === 'img' && src) {
				const globals = VcInstance.options.Theme.variables;
				return /:/.test(src) 
					? src 
					: props.variables?.[src] || globals?.[src];
			}
		});

		const setCss = (attrs: object | string) => {
			if (!attrs || typeof attrs === 'string') return attrs;

			// 伪类、元素需要添加!important;
			let content = '';
			Object.entries(attrs).forEach(([key, val]) => {
				content += `${kebabCase(key)}: ${setVar(val as string)} !important;`;
			});

			return content;
		};

		const resetPseudo = () => {
			if (typeof document === 'undefined') return;
			
			const { pseudo } = props;
			if (!pseudo) return Load.removeStyle(themeId);

			let content = '';
			if (typeof pseudo === 'string') {
				content = pseudo;
			} else {
				Object.entries(pseudo).forEach(([key, val]) => {
					content += `.${themeId}${/^:/.test(key) ? '' : ':'}${key} { ${setCss(val)} }`;
				});
			}

			content && Load.style(content, { id: themeId });

		};

		watch(
			[
				() => props.pseudo, 
				() => VcInstance.options?.Theme?.variables
			], 
			resetPseudo, 
			{ immediate: true }
		);

		return () => {
			return h(
				props.tag, 
				{
					style: styles.value,
					class: classes.value,
					src: src$.value
				}, 
				slots
			);
		};
	}
});