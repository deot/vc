/** @jsxImportSource vue */

import { defineComponent, onBeforeUnmount, ref, watch } from 'vue';
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
				// 先移除旧 type 上等待中的监听（切换到已加载的 type 或空值时也需要移除）
				old && IconManager.off(old, getConfig);
				if (!v) return;
				IconManager.icons[v]
					? getConfig()
					: IconManager.on(v, getConfig);
			},
			{ immediate: true }
		);

		// 卸载时移除等待中的监听，避免图标集未加载时反复挂载/卸载导致监听累积
		onBeforeUnmount(() => {
			props.type && IconManager.off(props.type, getConfig);
		});
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
