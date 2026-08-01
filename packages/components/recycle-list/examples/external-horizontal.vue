<template>
	<div class="external-horizontal-demo">
		<header>
			<h1>横向外部虚拟化</h1>
			<p>外层原生元素承载 X 轴，RecycleList 内部继续保留 Y 轴能力。</p>
			<div class="controls">
				<label v-for="option in modes" :key="option.value">
					<input v-model="mode" type="radio" :value="option.value">
					{{ option.label }}
				</label>
				<button type="button" @click="wide = !wide">动态宽度：{{ wide ? '宽' : '窄' }}</button>
				<button type="button" @click="listRef?.scrollTo(0)">scrollTo(0)</button>
				<button type="button" @click="listRef?.scrollToIndex(8, -40)">定位第 8 项</button>
			</div>
		</header>

		<div class="horizontal-viewport">
			<div class="horizontal-track">
				<section class="side-content before">
					<h2>横向前置内容</h2>
					<p>500px external head</p>
				</section>

				<RecycleList
					:key="mode"
					ref="listRef"
					class="horizontal-list"
					:fill="false"
					:vertical="false"
					:pullable="mode === 'pullable'"
					:inverted="mode === 'inverted'"
					:batch-count="16"
					:load-data="loadData"
				>
					<template #default="{ row }">
						<article
							:key="row.id"
							class="horizontal-item"
							:style="{ width: `${row.width + (wide ? 90 : 0)}px` }"
						>
							<strong>#{{ row.id }}</strong>
							<span>{{ row.width + (wide ? 90 : 0) }}px</span>
							<small>page {{ row.page }}</small>
						</article>
					</template>
					<template #loading>
						<div class="horizontal-state">Loading…</div>
					</template>
					<template #complete>
						<div class="horizontal-state">Complete</div>
					</template>
				</RecycleList>

				<section class="side-content after">
					<h2>横向后置内容</h2>
					<p>600px external footer</p>
				</section>
			</div>
		</div>

		<p class="tip">
			pullable 与 inverted 在示例中互斥；横向 pull 继续沿用 RIGHT 方向和“外部承载者位于绝对 0”的既有规则。
		</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { RecycleList } from '..';

const modes = [
	{ label: '普通', value: 'normal' },
	{ label: 'pullable', value: 'pullable' },
	{ label: 'inverted', value: 'inverted' }
];

const mode = ref('normal');
const wide = ref(false);
const listRef = ref();
const pageSize = 16;
const pageTotal = 5;

const loadData = ({ current }) => new Promise((resolve) => {
	setTimeout(() => {
		if (current > pageTotal) {
			resolve(false);
			return;
		}

		const data = Array.from({ length: pageSize }, (_, index) => {
			const id = (current - 1) * pageSize + index;
			return {
				id,
				page: current,
				width: 130 + (id % 5) * 32
			};
		});
		resolve({ data, finished: current === pageTotal });
	}, 200);
});
</script>

<style scoped>
.external-horizontal-demo {
	padding: 24px;
	color: #273444;
}

.external-horizontal-demo header,
.tip {
	max-width: 1080px;
	margin: 0 auto 18px;
}

.controls {
	display: flex;
	align-items: center;
	gap: 14px;
	flex-wrap: wrap;
}

.controls label {
	display: inline-flex;
	align-items: center;
	gap: 4px;
}

.controls button {
	padding: 6px 10px;
	cursor: pointer;
}

.horizontal-viewport {
	width: 100%;
	height: 320px;
	overflow: auto hidden;
	border: 2px solid #627d98;
	border-radius: 10px;
	box-sizing: border-box;
}

.horizontal-track {
	display: flex;
	width: max-content;
	height: 100%;
	min-width: 100%;
	align-items: stretch;
}

.side-content {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 32px;
	box-sizing: border-box;
	flex: none;
	flex-direction: column;
}

.before {
	width: 500px;
	background: #e8f4ff;
}

.after {
	width: 600px;
	background: #fff3d9;
}

.horizontal-list {
	height: 100%;
	background: #f7fafc;
	border-right: 2px solid #409eff;
	border-left: 2px solid #409eff;
	box-sizing: border-box;
	flex: none;
}

.horizontal-item {
	display: flex;
	height: 100%;
	padding: 22px;
	background: #fff;
	border-right: 1px solid #d8e2ec;
	box-sizing: border-box;
	flex-direction: column;
	flex-shrink: 0;
}

.horizontal-item span,
.horizontal-item small {
	margin-top: 8px;
}

.horizontal-state {
	display: flex;
	align-items: center;
	height: 100%;
	padding: 0 28px;
}

.tip {
	margin-top: 16px;
	color: #627d98;
}
</style>
