/** @jsxImportSource vue */

import { defineComponent, ref, watch } from 'vue';
import { props as iconProps } from './icon-props';
import { IconManager } from './manager';

const COMPONENT_NAME = 'vc-icon';

export const Icon = defineComponent({
	name: COMPONENT_NAME,
	props: iconProps,
	setup(props) {
		const viewBox = ref('0 0 1024 1024');
		const path = ref<string[]>([]);

		const getConfig = () => {
			 /* istanbul ignore next -- @preserve */ 
			if (!props.type) return;
			viewBox.value = IconManager.icons[props.type].viewBox;
			path.value = IconManager.icons[props.type].path;
		};

		watch(
			() => props.type, 
			(v, old) => {
				if (!v) return;
				IconManager.icons[v]
					? getConfig() 
					: (
						old && IconManager.off(old, getConfig),
						v && IconManager.on(v, getConfig)
					);
			}, 
			{ immediate: true }
		);
		return () => {
			return (
				<i class="vc-icon">
					<svg viewBox={viewBox.value} xmlns="http://www.w3.org/2000/svg">
						{
							path.value.map((it: any, i: number) => {
								return (
									<path 
										key={i}
										d={it.d}
										fill={props.inherit && it.fill}
									/>
								);
							})
						}
					</svg>
				</i>
			);
		};
	}
});