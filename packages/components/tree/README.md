## 树形控件（Tree）

用清晰的层级结构展示信息，可展开或折叠。

### 何时使用

文件夹、组织架构、生物分类、国家地区等等，世间万物的大多数结构都是树形结构。使用 树控件 可以完整展现其中的层级关系，并具有展开收起选择等交互功能。

### 基础用法

最简单的用法，展示数据，可通过`node-click`获取点击的节点元素。

:::RUNTIME
```vue
<template>
	<div>
		<Tree
			:data="data"
			@node-click="handleNodeClick"  />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Tree } from '@deot/vc';

const data = ref([{
	label: '一级 1',
	children: [{
		label: '二级 1-1',
		children: [{
			label: '三级 1-1-1'
		}]
	}]
}, {
	label: '一级 2',
	children: [{
		label: '二级 2-1',
		children: [{
			label: '三级 2-1-1'
		}]
	}, {
		label: '二级 2-2',
		children: [{
			label: '三级 2-2-1'
		}]
	}]
}, {
	label: '一级 3',
	children: [{
		label: '二级 3-1',
		children: [{
			label: '三级 3-1-1'
		}]
	}, {
		label: '二级 3-2',
		children: [{
			label: '三级 3-2-1'
		}]
	}]
}]);

// data：节点数据；node：节点对应的 TreeNode；instance：节点组件实例；event：事件对象
const handleNodeClick = ({ data, node, instance, event }) => {
	console.log(data);
	console.log(node);
	console.log(instance, event);
};
</script>
```
:::

### 可选择
适用于需要选择层级时使用，选中父级时自动选中子节点数据。

:::RUNTIME
```vue
<template>
	<div>
		<Tree
			:data="data"
			show-checkbox
			@check-change="handleCheckChange"  />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Tree } from '@deot/vc';

const data = ref([{
	label: '一级 1',
	children: [{
		label: '二级 1-1',
		children: [{
			label: '三级 1-1-1'
		}]
	}]
}, {
	label: '一级 2',
	children: [{
		label: '二级 2-1',
		children: [{
			label: '三级 2-1-1'
		}]
	}, {
		label: '二级 2-2',
		children: [{
			label: '三级 2-2-1'
		}]
	}]
}, {
	label: '一级 3',
	children: [{
		label: '二级 3-1',
		children: [{
			label: '三级 3-1-1'
		}]
	}, {
		label: '二级 3-2',
		children: [{
			label: '三级 3-2-1'
		}]
	}]
}]);

const handleCheckChange = ({ data, checked, indeterminate }) => {
	console.log(data, checked, indeterminate);
};
</script>
```
:::

### 懒加载自定义叶子节点
由于在点击节点时才进行该层数据的获取，默认情况下 Tree 无法预知某个节点是否为叶子节点，所以会为每个节点添加一个下拉按钮，如果节点没有下层数据，则点击后下拉按钮会消失。同时，你也可以提前告知 Tree 某个节点是否为叶子节点，从而避免在叶子节点前渲染下拉按钮。

:::RUNTIME
```vue
<template>
	<div>
		<Tree
			:data="data"
			:load-data="loadData"
			lazy
			show-checkbox
			@check-change="handleCheckChange"  />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Tree } from '@deot/vc';

const data = ref([{
	label: '一级 1',
	children: [{
		label: '二级 1-1',
		children: [{
			label: '三级 1-1-1'
		}]
	}]
}, {
	label: '一级 2',
	children: [{
		label: '二级 2-1',
		children: [{
			label: '三级 2-1-1'
		}]
	}, {
		label: '二级 2-2',
		children: [{
			label: '三级 2-2-1'
		}]
	}]
}, {
	label: '一级 3',
	children: [{
		label: '二级 3-1',
		children: [{
			label: '三级 3-1-1'
		}]
	}, {
		label: '二级 3-2',
		children: [{
			label: '三级 3-2-1'
		}]
	}]
}]);
const loadData = (parent) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([{
				value: '4-1',
				label: '二级 4-1',
				children: [{
					value: '4-1-1',
					label: '三级 4-1-1'
				}],
			}, {
				value: '4-2',
				label: '二级 4-2',
				isLeaf: true
			}, {
				value: '4-3',
				label: '二级 4-3'
			}]);
		}, 3000);
	});
};
const handleCheckChange = ({ data, checked, indeterminate }) => {
	console.log(data, checked, indeterminate);
};
```
:::

