<!-- 仅展示最基本的用法 -->
<template>
	<div class="demo-status" @click="isActive = !isActive">isActive: {{ isActive }}</div>
	<div v-if="isActive" class="demo">
		<RecycleList
			class="list"
			pullable
			:load-data="loadData"
		>
			<template #default="{ row }">
				<Customer :render="renderItem" :row="row" />
			</template>
		</RecycleList>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { Customer } from '../../customer';
import { RecycleList } from '..';

const isActive = ref(true);
const dynamicSize = ref(20);
const pageSize = 30; // 示例内每页条数（组件不再感知分页大小）

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
const loadData = ({ current: page, count: loaded }) => {
	console.log('page:', page, 'loaded:', loaded);
	const list = [];
	return new Promise((resolve) => {
		if (page == total + 1) {
			resolve(false);
			return;
		}

		const size = page == total ? 4 : pageSize;
		for (let i = 0; i < size; i++) {
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

const renderItem = (props) => {
	const { row } = props;
	console.log('renderItem', row.id);
	return (
		<div
			class="item"
			style={{ background: row.background }}
			onClick={() => handleClick(row)}
		>
			<div>{`id: ${row.id}`}</div>
			<div>{`page: ${row.page}`}</div>
			<div style={{ height: `${dynamicSize.value}px` }}>{`dynamicSize: ${dynamicSize.value}`}</div>
			<div>{row.text}</div>
		</div>
	);
};
const handleClick = (data) => {
	console.log(data);
	dynamicSize.value = Math.floor(Math.random() * 20) + 20;
};
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

.demo {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	width: 100%;
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
