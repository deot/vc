<template>
	<div style="background: #f7f6f6">
		<Button @click="animated = !animated">
			animated: {{ animated }}
		</Button>
		<Button @click="type = type === 'line' ? 'card' : 'line'">
			type: {{ type }}
		</Button>
		<br>
		<br>
		<Tabs 
			v-model="value"
			:animated="animated" 
			:type="type" 
			@click="handleClick"
			@tab-remove="handleRemove"
		>
			<template #extra>
				<div>extra</div>
			</template>
			<TabsPane :label="renderLabel">
				<div v-for="item in list" :key="item">
					<div>标签一的内容</div>
					<div>标签一的内容</div>
				</div>
			</TabsPane>
			<TabsPane label="标签二">
				<div v-for="item in list" :key="item">
					<div>标签二的内容</div>
					<div>标签二的内容</div>
				</div>
			</TabsPane>
			<TabsPane label="标签三">
				<div v-for="item in list" :key="item">
					<div>标签三的内容</div>
					<div>标签三的内容</div>
					<div>标签三的内容</div>
				</div>
			</TabsPane>
			<TabsPane label="标签四">
				<div v-for="item in list" :key="item">
					<div>标签四的内容</div>
					<div>标签四的内容</div>
				</div>
			</TabsPane>
			<TabsPane label="标签五">
				<div v-for="item in list" :key="item">
					<div>标签五的内容</div>
					<div>标签五的内容</div>
				</div>
			</TabsPane>
			<TabsPane label="标签六">
				<div v-for="item in list" :key="item">
					<div>标签六的内容</div>
					<div>标签六的内容</div>
					<div>标签六的内容</div>
				</div>
			</TabsPane>
			<TabsPane label="标签七">
				<div v-for="item in list" :key="item">
					<div>标签七的内容</div>
				</div>
			</TabsPane>
			<TabsPane label="标签八">
				<div v-for="item in list" :key="item">
					<div>标签八的内容</div>
					<div>标签八的内容</div>
				</div>
			</TabsPane>
			<TabsPane label="标签九">
				<div v-for="item in list" :key="item">
					<div>标签九的内容</div>
					<div>标签九的内容</div>
					<div>标签九的内容</div>
				</div>
			</TabsPane>
		</Tabs>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { Tabs, TabsPane } from '..';
import { Button } from '../../button';

const value = ref(2);
const animated = ref(false);
const type = ref('line');
const list = ref(Array.from({ length: 200 }, (_, i) => i));

const handleClick = () => {
	console.log('click');
};
const handleRemove = () => {
	console.log('remove');
};

const renderLabel = ({ it, index }) => {
	return (
		<span>{ it.value } { index }</span>
	);
};

</script>
