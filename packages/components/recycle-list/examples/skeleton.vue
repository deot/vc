<!-- 骨架屏：请求期间先渲染一批占位；可切换倒序 -->
<template>
	<div class="recycle-skeleton">
		<div class="recycle-skeleton__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<div class="recycle-skeleton__body">
			<!-- 顺序变化时重新挂载（分页状态随之重置） -->
			<RecycleList
				:key="controls.order"
				class="recycle-skeleton__list"
				:inverted="isInverted"
				:load-data="loadData"
			>
				<template #placeholder>
					<div class="recycle-skeleton__loading">
						<h4 />
					</div>
				</template>
				<template #default="{ row }">
					<div
						:key="row.id"
						class="recycle-skeleton__item"
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
	</div>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { RecycleList } from '..';
import { Select } from '../../select';

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'order', label: '顺序', data: [{ value: 'normal', label: '正序（响应时间随机，最长 10s）' }, { value: 'inverted', label: '倒序（inverted，响应 1s）' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const isInverted = computed(() => controls.order === 'inverted');

const dynamicSize = ref(20);

let count = 0;
// 重新挂载时分页从头开始
watch(() => controls.order, () => (count = 0), { flush: 'sync' });

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

const loadData = ({ page, loaded }) => {
	console.log('page:', page, 'loaded:', loaded);
	// 示例内每页条数与总页数（组件不感知分页大小）
	const pageSize = isInverted.value ? 30 : 20;
	const total = isInverted.value ? 5 : 10;
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
		setTimeout(() => resolve(list), isInverted.value ? 1000 : Math.floor(Math.random() * 10000));
	});
};

const handleClick = (data) => {
	console.log(data);
	dynamicSize.value = Math.floor(Math.random() * 20) + 20;
};

// 右上角的性能读数：切换对照项后清零
window.$perf?.observe();
watch(controls, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss">
.recycle-skeleton {
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
		border: 1px solid #ddd;
		box-sizing: border-box;
	}

	&__item {
		display: flex;
		width: 100%;
		padding: 0 20px;
		line-height: 20px;
		text-align: left;
		word-break: break-all;
		box-sizing: border-box;
		flex-direction: column;
	}

	&__loading {
		padding: 20px;

		h4 {
			min-height: 20px;
			background: linear-gradient(100deg, rgb(255 255 255 / 0%) 40%, rgb(255 255 255 / 50%) 50%, rgb(255 255 255 / 0%) 60%) #ededed;
			background-position-x: 180%;
			background-size: 200% 100%;
			border-radius: 4px;
			animation: 1s recycle-skeleton-loading ease-in-out infinite;
			animation-delay: 0.05s;
		}
	}
}

@keyframes recycle-skeleton-loading {
	to {
		background-position-x: -20%;
	}
}
</style>
