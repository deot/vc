<!-- inverted 上拉刷新 -->
<template>
	<div class="inverted-pullable-demo">
		<header class="demo-header">
			<h1>inverted 上拉刷新</h1>
			<div class="controls">
				<span class="group">
					<span class="group-label">方向</span>
					<label v-for="option in directions" :key="option.value">
						<input v-model="direction" type="radio" :value="option.value">
						{{ option.label }}
					</label>
				</span>
				<span class="group">
					<span class="group-label">滚动源</span>
					<label v-for="option in sources" :key="option.value">
						<input v-model="source" type="radio" :value="option.value">
						{{ option.label }}
					</label>
				</span>
				<label>
					<input v-model="skeleton" type="checkbox">
					骨架屏
				</label>
			</div>
			<p class="stats">
				<span>刷新次数：<strong class="refresh-count">{{ refreshCount }}</strong></span>
				<span>当前第 {{ round }} 轮数据，已请求到第 {{ loadedPage }} 页</span>
				<code>load-change: {{ loadState }}</code>
			</p>
			<ul class="notes">
				<li>滚到最新内容一侧（纵向为底部，横向为最右），再向上（横向向左）拖动超过 30px 后松手，触发刷新。桌面端可以直接用鼠标拖。</li>
				<li>刷新期间旧内容保留并贴在尾部。新数据到达后整体替换，轮次加 1，仍然贴在尾部。</li>
				<li>没到末端时拖动就是普通滚动，不会进入上拉。</li>
				<li>外部容器模式下，要把外部容器滚到绝对末端（包括后置内容）才能上拉，和正序"外部容器位于 0 才能下拉"对称。</li>
			</ul>
		</header>

		<div
			:class="[
				'carrier',
				vertical ? 'is-vertical' : 'is-horizontal',
				external ? 'is-external' : 'is-inner'
			]"
		>
			<section v-if="external" class="side-content">
				<h2>前置内容</h2>
				<p>属于外部容器，不属于列表。</p>
			</section>

			<RecycleList
				:key="`${direction}-${source}-${skeleton}`"
				class="list"
				inverted
				pullable
				:fill="!external"
				:vertical="vertical"
				:batch-count="pageSize"
				:load-data="loadData"
				@load-change="loadState = $event"
			>
				<template v-if="skeleton" #placeholder>
					<div class="skeleton" />
				</template>
				<template #default="{ row }">
					<div
						:key="row.id"
						class="item"
						:style="vertical ? { minHeight: `${row.size}px` } : { width: `${row.size * 2}px` }"
					>
						<strong>#{{ row.id }}</strong>
						<span>第 {{ row.round }} 轮 · page {{ row.page }}</span>
					</div>
				</template>
			</RecycleList>

			<section v-if="external" class="side-content">
				<h2>后置内容</h2>
				<p>滚完这一段、外部容器到达绝对末端后才可以上拉。</p>
			</section>
		</div>
	</div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { RecycleList } from '..';

const directions = [
	{ label: '纵向', value: 'vertical' },
	{ label: '横向', value: 'horizontal' }
];
const sources = [
	{ label: '内部 Scroller', value: 'inner' },
	{ label: '外部容器（fill=false）', value: 'external' }
];

const direction = ref('vertical');
const source = ref('inner');
const skeleton = ref(false);
const vertical = computed(() => direction.value === 'vertical');
const external = computed(() => source.value === 'external');

// load-change 是单向的：列表把快照推过来，外层只读
const loadState = ref({ isEnd: false, isLoading: false, isSilentRefresh: false, isEmpty: false });
const pageSize = 20;
const pageTotal = 4;

// 每请求一次第 1 页算一轮：挂载是第 1 轮，之后每次刷新加 1
const round = ref(0);
const loadedPage = ref(0);
const refreshCount = computed(() => Math.max(0, round.value - 1));

// 切换选项会重建列表，轮次从头计
watch([direction, source, skeleton], () => {
	round.value = 0;
	loadedPage.value = 0;
});

const loadData = ({ current }) => {
	if (current === 1) round.value++;
	loadedPage.value = current;
	const currentRound = round.value;
	return new Promise((resolve) => {
		setTimeout(() => {
			if (current > pageTotal) {
				resolve(false);
				return;
			}
			const data = Array.from({ length: pageSize }, (_, index) => {
				const offset = (current - 1) * pageSize + index;
				return {
					id: `${currentRound}-${offset}`,
					round: currentRound,
					page: current,
					size: 48 + (offset % 3) * 16
				};
			});
			resolve({ data, finished: current === pageTotal });
		}, 800);
	});
};
</script>

<style scoped>
.inverted-pullable-demo {
	padding: 24px;
	color: #1f2933;
	background: #f6f8fb;
}

.demo-header,
.carrier {
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

.controls {
	display: flex;
	align-items: center;
	gap: 20px;
	flex-wrap: wrap;
}

.controls label,
.group {
	display: inline-flex;
	color: #475569;
	align-items: center;
	gap: 6px;
}

.group-label {
	font-weight: 600;
	color: #1f2933;
}

.stats {
	display: flex;
	margin: 12px 0 0;
	color: #475569;
	gap: 16px;
	flex-wrap: wrap;
}

.stats code {
	font-size: 12px;
	color: #64748b;
}

.notes {
	padding-left: 20px;
	margin: 12px 0 0;
	color: #64748b;
}

.notes li {
	margin-bottom: 4px;
}

.carrier {
	background: #fff;
	border: 1px solid #e3e9f0;
	border-radius: 12px;
	box-sizing: border-box;
}

.carrier.is-vertical {
	height: 480px;
}

.carrier.is-horizontal {
	height: 240px;
}

/* 纵向上拉提示条居中；横向提示条自身已用 flex 居中，且横向列表不能继承 center（会影响内部 inline-flex） */
.is-vertical .list {
	text-align: center;
}

/* 内部 Scroller：列表填满容器，由它自己承载主轴 */
.carrier.is-inner {
	overflow: hidden;
}

.carrier.is-inner .list {
	width: 100%;
	height: 100%;
}

/* 外部容器：主轴由 .carrier 承载，列表只是其中一段 */
.carrier.is-external.is-vertical {
	overflow: hidden auto;
}

.carrier.is-external.is-horizontal {
	display: flex;
	overflow: auto hidden;
}

.carrier.is-external.is-horizontal > * {
	flex: none;
	height: 100%;
}

.side-content {
	padding: 24px;
	background: #f8fafc;
	box-sizing: border-box;
}

.side-content h2 {
	margin: 0 0 12px;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.08em;
	color: #94a3b8;
}

.side-content p {
	margin: 0;
	color: #64748b;
}

.is-vertical .side-content {
	min-height: 200px;
}

.is-horizontal .side-content {
	width: 280px;
}

.item {
	display: flex;
	padding: 12px 16px;
	border-bottom: 1px solid #eef2f7;
	box-sizing: border-box;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.item span {
	color: #94a3b8;
}

.is-horizontal .item {
	height: 100%;
	border-right: 1px solid #eef2f7;
	border-bottom: none;
	flex-direction: column;
	justify-content: center;
}

.skeleton {
	height: 48px;
	margin: 8px 16px;
	background: #edf1f5;
	border-radius: 6px;
}

.is-horizontal .skeleton {
	width: 120px;
	height: calc(100% - 16px);
	margin: 8px;
}
</style>
