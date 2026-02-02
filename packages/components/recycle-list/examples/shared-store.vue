<!-- 仅展示最基本的用法 -->
<template>
	<div class="demo-status" @click="isActive = !isActive">isActive: {{ isActive }}</div>
	<div v-if="isActive" class="demo1">
		<RecycleList
			class="list"
			pullable
			:store="store"
		>
			<template #default="{ row }">
				<component :is="renderItem(row)" />
			</template>
		</RecycleList>
	</div>
	<div v-if="isActive" class="demo2">
		<RecycleList
			class="list"
			:pullable="false"
			:store="store"
		>
			<template #default="{ row }">
				<component :is="renderItem(row)" />
			</template>
		</RecycleList>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { RecycleList, RecycleListStore } from '..';

const isActive = ref(true);
const dynamicSize = ref(20);

let count = 0;
const total = 5;

const random255 = () => Math.floor(Math.random() * 255);
const randomColor = () => `rgba(${random255()}, ${random255()}, ${random255()}, ${Math.random()})`;
const randomLetter = () => {
	const lowerCase = Math.random() < 0.5; // 50% 的概率获取大写字母，50% 的概率获取小写字母
	const charCode = lowerCase ? 97 + Math.random() * (122 - 97) : 65 + Math.random() * (90 - 65);
	return String.fromCharCode(charCode);
};
const randomText = (size) => {
	let v = '';
	while (size--) {
		if (!(size % 7)) {
			v += ' ';
		}
		v += randomLetter();
	}
	return v;
};

const renderItem = (row) => {
	return (
		<div
			class="item"
			style={{
				background: row.background
			}}
			onClick={() => handleClick(row)}
		>
			<div>
				id:
				{row.id}
			</div>
			<div>
				page:
				{row.page}
			</div>
			<div style={`height: ${dynamicSize.value}px`}>
				dynamicSize:
				{dynamicSize.value}
			</div>
			<div>{row.text}</div>
		</div>
	);
};

const loadData = (page, pageSize$) => {
	console.log('page:', page);
	const list = [];
	return new Promise((resolve) => {
		if (page == total + 1) {
			resolve(false);
			return;
		}

		if (page == total) {
			pageSize$ = 4;
		}
		for (let i = 0; i < pageSize$; i++) {
			list.push({
				id: count++,
				page,
				background: randomColor(),
				text: randomText(((i % 10) + 1) * 20)
			});
		}
		setTimeout(() => resolve(list), 1000);
	});
};

const handleClick = (data) => {
	console.log(data);
	dynamicSize.value = Math.floor(Math.random() * 20) + 20;
};

const store = new RecycleListStore({
	pageSize: 30,
	loadData
});
</script>

<style>
.demo-status {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 10;
	width: 100%;
	color: white;
	background: black;
}

.demo1 {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	width: 50%;
}

.demo2 {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	width: 50%;
}

.list {
	height: 100%;
	padding: 0;
	margin: 0 auto;
	text-align: center;
	list-style-type: none;
	background: #eee;
	border: 1px solid #ddd;
	box-sizing: border-box;
}

.item {
	display: flex;
	width: 100%;
	line-height: 20px;
	text-align: left;
	word-break: break-all;
	flex-direction: column;
}
</style>
