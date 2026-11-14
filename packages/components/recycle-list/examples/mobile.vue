<!-- 移动端：下拉刷新、加载更多、双列 gap / estimateSize（750 稿） -->
<template>
	<div class="recycle-list-mobile">
		<p class="recycle-list-mobile__tip">
			数字 gap / estimateSize 为 750 稿长度，可用右上角的 rem 按钮切换 --vc-rem 观察缩放；overscan / threshold 仍为 px
		</p>
		<div class="recycle-list-mobile__types">
			<MButton
				v-for="item in TYPES"
				:key="item.value"
				size="small"
				:type="type === item.value ? 'primary' : 'default'"
				@click="type = item.value"
			>
				{{ item.label }}
			</MButton>
		</div>
		<p class="recycle-list-mobile__tip">
			刷新 {{ refreshCount }} 次，已请求到第 {{ loadedPage }} 页
		</p>

		<!-- 单列：下拉刷新 + 加载更多，行高由内容决定 -->
		<MRecycleList
			v-if="type === 'list'"
			key="list"
			class="recycle-list-mobile__list"
			pullable
			:load-data="loadData"
		>
			<template #default="{ row }">
				<div class="recycle-list-mobile__row">
					<strong>#{{ row.id }}</strong>
					<span>{{ row.text }}</span>
				</div>
			</template>
			<template #complete="{ mobile }">
				<div class="recycle-list-mobile__complete">
					没有更多了（插槽参数 mobile: {{ mobile }}）
				</div>
			</template>
		</MRecycleList>

		<!-- 双列：gap 与 estimateSize 都按 750 稿书写，卡片高度同样随 --vc-rem 缩放，预估与实际一致 -->
		<MRecycleList
			v-else-if="type === 'grid'"
			key="grid"
			class="recycle-list-mobile__list"
			pullable
			:columns="2"
			:gap="24"
			:estimate-size="estimateSize"
			:load-data="loadData"
		>
			<template #default="{ row }">
				<div class="recycle-list-mobile__cell">
					<div class="recycle-list-mobile__card" :style="{ height: `calc(var(--vc-rem) * ${row.size})` }">
						<strong>#{{ row.id }}</strong>
						<span>{{ row.size }}</span>
					</div>
				</div>
			</template>
		</MRecycleList>

		<!-- 空状态 -->
		<MRecycleList
			v-else
			key="empty"
			class="recycle-list-mobile__list"
			pullable
			:load-data="loadEmpty"
		/>
	</div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { MButton } from '../../button/index.m';
import { MRecycleList } from '../index.m';

const TYPES = [
	{ value: 'list', label: '单列' },
	{ value: 'grid', label: '双列' },
	{ value: 'empty', label: '空状态' }
];
const PAGE_SIZE = 20;
const PAGE_COUNT = 5;
const TEXTS = ['一行内容', '两行内容，第二行用来撑开行高，观察不同高度的行', '较长的三行内容，用来观察不同高度的行在虚拟列表里的排布，以及滚动时的回收与复用'];

const type = ref('list');
const refreshCount = ref(0);
const loadedPage = ref(0);

// 切换类型时列表重建，计数从头开始
watch(type, () => {
	refreshCount.value = 0;
	loadedPage.value = 0;
});

const wait = time => new Promise(resolve => setTimeout(resolve, time));

// 行的预估高度（750 稿）：卡片高度 + 行间距，与样式一致
const ROW_GAP = 24;
const estimateSize = ({ row }) => row.size + ROW_GAP;

const loadData = async ({ page, loaded }) => {
	await wait(600);
	page === 1 && loadedPage.value && refreshCount.value++;
	loadedPage.value = page;
	if (page > PAGE_COUNT) return [];
	return Array.from({ length: PAGE_SIZE }).map((_, index) => {
		const id = loaded + index;
		return {
			id,
			text: TEXTS[id % TEXTS.length],
			size: 200 + (id % 4) * 60
		};
	});
};

const loadEmpty = async () => {
	await wait(600);
	return [];
};
</script>
<style scoped>
.recycle-list-mobile {
	display: flex;
	height: 100vh;
	padding: 0 12px 12px;
	flex-direction: column;
	box-sizing: border-box;
}

.recycle-list-mobile__tip {
	margin: 8px 0;
	font-size: 12px;
	color: var(--vc-color-dark-light);
}

.recycle-list-mobile__types {
	display: flex;
	gap: 8px;
}

.recycle-list-mobile__list {
	flex: 1;
	min-height: 0;
	background: var(--vc-background-color-light);
	border-radius: 8px;
}

.recycle-list-mobile__row {
	display: flex;
	padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
	font-size: calc(var(--vc-rem) * 28);
	line-height: calc(var(--vc-rem) * 44);
	background: var(--vc-background-color-lightest);
	border-bottom: 1px solid var(--vc-border-color);
	gap: calc(var(--vc-rem) * 16);
}

.recycle-list-mobile__complete {
	text-align: center;
}

.recycle-list-mobile__cell {
	padding-bottom: calc(var(--vc-rem) * 24);
}

.recycle-list-mobile__card {
	display: flex;
	font-size: calc(var(--vc-rem) * 28);
	background: var(--vc-background-color-lightest);
	border-radius: calc(var(--vc-rem) * 16);
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}
</style>
