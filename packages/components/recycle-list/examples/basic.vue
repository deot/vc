<!-- 最基本的用法：远程分页 + 下拉刷新；可切换方向、列数（瀑布流）、倒序、每页条数（不足一屏时自动续载） -->
<template>
	<div class="recycle-basic">
		<div class="recycle-basic__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
			<Button @click="isActive = !isActive">{{ isActive ? '卸载' : '挂载' }}</Button>
		</div>
		<div v-if="isActive" class="recycle-basic__body">
			<!-- 任一对照项变化都重新挂载，分页状态随之重置 -->
			<RecycleList
				:key="listKey"
				class="recycle-basic__list"
				:pullable="!isInverted"
				:inverted="isInverted"
				:vertical="isVertical"
				:cols="isVertical ? controls.cols : 1"
				:gap="10"
				:load-data="loadData"
			>
				<template #default="{ row }">
					<div
						:key="row.id"
						class="recycle-basic__item"
						:style="{
							background: row.background,
							// 横向滚动时宽度是必须的
							width: isVertical ? void 0 : `${Math.max(130, row.text.length)}px`
						}"
						@click="handleClick(row)"
					>
						<div>id: {{ row.id }}</div>
						<div>page: {{ row.page }}</div>
						<div v-if="isVertical" :style="`height: ${dynamicSize}px`">dynamicSize: {{ dynamicSize }}</div>
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
import { Button } from '../../button';
import { Select } from '../../select';

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'direction', label: '方向', data: [{ value: 'vertical', label: '纵向' }, { value: 'horizontal', label: '横向' }] },
	{ key: 'cols', label: '列数（纵向）', data: [{ value: 1, label: '1 列' }, { value: 3, label: '3 列（瀑布流）' }, { value: 5, label: '5 列（瀑布流）' }] },
	{ key: 'order', label: '顺序', data: [{ value: 'normal', label: '正序（可下拉刷新）' }, { value: 'inverted', label: '倒序（inverted）' }] },
	{ key: 'pageSize', label: '每页条数', data: [{ value: 30, label: '30 条 × 5 页' }, { value: 3, label: '3 条 × 20 页（不足一屏）' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const isVertical = computed(() => controls.direction === 'vertical');
const isInverted = computed(() => controls.order === 'inverted');
const listKey = computed(() => Object.values(controls).join('-'));

const isActive = ref(true);
const dynamicSize = ref(20);

let count = 0;
// 重新挂载时分页从头开始
watch(listKey, () => (count = 0), { flush: 'sync' });

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
	// 示例内每页条数（组件不感知分页大小）
	const pageSize = controls.pageSize;
	const total = pageSize === 3 ? 20 : 5;
	const list = [];
	return new Promise((resolve) => {
		if (page == total + 1) {
			resolve(false);
			return;
		}

		const size = page == total ? Math.min(4, pageSize) : pageSize;
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
.recycle-basic {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;

		// 右上角留给主题与性能读数的按钮
		padding: 12px 220px 12px 12px;
		align-items: center;

		.vc-select {
			width: 240px;
		}
	}

	&__body {
		min-height: 0;
		padding: 0 10px;
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