### 禁用状态
可将 Tree 的某些节点通过`disabled`设置为禁用状态。

:::RUNTIME
```vue
<template>
	<div>
		<Tree
			:data="data"
			show-checkbox/>
	</div>
</template>
<script setup>
import { Tree } from '@deot/vc';

const data = ref([{
	id: 1,
	label: '一级 1',
	disabled: true,
	children: [{
		id: 4,
		label: '二级 1-1',
		children: [{
			id: 9,
			label: '三级 1-1-1'
		}, {
			id: 10,
			label: '三级 1-1-2',
			disabled: true
		}]
	}]
}, {
	id: 2,
	label: '一级 2',
	children: [{
		id: 5,
		label: '二级 2-1',
		disabled: true
	}, {
		id: 6,
		label: '二级 2-2'
	}]
}, {
	id: 3,
	label: '一级 3',
	children: [{
		id: 7,
		label: '二级 3-1'
	}, {
		id: 8,
		label: '二级 3-2'
	}]
}]);
</script>
```
:::

### 树节点的选择
本例展示如何获取和设置选中节点。获取和设置各有两种方式：通过 `node` 或通过 `key`。如果需要通过 `key` 来获取或设置，则必须设置`node-key`, 通过key获取目前还不支持。

:::RUNTIME
```vue
<template>
	<div>
		<Tree
			ref="tree"
			:data="data"
			:render="renderContent"
			show-checkbox
			default-expand-all
			highlight-current />
		<div class="buttons">
			<Button @click="getCheckedNodes">通过 node 获取</Button>
			<!-- <Button @click="getCheckedValues">通过 key 获取</Button>
			<Button @click="setCheckedNodes">通过 node 设置</Button>
			<Button @click="setCheckedValues">通过 key 设置</Button>
			<Button @click="resetChecked">清空</Button> -->
		</div>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { Tree, Button } from '@deot/vc';

const data = ref([{
	id: 1,
	label: '一级 1',
	children: [{
		id: 4,
		label: '二级 1-1',
		children: [{
			id: 9,
			label: '三级 1-1-1'
		}, {
			id: 10,
			label: '三级 1-1-2',
		}]
	}]
}, {
	id: 2,
	label: '一级 2',
	children: [{
		id: 5,
		label: '二级 2-1',
	}, {
		id: 6,
		label: '二级 2-2'
	}]
}, {
	id: 3,
	label: '一级 3',
	children: [{
		id: 7,
		label: '二级 3-1'
	}, {
		id: 8,
		label: '二级 3-2'
	}]
}]);

const tree = ref();
const getCheckedNodes = () => {
	console.log(tree.value.getCheckedNodes());
};

const renderContent = ({ it, node }) => {
	return (
		<span>
			{it.label}
			{' '}
			自定义渲染
		</span>
	);
};

const getCheckedValues = () => {
	console.log(tree.value.getCheckedValues());
};

const setCheckedNodes = () => {
	tree.value.setCheckedNodes([{
		id: 5,
		label: '二级 2-1'
	}, {
		id: 9,
		label: '三级 1-1-1'
	}]);
};

const setCheckedValues = () => {
	tree.value.setCheckedValues([3]);
};

const resetChecked = () => {
	tree.value.setCheckedValues([]);
};
</script>
<style>
.buttons {
	margin: 10px 0;
}
</style>
```
:::

### 手风琴模式
通过`accordion`属性开启手风琴模式，每次只能展开一个同层级的节点。

:::RUNTIME
```vue
<template>
	<div>
		<Tree
			:data="data"
			accordion
			@node-click="handleNodeClick"  />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Tree } from '@deot/vc';

const data = ref([{
	label: '一级 1',
	children: [{
		label: '二级 1-1',
		children: [{
			label: '三级 1-1-1'
		}]
	}]
}, {
	label: '一级 2',
	children: [{
		label: '二级 2-1',
		children: [{
			label: '三级 2-1-1'
		}]
	}, {
		label: '二级 2-2',
		children: [{
			label: '三级 2-2-1'
		}]
	}]
}, {
	label: '一级 3',
	children: [{
		label: '二级 3-1',
		children: [{
			label: '三级 3-1-1'
		}]
	}, {
		label: '二级 3-2',
		children: [{
			label: '三级 3-2-1'
		}]
	}]
}]);
const handleNodeClick = ({ data }) => {
	console.log(data);
};
</script>
```
:::

