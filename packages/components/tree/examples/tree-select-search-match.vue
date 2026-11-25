<template>
	<div class="search-match-example">
		<div class="search-match-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			searchMatch 指定关键词的分隔符：and 分开的词都要命中，or 分开的组命中任一即可。
			取值顺序：组件上的 searchMatch → 全局 VcInstance.options.TreeSelect.searchMatch → 默认（空格 and，逗号 or）；整个对象替换，不按键合并。
			按整条路径（各级文字用 " / " 连接）匹配，关键词可以分别落在不同层级。试试输入：分组 B -3、A1-1 C2-2、A1-1,C2-2、分组 A#-3。
		</p>

		<div class="search-match-example__row">
			<div>
				<h4>组件属性（覆盖全局）</h4>
				<TreeSelect
					:key="controls.content"
					v-model="ownValue"
					:data="data"
					:max="0"
					:cascader="controls.content === 'cascader'"
					:search-match="own"
					searchable
					clearable
					:clear-search-on-select="false"
				/>
				<div>生效：{{ describe(own ?? global) }}</div>
			</div>
			<div>
				<h4>不传属性（跟随全局）</h4>
				<TreeSelect
					:key="controls.content"
					v-model="globalValue"
					:data="data"
					:max="0"
					:cascader="controls.content === 'cascader'"
					searchable
					clearable
					:clear-search-on-select="false"
				/>
				<div>生效：{{ describe(global) }}</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '../../select';
import { TreeSelect } from '..';
import { useSearchMatchControls, GROUP_DATA } from '../../select/examples/basic/search-match';

const CONTENT = { key: 'content', label: '内容', data: [{ value: 'tree', label: '树形' }, { value: 'cascader', label: '级联列' }] };
const { CONTROLS, controls, own, global, describe } = useSearchMatchControls('TreeSelect', [CONTENT]);

const data = GROUP_DATA;
const ownValue = ref([]);
const globalValue = ref([]);
</script>
<style lang="scss" src="../../select/examples/basic/search-match.scss"></style>
