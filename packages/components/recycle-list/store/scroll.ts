/**
 * 共享同一 Store 的挂载实例最小结构
 */
export type ScrollLeaf = {
	exposed: {
		scrollTo: (opts: { x: number; y: number }) => void;
	};
};

/**
 * 多实例滚动联动：登记 leaf，把滚动同步到除 currentLeaf 外的所有实例
 */
export class Scroll {
	/**
	 * 当前主动滚动的实例；广播时跳过它，避免回环
	 */
	currentLeaf: ScrollLeaf | null = null;
	/**
	 * 共享同一 Store 的全部挂载实例
	 */
	leafs: ScrollLeaf[] = [];

	/**
	 * 登记一个挂载实例；首个实例自动成为 currentLeaf
	 * @param leaf 组件实例
	 */
	add(leaf: ScrollLeaf | null | undefined) {
		if (!leaf) return;
		if (!this.currentLeaf) {
			this.currentLeaf = leaf;
		}
		this.leafs.push(leaf);
	}

	/**
	 * 注销一个挂载实例
	 * @param leaf 组件实例
	 */
	remove(leaf: ScrollLeaf | null | undefined) {
		if (!leaf) return;
		const index = this.leafs.indexOf(leaf);
		if (index >= 0) this.leafs.splice(index, 1);
	}

	/**
	 * 把滚动事件同步广播给除 currentLeaf 外的所有实例
	 * @param e 滚动事件
	 * @param e.target 滚动容器（读取 scrollLeft/scrollTop）
	 */
	broadcast(e: { target: { scrollLeft: number; scrollTop: number } | EventTarget | null }) {
		if (!this.currentLeaf) return;
		const target = e.target as { scrollLeft: number; scrollTop: number } | null;
		if (!target) return;
		for (let i = 0; i < this.leafs.length; i++) {
			if (this.leafs[i] === this.currentLeaf) continue;
			this.leafs[i].exposed.scrollTo({
				x: target.scrollLeft,
				y: target.scrollTop
			});
		}
	}
}