### 可拖拽节点
通过 `draggable` 属性可让节点变为可拖拽，将节点拖拽到其他节点内部或前后。

- 节点所在行的上 / 中 / 下区域分别表示放在它之前（`before`）、放入它（`inner`，追加为最后一个子节点，目标节点的标签高亮）、放在它之后（`after`）。
- 已展开且有子节点的节点没有 `after` 区域（它的下方紧接第一个子节点）；要放到它的整棵子树之后，拖到下一个同级节点的上方区域。
- `allow-drag({ node, data })` 返回 `false` 时节点不能拖动。
- `allow-drop({ node, data, targetNode, position, from, to })` 对三个区域分别询问：被拒绝的区域让给相邻区域，三个区域都被拒绝时显示不可放置。
	- `from` / `to` 为移动前后的位置 `{ parent, index }`：`parent` 为父节点的 TreeNode，根级为 `null`；`to.index` 为移除被拖节点之后的下标。
	- 与 Table 的 `allow-drop` 相同，例如只允许同级：`({ from, to }) => from.parent === to.parent`。
- 放下时先发出 `node-drop`，再发出 `node-dragend`；取消或没有放下时只发出 `node-dragend`（`dropped` 为 `false`）。

完整示例：[拖拽事件与参数 / 只允许同级 / 区域让渡](./examples/drag.vue)、[节点事件的参数](./examples/events.vue)。

:::RUNTIME
```vue
<template>
	<div>
		<Tree
			:data="data"
			default-expand-all
			draggable
			@node-dragstart="handleDragStart"
			@node-dragenter="handleDragEnter"
			@node-dragleave="handleDragLeave"
			@node-dragover="handleDragOver"
			@node-dragend="handleDragEnd"
			@node-drop="handleDrop"
			:allow-drop="allowDrop"
			:allow-drag="allowDrag" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Tree } from '@deot/vc';

const data = ref([{
	label: '一级 1',
	children: [{
		label: '二级 1-1',
		children: [{
			label: '三级 1-1-1'
		}]
	}]
}, {
	label: '一级 2',
	children: [{
		label: '二级 2-1',
		children: [{
			label: '三级 2-1-1'
		}]
	}, {
		label: '二级 2-2',
		children: [{
			label: '三级 2-2-1'
		}]
	}]
}, {
	label: '一级 3',
	children: [{
		label: '二级 3-1',
		children: [{
			label: '三级 3-1-1'
		}]
	}, {
		label: '二级 3-2',
		children: [{
			label: '三级 3-2-1'
		}]
	}]
}]);
// 节点的标签：node / targetNode 为 TreeNode，数据在 states.data 上
const labelOf = node => (node ? node.states.data.label : '');
const handleDragStart = ({ data }) => {
	console.log('drag start: ', data.label);
};
const handleDragEnter = ({ targetNode }) => {
	console.log('tree drag enter: ', labelOf(targetNode));
};
const handleDragLeave = ({ targetNode }) => {
	console.log('tree drag leave: ', labelOf(targetNode));
};
const handleDragOver = ({ targetNode }) => {
	console.log('tree drag over: ', labelOf(targetNode));
};
const handleDragEnd = ({ targetNode, position, dropped }) => {
	console.log('tree drag end: ', labelOf(targetNode), position, dropped);
};
const handleDrop = ({ data, targetNode, position, from, to }) => {
	console.log('tree drop: ', data.label, position, labelOf(targetNode), `${from.index} → ${to.index}`);
};
// 「二级 3-1」不能放入子节点，只能放在它前后
const allowDrop = ({ targetNode, position }) => {
	return labelOf(targetNode) !== '二级 3-1' || position !== 'inner';
};
// 「三级 3-2-1」不能拖动
const allowDrag = ({ data }) => {
	return data.label !== '三级 3-2-1';
};
</script>
```
:::

