<template>
	<div style="background: var(--vc-background-color)">
		<div :style="{ height: `${height}px` }" />
		<MButton @click="animated = !animated">
			animated: {{ animated }}
		</MButton>
		<MButton @click="theme = theme === 'light' ? 'dark' : 'light'">
			theme: {{ theme }}
		</MButton>
		<MButton @click="showStep = !showStep">
			showStep: {{ showStep }}
		</MButton>
		<MButton @click="handleClear">
			清除定时器
		</MButton>
		<br>
		<MTabs
			v-model="value"
			:animated="animated"
			:theme="theme"
			:average="false"
			:sticky="true"
			:show-step="showStep"
			closable
			style="margin-top: 20px;"
			@click="handleClick"
			@tab-remove="handleRemove"
		>
			<template #extra>
				<div>extra</div>
			</template>
			<template #label="{ it, index }">
				<span>{{ it.label }} - {{ index }}</span>
			</template>
			<MTabsPane label="标签一">
				<div v-for="item in list" :key="item">
					<div>标签一的内容</div>
					<div>标签一的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签二">
				<div v-for="item in list" :key="item">
					<div>标签二的内容</div>
					<div>标签二的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签三">
				<div v-for="item in list" :key="item">
					<div>标签三的内容</div>
					<div>标签三的内容</div>
					<div>标签三的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签四">
				<div v-for="item in list" :key="item">
					<div>标签四的内容</div>
					<div>标签四的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签五">
				<div v-for="item in list" :key="item">
					<div>标签五的内容</div>
					<div>标签五的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签六">
				<div v-for="item in list" :key="item">
					<div>标签六的内容</div>
					<div>标签六的内容</div>
					<div>标签六的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签七">
				<div v-for="item in list" :key="item">
					<div>标签七的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签八">
				<div v-for="item in list" :key="item">
					<div>标签八的内容</div>
					<div>标签八的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签九">
				<div v-for="item in list" :key="item">
					<div>标签九的内容</div>
					<div>标签九的内容</div>
					<div>标签九的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签十">
				<div v-for="item in list" :key="item">
					<div>标签十的内容</div>
					<div>标签十的内容</div>
					<div>标签十的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签十一">
				<div v-for="item in list" :key="item">
					<div>标签十一的内容</div>
					<div>标签十一的内容</div>
					<div>标签十一的内容</div>
				</div>
			</MTabsPane>
			<MTabsPane label="标签十二">
				<div v-for="item in list" :key="item">
					<div>标签十二的内容</div>
					<div>标签十二的内容</div>
					<div>标签十二的内容</div>
				</div>
			</MTabsPane>
		</MTabs>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MTabs, MTabsPane } from '../index.m';
import { MButton } from '../../button/index.m';

const height = ref(0);
const value = ref(6);
const animated = ref(false);
const theme = ref('light');
const showStep = ref(true);
const list = ref(Array.from({ length: 200 }, (_, i) => i));

const handleClick = () => {
	console.log('click');
};
const handleRemove = () => {
	console.log('remove');
};

const handleClear = () => {
};

</script>
