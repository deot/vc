<!-- 倒序 -->
<template>
	<div class="demo">
		<RecycleList
			class="list"
			:cols="3"
			:gutter="10"
			inverted
			:page-size="pageSize"
			:load-data="loadData"
		>
			<template #default="{ row }">
				<div
					:key="row.id"
					class="item"
					:style="{
						background: row.background
					}"
					@click="handleClick(row)"
				>
					<div>id: {{ row.id }}</div>
					<div>page: {{ row.page }}</div>
					<div :style="`height: ${dynamicSize}px`">dynamicSize: {{ dynamicSize }}</div>
					<div>{{ row.text }}</div>
				</div>
			</template>
		</RecycleList>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { RecycleList } from '..';

const dynamicSize = ref(20);
const pageSize = ref(30);

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

const handleClick = () => {
	dynamicSize.value = Math.floor(Math.random() * 20) + 20;
};
</script>

<style>
.demo {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width: 100%;
}
.list {
	height: 100%;
	margin: 0 auto;
	padding: 0;
	border: 10px solid #ddd;
	list-style-type: none;
	text-align: center;
	background: #eee;
	padding: 10px 0;;
	box-sizing: border-box;
}
.item {
	display: flex;
	line-height: 20px;
	width: 100%;
	text-align: left;
	word-break: break-all;
	flex-direction: column;
}
</style>
