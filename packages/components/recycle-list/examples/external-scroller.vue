<template>
	<div class="external-scroller-demo">
		<header class="demo-header">
			<h1>VC Scroller 作为外部纵向视口</h1>
			<div class="mode-switcher">
				<label v-for="option in modes" :key="option.value">
					<input v-model="mode" type="radio" :value="option.value">
					{{ option.label }}
				</label>
				<button type="button" @click="listRef?.scrollToIndex(10, -24)">定位第 10 行</button>
			</div>
			<p>
				当前请求批次：{{ loadedPage }}。Head 与 Footer 属于外层 Scroller，加载边界只取 RecycleList 自身。
			</p>
		</header>

		<Scroller
			class="viewport"
			height="520px"
			:native="false"
			:always="true"
		>
			<!-- 被不断增长的列表推走的一侧才延迟展示：inverted 数据在头部增长，推走的是 Head -->
			<Transition name="reveal">
				<section v-show="mode !== 'inverted' || loadState.isEnd" class="external-section head-section">
					<h2>Head</h2>
					<p>先滚过这段外部内容，再进入虚拟列表。</p>
					<p>pullable 模式继续遵循原语义：只有外部主轴承载者位于绝对起点 0 时才可触发。</p>
				</section>
			</Transition>

			<RecycleList
				ref="listRef"
				class="external-list"
				lazy-tail
				:fill="false"
				:pullable="mode === 'pullable'"
				:inverted="mode === 'inverted'"
				:batch-count="18"
				:load-data="loadData"
				@load-change="loadState = $event"
			>
				<template #default="{ row }">
					<div
						:key="row.id"
						class="list-row"
						:style="{ minHeight: `${row.height}px` }"
					>
						<strong>{{ row.id }}</strong>
						<span>page {{ row.page }} · {{ row.height }}px</span>
					</div>
				</template>
				<template #loading>
					<div class="state-row">Loading page {{ loadedPage }}…</div>
				</template>
				<template #complete>
					<div class="state-row">RecycleList complete</div>
				</template>
				<template #footer>
					<Transition name="reveal" appear>
						<div class="state-row">RecycleList footer</div>
					</Transition>
				</template>
			</RecycleList>

			<Transition name="reveal">
				<section v-show="mode === 'inverted' || loadState.isEnd" class="external-section footer-section">
					<h2>Footer</h2>
					<p v-for="item in 4" :key="item">外部尾部内容 {{ item }}</p>
					<p>即使 Footer 很长，列表也会在进入自身尾部时加载下一批。</p>
				</section>
			</Transition>
		</Scroller>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Scroller } from '../../scroller';
import { RecycleList } from '..';

const modes = [
	{ label: '普通', value: 'normal' },
	{ label: 'pullable', value: 'pullable' },
	{ label: 'inverted', value: 'inverted' }
];

const mode = ref('normal');
const listRef = ref();
// load-change 是单向的：列表把快照推过来，外层只读
const loadState = ref({ isEnd: false, isLoading: false, isSilentRefresh: false, isEmpty: false });
const loadedPage = ref(0);
const pageSize = 18;
const pageTotal = 5;

const loadData = ({ current }) => new Promise((resolve) => {
	loadedPage.value = current;
	setTimeout(() => {
		if (current > pageTotal) {
			resolve(false);
			return;
		}

		const data = Array.from({ length: pageSize }, (_, index) => {
			const offset = (current - 1) * pageSize + index;
			return {
				id: `${mode.value}-${offset}`,
				page: current,
				height: 52 + (offset % 3) * 18
			};
		});
		resolve({ data, finished: current === pageTotal });
	}, 220);
});
</script>

<style scoped>
.external-scroller-demo {
	padding: 24px;
	color: #1f2933;
	background: #f6f8fb;
}

.demo-header,
.viewport {
	max-width: 920px;
	margin: 0 auto;
}

.demo-header {
	margin-bottom: 16px;
}

.demo-header h1 {
	margin: 0 0 12px;
	font-size: 22px;
}

.demo-header p {
	margin: 12px 0 0;
	color: #64748b;
}

.mode-switcher {
	display: flex;
	align-items: center;
	gap: 14px;
	flex-wrap: wrap;
}

.mode-switcher label {
	display: inline-flex;
	color: #475569;
	align-items: center;
	gap: 4px;
}

.mode-switcher button {
	padding: 6px 12px;
	font-size: 13px;
	color: #334155;
	cursor: pointer;
	background: #fff;
	border: 1px solid #d7dfe8;
	border-radius: 6px;
	transition: color 0.15s ease, border-color 0.15s ease;
}

.mode-switcher button:hover {
	color: #2563eb;
	border-color: #9cbcf0;
}

.viewport {
	overflow: hidden;
	background: #fff;
	border: 1px solid #e3e9f0;
	border-radius: 12px;
	box-shadow: 0 1px 2px rgb(16 24 40 / 5%);
}

/* 属于外层 Scroller 的内容：统一的中性底，用虚线与列表卡片区分 */
.external-section {
	padding: 24px;
	background: #f8fafc;
	box-sizing: border-box;
}

.external-section h2 {
	margin: 0 0 12px;
	font-size: 12px;
	font-weight: 600;
	color: #94a3b8;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.external-section p {
	margin: 0 0 10px;
	color: #64748b;
}

.head-section {
	min-height: 300px;
	border-bottom: 1px dashed #dbe3ec;
}

.footer-section {
	min-height: 480px;
	border-top: 1px dashed #dbe3ec;
}

.footer-section p {
	min-height: 52px;
}

.external-list {
	margin: 18px;
	overflow: hidden;
	background: #fff;
	border: 1px solid #e3e9f0;
	border-radius: 10px;
}

.list-row {
	display: flex;
	padding: 12px 16px;
	border-bottom: 1px solid #eef2f7;
	box-sizing: border-box;
	align-items: center;
	justify-content: space-between;
}

.list-row span {
	color: #94a3b8;
}

.state-row {
	padding: 16px;
	font-size: 12px;
	color: #94a3b8;
	letter-spacing: 0.04em;
	text-align: center;
	background: #f8fafc;
}

/* 延迟展示的内容淡入，避免加载完成的一瞬间直接弹出 */
.reveal-enter-active,
.reveal-leave-active {
	transition: opacity 0.24s ease, transform 0.24s ease;
}

.reveal-enter-from,
.reveal-leave-to {
	opacity: 0;
	transform: translateY(8px);
}
</style>
