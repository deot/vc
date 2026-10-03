/** @jsxImportSource vue */

import { defineComponent, onBeforeUnmount, ref, watch } from 'vue';
import { props as iconProps } from './icon-props';
import { IconManager } from './manager';

const COMPONENT_NAME = 'vc-icon';

// 12 -> [12, 12]; [20] -> [20, 20]; [100, 24] -> [100, 24]
const pair = (v: any): any[] => (Array.isArray(v) ? [v[0], v[1] || v[0]] : [v, v]);

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
			const { size, color } = props;
			// [外层宽高, 图标宽高]，如 [20, 12] -> [[20, 20], [12, 12]]
			const [box, glyph] = size ? pair(size).map(pair) : [];
			return (
				<i
					class={size ? 'vc-icon is-size' : 'vc-icon'}
					style={
						size
							? {
									color,
									width: `${box[0]}px`,
									height: `${box[1]}px`,
									fontSize: `${Math.min(glyph[0], glyph[1])}px`
								}
							: (color ? { color } : undefined)
					}
				>
					<svg
						viewBox={viewBox.value}
						xmlns="http://www.w3.org/2000/svg"
						style={
							size && glyph[0] !== glyph[1]
								? { width: `${glyph[0]}px`, height: `${glyph[1]}px` }
								: undefined
						}
					>
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
