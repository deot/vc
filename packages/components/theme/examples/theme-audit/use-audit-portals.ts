import { onBeforeUnmount, watch } from 'vue';
import type { PortalLeaf } from '../../../portal/portal-leaf';

// 仅管理当前示例创建的实例，不调用组件的全局 destroy()。
export const useAuditPortals = (generation: () => number | undefined) => {
	const leaves = new Set<PortalLeaf>();
	const open = (create: (options: Record<string, any>) => PortalLeaf, options: Record<string, any> = {}) => {
		const leaf: PortalLeaf = create({
			...options,
			onDestroyed: () => {
				leaves.delete(leaf);
				options.onDestroyed?.();
			}
		});
		leaves.add(leaf);
		return leaf;
	};
	const destroy = () => {
		for (const leaf of leaves) leaf.destroy();
		leaves.clear();
	};
	watch(generation, destroy);
	onBeforeUnmount(destroy);
	return { open };
};
