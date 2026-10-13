import { ref, watch, onMounted, onUpdated, getCurrentInstance, onUnmounted } from 'vue';

/**
 * 可由键盘聚焦的节点：未禁用、未被过滤隐藏，且不在收起的分组内
 * @param el 树或其容器
 * @returns ~
 */
export const getFocusableItems = (el?: Element | null) => {
	return Array.from(el?.querySelectorAll<HTMLElement>('.is-focusable[role=treeitem]') || [])
		.filter(item => !item.closest('.vc-tree-node.is-hidden, .vc-tree-node__children[aria-expanded="false"]'));
};

export const useKeydown = () => {
	const { vnode } = getCurrentInstance()!;
	const checkboxItems = ref([]);

	const initTabIndex = () => {
		checkboxItems.value = vnode.el!.querySelectorAll('input[type=checkbox]');
		const item = vnode.el!.querySelector('.is-checked[role=treeitem]')
			|| vnode.el!.querySelector('.is-focusable[role=treeitem]');
		item?.setAttribute('tabindex', 0);
	};

	const handleKeydown = (ev) => {
		const currentItem = ev.target;
		if (currentItem.className.indexOf('vc-tree-node') === -1) return;
		const keyCode = ev.keyCode;
		// 只在可见的节点间移动（被过滤隐藏、所在分组收起的节点无法聚焦）
		const items = getFocusableItems(vnode.el as Element);
		const currentIndex = items.indexOf(currentItem);
		let nextIndex: number;
		if ([38, 40].indexOf(keyCode) > -1) { // up、down
			ev.preventDefault();
			if (keyCode === 38) { // up
				nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
			} else {
				nextIndex = (currentIndex < items.length - 1) ? currentIndex + 1 : 0;
			}
			items[nextIndex]?.focus(); // 选中
		}
		if ([37, 39].indexOf(keyCode) > -1) { // left、right 展开
			ev.preventDefault();
			currentItem.click(); // 选中
		}
		const hasInput = currentItem.querySelector('[type="checkbox"]');
		if ([13, 32].indexOf(keyCode) > -1 && hasInput) { // space enter选中checkbox
			ev.preventDefault();
			hasInput.click();
		}
	};

	watch(
		() => checkboxItems.value,
		(v) => {
			Array.prototype.forEach.call(v, (checkbox) => {
				checkbox.setAttribute('tabindex', -1);
			});
		}
	);

	onMounted(() => {
		initTabIndex();
		vnode.el!.addEventListener('keydown', handleKeydown);
	});

	onUpdated(() => {
		checkboxItems.value = vnode.el!.querySelectorAll('input[type=checkbox]');
	});

	onUnmounted(() => vnode.el!.removeEventListener('keydown', handleKeydown));
};
