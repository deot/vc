<template>
	<div class="v-sort-list-example">
		<div class="v-sort-list-example__panel">
			<SortList v-model="dataSource">
				<template #default="{ row, index }">
					<div
						class="v-sort-list-example__item"
						:style="{ background: colors[index % colors.length] }"
					>
						{{ row.label }}
					</div>
				</template>
			</SortList>
		</div>
		<div class="v-sort-list-example__tools">
			<Button @click="handleAdd">
				添加
			</Button>
			<Button @click="handleDel">
				删除第一个
			</Button>
			<Button @click="handleShuffle">
				乱序
			</Button>
		</div>
		<div class="v-sort-list-example__panel">
			<SortList v-model="dataSource" :mask="false">
				<template #default="{ row, index }">
					<div
						class="v-sort-list-example__item"
						:style="{ background: colors[(index + 2) % colors.length] }"
					>
						{{ row.label }}
					</div>
				</template>
			</SortList>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { SortList } from '..';
import { Button } from '../../button';

let count = 0;
const colors = ['#2f75ef', '#27ae60', '#f59f00', '#7c3aed', '#d9480f'];
const dataSource = ref(Array.from({ length: 5 }, () => {
	const id = count++;

	return {
		id,
		label: `Item ${id}`
	};
}));

const handleAdd = () => {
	const id = count++;

	dataSource.value.push({
		id,
		label: `Item ${id}`
	});
};

const handleDel = () => {
	dataSource.value.shift();
};

const handleShuffle = () => {
	dataSource.value = [...dataSource.value].sort(() => Math.random() - 0.5);
};
</script>

<style lang="scss">
.v-sort-list-example {
	&__panel {
		margin-bottom: 16px;
	}

	&__tools {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
	}

	&__item {
		width: 160px;
		height: 80px;
		line-height: 80px;
		color: #fff;
		text-align: center;
	}
}
</style>
