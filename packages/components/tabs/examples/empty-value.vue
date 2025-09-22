<template>
	<div style="background: var(--vc-background-color)">
		<Tabs
			v-model="current"
			:animated="animated"
			:type="type"
			@click="handleClick"
			@tab-remove="handleRemove"
		>
			<template #extra>
				<div>extra</div>
			</template>
			<TabsPane
				v-for="item in list"
				:key="item.label"
				:value="item.value"
				:label="item.label"
			>
				{{ item.label }}
			</TabsPane>
		</Tabs>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { Tabs, TabsPane } from '..';

const current = ref('');
const animated = ref(false);
const type = ref('line');
const list = ref([
	{
		label: '其他',
		value: 'other'
	},
	{
		label: '空字符串',
		value: ''
	},
	{
		label: 'Null',
		value: null
	},
	{
		label: 'False',
		value: false
	},
	{
		label: '0',
		value: 0
	}

]);

const handleClick = () => {
	console.log('click', current.value);
};
const handleRemove = () => {
	console.log('remove');
};

</script>
