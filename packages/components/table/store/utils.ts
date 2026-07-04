export const flattenData = (data: any[], opts: any = {}) => {
	const result: any = [];
	data.forEach((item: any) => {
		if (item.children) {
			const { children, ...rest } = item;
			opts.parent
				? result.push(...[opts.cascader ? item : rest, ...flattenData(children, opts)])
				: result.push(...flattenData(children));
		} else {
			result.push(item);
		}
	});
	return result;
};

/**
 * ~
 * @param root ~
 * @param cb ~
 * @param opts ~
 */
export const walkTreeNode = (root: any, cb: any, opts = {}) => {
	const {
		childrenKey = 'children',
		lazyKey = 'hasChildren',
		level: baseLevel = 0
	} = opts as any;

	const isNil = (array: any) => !(Array.isArray(array) && array.length);

	/**
	 *
	 * @param parent ~
	 * @param children ~
	 * @param level ~
	 */
	function _walker(parent: any, children: any, level: number) {
		cb(parent, children, level);
		children.forEach((item: any) => {
			if (item[lazyKey]) {
				cb(item, null, level + 1);
				return;
			}
			const $children = item[childrenKey];
			if (!isNil($children)) {
				_walker(item, $children, level + 1);
			}
		});
	}

	root.forEach((item: any) => {
		if (item[lazyKey]) {
			cb(item, null, baseLevel);
			return;
		}
		const children = item[childrenKey];
		if (!isNil(children)) {
			_walker(item, children, baseLevel);
		}
	});
};

/**
 * 存在副作用
 * 对 statusArr 做添加和删除的操作
 * @param statusArr 状态数组（如 selection / expandRows）
 * @param row 目标行数据
 * @param newVal 指定展开/选中与否；省略时切换
 * @param batch 为 true 时，使用 delete（批处理使用 splice 性能差，使用 delete 后统一再处理）
 * @returns 是否发生变更
 */
export const toggleRowStatus = (statusArr: any, row: any, newVal: any, batch = false) => {
	let changed = false;
	const index = statusArr.indexOf(row);
	const included = index !== -1;

	const addRow = () => {
		statusArr.push(row);
		changed = true;
	};
	const removeRow = () => {
		if (!batch) {
			statusArr.splice(index, 1);
		} else {
			delete statusArr[index];
		}
		changed = true;
	};

	if (typeof newVal === 'boolean') {
		if (newVal && !included) {
			addRow();
		} else if (!newVal && included) {
			removeRow();
		}
	} else {
		included ? removeRow() : addRow();
	}
	return changed;
};