## API

### 属性

| 属性                       | 说明                                                                                  | 类型                | 可选值 | 默认值     |
| ------------------------ | ----------------------------------------------------------------------------------- | ----------------- | --- | ------- |
| modelValue               | 选中的数据`checkedValues`                                                                | `array`           | —   | —       |
| expandedValues           | 展开的数据                                                                               | `array`           | —   | —       |
| data                     | 展示数据                                                                                | `array`           | —   | —       |
| empty-text               | 内容为空的时候展示的文本                                                                        | `string`          | —   | —       |
| tree-props               | 配置选项，具体看下表                                                                          | `object`          | —   | —       |
| render-node-after-expand | 是否在第一次展开某个树节点后才渲染其子节点                                                               | `boolean`         | —   | `true`  |
| render-node-label        | 树节点的内容区的渲染 Function                                                                 | `Function`        | —   | —       |
| load-data                | 加载子树数据的方法，仅当 lazy 属性为true 时生效                                                       | `Function`        | —   | —       |
| highlight-current        | 是否高亮当前选中节点，默认值是 `false`。                                                            | `boolean`         | —   | `false` |
| default-expand-all       | 是否默认展开所有节点                                                                          | `boolean`         | —   | `false` |
| expand-on-click-node     | 是否在点击节点的时候展开或者收缩节点， 默认值为 true，如果为 false，则只有点箭头图标的时候才会展开或者收缩节点。                      | `boolean`         | —   | `true`  |
| check-on-click-node      | 是否在点击节点的时候选中节点，默认值为 `false`，即只有在点击复选框时才会选中节点。                                       | `boolean`         | —   | `false` |
| auto-expand-parent       | 展开子节点的时候是否自动展开父节点                                                                   | `boolean`         | —   | `true`  |
| show-checkbox            | 节点是否可被选择                                                                            | `boolean`         | —   | `false` |
| check-strictly           | 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法，默认为 `false`                                            | `boolean`         | —   | `false` |
| current-node-value       | 当前选中的节点                                                                             | `string`、`number` | —   | —       |
| filter-node              | 对树节点进行筛选时执行的方法，返回 `true` 表示这个节点可以显示，返回 `false` 则表示这个节点会被隐藏                          | `Function`        | —   | —       |
| accordion                | 是否每次只打开一个同级树节点展开                                                                    | `boolean`         | —   | `false` |
| indent                   | 相邻级节点间的水平缩进，单位为像素                                                                   | `number`          | —   | 16      |
| icon-class               | 自定义树节点的图标                                                                           | `string`          | -   | -       |
| lazy                     | 是否懒加载子节点，需与 load 方法结合使用                                                             | `boolean`         | —   | `false` |
| draggable                | 是否开启拖拽节点功能                                                                          | `boolean`         | —   | `false` |
| allow-drag               | 判断节点能否被拖拽，参数为被拖节点 `{ node, data }`                                                      | `Function({ node, data })` | —   | —       |
| allow-drop               | 判断能否放到目标节点的某个区域，对 `before`（之前）、`inner`（放入）、`after`（之后）分别询问；`from` / `to` 为移动前后的位置 `{ parent, index }`，与 Table 相同，见[可拖拽节点](#可拖拽节点) | `Function({ node, data, targetNode, position, from, to })` | —   | —       |
| allow-dispatch           | 能否向form发送表单改变事件                                                                     | `boolean`         | —   | `true`  |

 ### tree-props

| 属性       | 说明                              | 类型                   | 返回值 |
| -------- | ------------------------------- | -------------------- | --- |
| label    | 指定节点标签为节点对象的某个属性值               | `string`、`Function`  | —   |
| value    | 指定节点标签为节点对象的某个属性值               | `string`             | —   |
| children | 指定子树为节点对象的某个属性值                 | `string`             | —   |
| disabled | 指定节点选择框是否禁用为节点对象的某个属性值          | `boolean`、`Function` | —   |
| isLeaf   | 指定节点是否为叶子节点，仅在指定了 lazy 属性的情况下生效 | `boolean`、`Function` | —   |
 

### 方法
| 方法名                 | 说明                                                                                                                                                               | 参数 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -- |
| filter              | 对树节点进行筛选操作、 接收一个任意类型的参数，该参数会在 `filter-node` 中作为第一个参数                                                                                                             | -  |
| updateKeyChildren   | 通过 keys 设置节点子元素，使用此方法必须设置 `node-key` 属性 、 (key, data) 接收两个参数，1. 节点 key 2. 节点数据的数组                                                                                | -  |
| getCheckedNodes     | 若节点可被选择（即 `show-checkbox` 为 `true`），则返回目前被选中的节点所组成的数组 、 (leafOnly, includeHalfChecked) 接收两个 boolean 类型的参数，1. 是否只是叶子节点，默认值为 `false` 2. 是否包含半选节点，默认值为 `false`      | -  |
| setCheckedNodes     | 设置目前勾选的节点，使用此方法必须设置 `node-key` 属性 、(nodes) 接收勾选节点数据的数组                                                                                                           | -  |
| getCheckedValues      | 若节点可被选择（即 `show-checkbox` 为 `true`），则返回目前被选中的节点的 key 所组成的数组 、 (leafOnly) 接收一个 boolean 类型的参数，若为 `true` 则仅返回被选中的叶子节点的 keys，默认值为 `false`                            | -  |
| setCheckedValues      | 通过 keys 设置目前勾选的节点，使用此方法必须设置 `node-key` 属性 、 (keys, leafOnly) 接收两个参数，1. 勾选节点的 key 的数组 2. boolean 类型的参数，若为 `true` 则仅设置叶子节点的选中状态，默认值为 `false`                       | -  |
| setChecked          | 通过 key / data 设置某个节点的勾选状态，使用此方法必须设置 `node-key` 属性 、 (key/data, checked, deep) 接收三个参数，1. 勾选节点的 key 或者 data 2. boolean 类型，节点是否选中  3. boolean 类型，是否设置子节点 ，默认为 false | -  |
| getHalfCheckedNodes | 若节点可被选择（即 `show-checkbox` 为 `true`），则返回目前半选中的节点所组成的数组                                                                                                            | -  |
| getHalfCheckedValues  | 若节点可被选择（即 `show-checkbox` 为 `true`），则返回目前半选中的节点的 key 所组成的数组                                                                                                      | -  |
| getCurrentKey       | 获取当前被选中节点的 key，使用此方法必须设置 `node-key` 属性，若没有节点被选中则返回 null                                                                                                          | —  |
| getCurrentNode      | 获取当前被选中节点的 data，若没有节点被选中则返回 null                                                                                                                                 | —  |
| setCurrentKey       | 通过 key 设置某个节点的当前选中状态，使用此方法必须设置 `node-key` 属性 、 (key) 待被选节点的 key，若为 null 则取消当前高亮的节点                                                                               | -  |
| setCurrentNode      | 通过 node 设置某个节点的当前选中状态，使用此方法必须设置 `node-key` 属性 、 (node) 待被选节点的 node                                                                                               | -  |
| getNode             | 根据 data 或者 key 拿到 Tree 组件中的 node 、 (data) 要获得 node 的 key 或者 data                                                                                                 | -  |
| remove              | 删除 Tree 中的一个节点，使用此方法必须设置 `node-key` 属性 、 (data) 要删除的节点的 data 或者 node                                                                                             | -  |
| append              | 为 Tree 中的一个节点追加一个子节点 、 (data, parentNode) 接收两个参数，1. 要追加的子节点的 data 2. 子节点的 parent 的 data、key 或者 node                                                              | -  |
| insertBefore        | 为 Tree 的一个节点的前面增加一个节点 、 (data, refNode) 接收两个参数，1. 要增加的节点的 data 2. 要增加的节点的后一个节点的 data、key 或者 node                                                                 | -  |
| insertAfter         | 为 Tree 的一个节点的后面增加一个节点 、 (data, refNode) 接收两个参数，1. 要增加的节点的 data 2. 要增加的节点的前一个节点的 data、key 或者 node                                                                 | -  |


### 事件

事件的参数均为一个对象（`update:modelValue`、`change` 除外，为选中的值）。其中 `node` 为节点对应的 TreeNode，`data` 为节点数据（传给 `data` 属性的数组中该节点所对应的对象）；其余节点（`targetNode`、`oldNode`、`from.parent` / `to.parent`）均为 TreeNode，数据在 `states.data` 上。

| 事件名                | 说明                                  | 回调参数                                                                                       | 参数说明                                                                                                                             |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| node-click         | 节点被点击时触发                            | `({ node, data, instance, event }) => void 0`                                              | `instance`：节点组件实例；`event`：事件对象                                                                                                  |
| node-contextmenu   | 节点被鼠标右键点击时触发                        | `({ node, data, instance, event }) => void 0`                                              | 同 `node-click`                                                                                                                  |
| check-change       | 节点的选中或半选状态变化时触发                     | `({ node, data, checked, indeterminate }) => void 0`                                       | `checked`：节点是否选中；`indeterminate`：节点是否半选（子孙中有部分被选中）                                                                             |
| check              | 点击复选框时触发                            | `({ node, data, checked, checkedNodes, checkedValues, halfCheckedNodes, halfCheckedValues }) => void 0` | `checked`：点击后该节点是否选中；其余为点击后树的选中状态，`checkedNodes` / `halfCheckedNodes` 为 TreeNode                                                     |
| current-change     | 当前节点变化时触发；点击当前节点本身不触发               | `({ node, data, oldNode }) => void 0`                                                      | `oldNode`：之前的当前节点，没有时为 `null`                                                                                                  |
| node-expand-change | 点击展开图标或节点，展开或收起节点时触发                | `({ node, data, expanded, instance }) => void 0`                                           | `expanded`：展开（`true`）或收起（`false`）；`instance`：节点组件实例                                                                           |
| node-dragstart     | 开始拖拽节点时触发                           | `({ node, data, event }) => void 0`                                                        | `node` / `data`：被拖节点；`event`：事件对象                                                                                                |
| node-dragenter     | 拖拽进入其他节点时触发                         | `({ node, data, targetNode, event }) => void 0`                                            | `targetNode`：进入的节点                                                                                                             |
| node-dragleave     | 拖拽离开某个节点时触发                         | `({ node, data, targetNode, event }) => void 0`                                            | `targetNode`：离开的节点                                                                                                             |
| node-dragover      | 拖拽经过节点时触发（类似浏览器的 `dragover`）          | `({ node, data, targetNode, event }) => void 0`                                            | `targetNode`：经过的节点                                                                                                             |
| node-drop          | 放下节点时触发，在 `node-dragend` 之前            | `({ node, data, targetNode, position, from, to, event }) => void 0`                        | `targetNode`：放置的目标节点；`position`：`before`、`after` 或 `inner`；`from` / `to`：移动前后的位置 `{ parent, index }`，`parent` 为 TreeNode，根级为 `null`，`to.index` 为移除被拖节点之后的下标 |
| node-dragend       | 拖拽结束时触发（取消、不可放置时也会触发）              | `({ node, data, targetNode, position, dropped, event }) => void 0`                         | `targetNode`：最后经过的可放置节点，没有时为 `null`；`position`：放置位置，没有放下时为 `null`；`dropped`：是否放下                                                        |

## 树选择（TreeSelect）

### 多选标签

`max > 1` 启用多选，标签行为与 Select 一致：默认只占一行，按输入框的可用宽度决定实际显示几个，放不下的折叠为 `+N...`；连 1 个都放不下时，第 1 个标签以省略号截断。非 `check-strictly` 时标签显示完整路径（`一级 / 二级 / 三级`）。

悬停 `+N...` 时弹出被折叠的标签列表，可在列表中移除（禁用时只读）；悬停被截断的标签时显示完整内容。

| 属性            | 说明                             | 类型       | 可选值    | 默认值          |
| ------------- | ------------------------------ | -------- | ------ | ------------ |
| max-tags      | 最多显示的标签数（上限），其余折叠；`0` 或不传表示不限    | `number` | `>= 0` | —（不限）        |
| max-tag-lines | 标签最多占用的行数，按可用宽度自适应折叠；`0` 表示不限行 | `number` | `>= 0` | `1`          |

### 可搜索

设置 `searchable` 开启搜索（默认 `false`），关键词以空格或逗号分隔，任一命中即可；弹层关闭时自动清空关键词。

- 树形模式：保留层级过滤，命中节点及其祖先可见并自动展开，命中文字高亮（自定义 `render-node-label` 时不做高亮）
- 级联模式（`cascader`）：搜索时切换为扁平路径列表（`一级 / 二级 / 三级`），宽度沿用列视图并限制在 240px ~ 360px，过长路径省略显示
- 非 `check-strictly` 时，勾选父节点会同时勾选**全部**子孙节点（包括被搜索过滤隐藏的节点）
- 设置 `load-data` 时视为远程搜索：数据由 `load-data` 返回，本地不再过滤，仅高亮

| 属性                 | 说明                    | 类型         | 可选值 | 默认值     |
| ------------------ | --------------------- | ---------- | --- | ------- |
| searchable         | 是否可搜索                 | `boolean`  | —   | `false` |
| search-placeholder | 搜索框占位文本               | `string`   | —   | —       |
| cascader           | 级联列模式                 | `boolean`  | —   | `false` |
| load-data          | 远程搜索，参数为关键词，需返回 Promise | `Function` | —   | —       |

### 挂载位置

| 属性     | 说明 | 类型        | 可选值 | 默认值    |
| ------ | --- | --------- | --- | ------ |
| portal | 下拉是否挂载到 body；`false` 时挂到组件根节点内，随所在容器滚动，超出容器的部分会被其 `overflow` 裁剪 | `boolean` | —   | `true` |

<!--
## 变更说明

### 事件与拖拽回调的参数统一为对象
- 所有事件的参数改为一个对象（`update:modelValue`、`change` 不变）；`node` 为 TreeNode，`data` 为节点数据，与 Table 的对象参数约定一致：
	- `node-click`：`(data, node, nodeRef)` → `{ node, data, instance, event }`，新增 `event`。
	- `node-contextmenu`：`(e, data, node, nodeRef)` → `{ node, data, instance, event }`。
	- `check-change`：`(data, checked, indeterminate)` → `{ node, data, checked, indeterminate }`。
	- `check`：`(data, { checkedNodes, checkedValues, halfCheckedNodes, halfCheckedValues })` → `{ node, data, checked, checkedNodes, checkedValues, halfCheckedNodes, halfCheckedValues }`，新增 `checked`。
	- `current-change`：`(data, node)` → `{ node, data, oldNode }`，新增 `oldNode`。
	- `node-drag-*` / `node-drop`：`(draggingNode, dropNode, dropType, e)` 等 → `{ node, data, targetNode, event }`，`node-drop` 另有 `position`、`from`、`to`，`node-dragend` 另有 `position`、`dropped`。
- `allow-drag`：`(node)` → `({ node, data })`。
- `allow-drop`：`(draggingNode, dropNode, 'prev' | 'inner' | 'next')` → `({ node, data, targetNode, position, from, to })`，`position` 为 `before` / `inner` / `after`（原 `prev` / `next` 改为与事件相同的 `before` / `after`）。

### 事件名
- 与浏览器原生事件对应的事件改用原生事件名：`node-drag-start` / `node-drag-enter` / `node-drag-leave` / `node-drag-over` / `node-drag-end` → `node-dragstart` / `node-dragenter` / `node-dragleave` / `node-dragover` / `node-dragend`（`node-drop` 不变）。
- `node-expand` / `node-collapse` 合并为 `node-expand-change`，以 `expanded` 区分。

### 行为
- `current-change` 只在当前节点变化时触发，点击当前节点本身不再触发。
- `check-change` 在选中或半选任一状态变化时触发（原先需两者同时变化，勾选叶子节点时不会触发）。
- 放下节点时先发出 `node-drop`，再发出 `node-dragend`（原先相反），与浏览器一致。
- 拖拽中所有节点都不可放置时松手，不再抛错，`node-dragend` 的 `targetNode` 为 `null`。
- 落点区域按节点所在行计算（原先按包含展开子节点的整个节点计算，展开的父节点上几乎只能放在它之前）；已展开且有子节点的节点没有 `after` 区域。
- `inner` 时目标节点的标签高亮（原样式未生效）。
-->
