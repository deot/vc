/** @jsxImportSource vue */

import { onBeforeUnmount, ref, watch } from 'vue';
import type { SetupContext } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import { IconManager } from './manager';
import type { IconPath } from './manager';
import type { Props } from './icon-props';

// 12 -> [12, 12]; [20] -> [20, 20]; [100, 24] -> [100, 24]
const pair = (v: any): any[] => (Array.isArray(v) ? [v[0], v[1] || v[0]] : [v, v]);

/**
 * Icon 与 MIcon 共用：按 type 读取图标集中的 viewBox 与 path（图标集未加载时等待加载完成）并渲染
 * @param props ~
 * @param _context 统一签名，未使用
 * @param options ~
 * @param options.name 根节点类名
 * @param options.rem size 为 750 稿长度（移动端），随 --vc-rem 缩放
 * @returns render
 */
export const useIcon = (props: Props, _context: SetupContext, options: { name: string; rem?: boolean }) => {
	const { name } = options;
	const toLength = options.rem ? toRem : toPx;

	const viewBox = ref('0 0 1024 1024');
	const path = ref<IconPath[]>([]);

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
				class={size ? `${name} is-size` : name}
				style={
					size
						? {
								color,
								width: toLength(box[0]),
								height: toLength(box[1])
							}
						: (color ? { color } : undefined)
				}
			>
				<svg
					viewBox={viewBox.value}
					xmlns="http://www.w3.org/2000/svg"
					style={
						size
							? { width: toLength(glyph[0]), height: toLength(glyph[1]) }
							: undefined
					}
				>
					{
						path.value.map((it, i) => {
							return (
								<path
									key={i}
									d={it.d}
									fill={props.inherit ? it.fill : undefined}
								/>
							);
						})
					}
				</svg>
			</i>
		);
	};
};
