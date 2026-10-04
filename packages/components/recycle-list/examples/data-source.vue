<!-- 本地 data 作为初始数据，滚到已有数据末尾后继续 loadData；可增删、可禁用远程加载 -->
<template>
	<div class="recycle-data-source">
		<div class="recycle-data-source__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<div class="recycle-data-source__body">
			<RecycleList
				class="recycle-data-source__list"
				pullable
				:columns="5"
				:disabled="controls.disabled === 'on'"
				:data="dataSource"
				:load-data="loadData"
				:scroller-options="{
					native: false,
					always: true
				}"
			>
				<template #default="{ row }">
					<div
						:key="row.id"
						class="recycle-data-source__item"
						:style="{
							background: row.background
						}"
					>
						<div>id: {{ row.id }}</div>
						<div>page: {{ row.page }}</div>
						<div style="visibility: hidden;">row.text: {{ row.text }}</div>
						<div
							:style="`height: ${dynamicSize}px`"
							@click="handleClick(row)"
						>{{ dynamicSize }}</div>
						<div @click="handleDelete(row)">删除</div>
						<div @click="handleAdd(row)">增加</div>
					</div>
				</template>
			</RecycleList>
		</div>
	</div>
</template>
<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue';
import { RecycleList } from '..';
import { Select } from '../../select';

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'disabled', label: 'disabled', data: [{ value: 'off', label: 'false（滚到末尾继续 loadData）' }, { value: 'on', label: 'true（只展示本地 data）' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const dynamicSize = ref(20);
const pageSize = 50; // 示例内每页条数（组件不再感知分页大小）

let count = 0;
const total = 405;

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

const makeItems = (size, page, tag) => {
	const list = [];
	for (let i = 0; i < size; i++) {
		const item = {
			id: `${count++}${tag || ''}`,
			name: count,
			page,
			background: randomColor(),
			text: randomText(((i % 10) + 1) * 20)
		};
		list.push(item);
	}
	return list;
};

const loadData = ({ page, loaded }) => {
	console.log('page:', page, 'loaded:', loaded);
	return new Promise((resolve) => {
		if (page == total + 1) {
			resolve(false);
			return;
		}

		const size = page == total ? 4 : pageSize;
		setTimeout(() => resolve(makeItems(size, page)), 1000);
	});
};
const dataSource = ref(null);

const handleClick = (data) => {
	console.log(data);
	dynamicSize.value = Math.floor(Math.random() * 20) + 20;
};

const handleDelete = (row) => {
	dataSource.value = dataSource.value.filter(item => item.id !== row.id);
};

const handleAdd = (row) => {
	const index = dataSource.value.findIndex(item => item.id === row.id);
	const v = dataSource.value.slice();
	v.splice(index + 1, 0, {
		id: `${count++}`,
		name: `add - ${count}`,
		page: row.page,
		background: randomColor(),
		text: randomText(((count % 10) + 1) * 20)
	});

	dataSource.value = v;
};
dataSource.value = makeItems(Math.max(1, total - 5) * pageSize, 1, 'From dataSource');

// 右上角的性能读数：切换对照项或增删数据后清零
window.$perf?.observe();
watch([controls, dataSource], () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());

</script>

<style lang="scss">
.recycle-data-source {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;

	&__controls {
		display: flex;
		gap: 12px;
		padding: 12px;

		.vc-select {
			width: 320px;
		}
	}

	&__body {
		min-height: 0;
		flex: 1;
	}

	&__list {
		height: 100%;
		padding: 0;
		margin: 0 auto;
		text-align: center;
		list-style-type: none;
		background: #eee;
		border: 1px solid #ddd;
		box-sizing: border-box;
	}

	&__item {
		display: flex;
		width: 100%;
		line-height: 20px;
		text-align: left;
		word-break: break-all;
		flex-direction: column;
	}
}
</style>
