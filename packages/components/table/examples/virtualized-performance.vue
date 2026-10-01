<template>
	<div class="virtualized-performance">
		<h3>虚拟化 Table 性能：500 条/页 · 富单元格</h3>
		<ol class="virtualized-performance__steps">
			<li>快速滚动：新行晚于画面出现会露白。「bufferCount」让可见行前后多渲染几行，中速滚动不再露白；甩得极快时仍可能短暂露白，单元格越轻越好（「文字」切到 JS 测量对比每行的挂载成本）</li>
			<li>分批：「行高」固定时全部行一次构建，滚动不停顿；不固定时逐行测量、按批构建，每到第 100 / 200 / 300… 行会顶住停一下（看底部「已构建」）</li>
			<li>切页：滚到底后切页，看右上角 longtask（切页时自动清零）。固定行高时不再测量；不固定时只重测视口附近的行，滚动位置保留</li>
			<li>内存：DevTools 网络调成 Slow 4G，滚到底后连续点「下一页」，Memory 面板手动 GC 后看右上角 heap；「图片」切到不渲染作为对照</li>
			<li>「滚动容器」切换页面滚动与 VC Scroller 内滚动，以上各项在两种容器下表现一致</li>
		</ol>
		<div class="virtualized-performance__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<component
			:is="controls.container === 'scroller' ? Scroller : 'div'"
			ref="containerRef"
			:key="controls.container"
			v-bind="containerProps"
		>
			<Table
				ref="tableRef"
				primary-key="id"
				virtualized
				:row-height="controls.rowMode === 'fixed' ? 96 : undefined"
				:recycle-list-options="recycleListOptions"
				:data="rows"
				:affix="affix"
				@load-change="loaded = $event.loaded"
			>
				<TableColumn type="selection" fixed="left" />
				<TableColumn label="主体" fixed="left" :min-width="320">
					<template #default="{ row }">
						<div class="entry">
							<Image v-if="controls.imageMode === 'component'" :src="row.image" fit="cover" class="entry__img" />
							<img v-else-if="controls.imageMode === 'native'" :src="row.image" class="entry__img">
							<div v-else class="entry__img" />
							<div class="cell">
								<div class="line is-title">
									<Ellipsis :value="row.title" />
								</div>
								<div class="line">
									<span class="label">编号</span>
									<Ellipsis :value="row.code" />
								</div>
								<div class="line">
									<span class="tag">{{ row.tagA }}</span>
									<span class="tag">{{ row.tagB }}</span>
								</div>
							</div>
						</div>
					</template>
				</TableColumn>
				<TableColumn
					v-for="column in columns"
					:key="column.label"
					:label="column.label"
					:min-width="column.width"
				>
					<template #default="{ row }">
						<div class="cell">
							<div v-for="[label, key] in column.fields" :key="key" class="line">
								<span class="label">{{ label }}</span>
								<Ellipsis v-if="column.text" :value="row[key]" />
								<span v-else class="value">{{ row[key] }}</span>
							</div>
						</div>
					</template>
				</TableColumn>
				<TableColumn label="状态" :min-width="120">
					<template #default="{ row }">
						<span class="pill">{{ row.status }}</span>
					</template>
				</TableColumn>
				<TableColumn label="操作" fixed="right" :width="100">
					<template #default>
						<span class="link">详情</span>
					</template>
				</TableColumn>
			</Table>
		</component>
		<div class="virtualized-performance__footer">
			<span>已构建 {{ loaded }} / {{ rows.length }}</span>
			<Pagination
				v-model:current="current"
				:count="dataSource.length"
				:page-size="pageSize"
				:page-size-options="[100, 200, 500]"
				show-count
				show-sizer
				@page-size-change="handlePageSizeChange"
			/>
		</div>
	</div>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Table, TableColumn } from '..';
import { Pagination } from '../../pagination';
import { Image } from '../../image';
import { Text } from '../../text';
import { Select } from '../../select';
import { Scroller } from '../../scroller';
import { useScrollerAffix } from './use-scroller-affix';

const COLORS = ['456cf6', '54b675', 'f3833a', '8e51ff'];
const GROUPS = ['分组 A/类别 1/子项', '分组 A/类别 2/子项', '分组 B/类别 1/子项', '分组 B/类别 2/子项'];
const ORGS = ['示例机构甲长名称演示有限公司', '示例机构乙', '示例机构丙中等长度名称', '示例机构丁长名称分部'];
const PEOPLE = ['张三', '李四', '王五', '赵六'];

// 每行 8 段单行省略文本 + 1 张图；图片地址每行不同，首次渲染都会发请求
const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	image: `https://dummyimage.com/144x144/${COLORS[index % 4]}/fff.png?text=${index}`,
	title: `${GROUPS[index % 4]}/第 ${index} 项${'（加长标题）'.repeat(index % 3)}`,
	code: `NO${100000 + index}`,
	tagA: ['标签 A', '标签 B', '标签 C', '标签 D'][index % 4],
	tagB: ['类型 1', '类型 2', '类型 3', '类型 4'][index % 4],
	org: ORGS[index % 4],
	orgCode: `ID-${index}-${'A'.repeat(1 + (index % 5))}`,
	level: ['S', 'A', 'B', 'C'][index % 4],
	memberA: PEOPLE[index % 4],
	memberB: PEOPLE[(index + 1) % 4],
	serial: `SN2026${String(index).padStart(6, '0')}`,
	metricA: `${99 + (index % 50)}.00`,
	metricB: `${199 + (index % 80)}.00`,
	metricC: `${159 + (index % 60)}.00`,
	countA: (index * 37) % 5000,
	countB: (index * 53) % 3000,
	countC: (index * 90) % 8000,
	periodA: (index * 7) % 900,
	periodB: (index * 13) % 1800,
	periodC: (index * 131) % 20000,
	status: ['进行中', '待处理', '已完成'][index % 3]
}));

// 多行信息列：text 为 true 的字段走 Ellipsis，其余直接输出
const columns = [
	{ label: '来源', width: 220, text: true, fields: [['名称', 'org'], ['编号', 'orgCode'], ['等级', 'level']] },
	{ label: '成员', width: 200, text: true, fields: [['成员 A', 'memberA'], ['成员 B', 'memberB'], ['序列号', 'serial']] },
	{ label: '指标', width: 150, fields: [['指标 A', 'metricA'], ['指标 B', 'metricB'], ['指标 C', 'metricC']] },
	{ label: '计数', width: 140, fields: [['计数 A', 'countA'], ['计数 B', 'countB'], ['计数 C', 'countC']] },
	{ label: '周期', width: 140, fields: [['周期 A', 'periodA'], ['周期 B', 'periodB'], ['周期 C', 'periodC']] }
];

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'container', label: '滚动容器', data: [{ value: 'window', label: 'window（页面滚动）' }, { value: 'scroller', label: 'Scroller' }] },
	{ key: 'rowMode', label: '行高', data: [{ value: 'fixed', label: '固定 96' }, { value: 'auto', label: '不固定（逐行测量）' }] },
	{ key: 'bufferCount', label: 'bufferCount', data: [0, 5, 10].map(value => ({ value, label: String(value) })) },
	{
		key: 'textMode',
		label: '文字',
		data: [{ value: 'text', label: 'Text（默认，CSS 截断）' }, { value: 'js', label: 'Text（JS 测量）' }, { value: 'css', label: '纯 span' }]
	},
	{
		key: 'imageMode',
		label: '图片',
		data: [{ value: 'component', label: 'Image 组件' }, { value: 'native', label: '原生 img' }, { value: 'none', label: '不渲染' }]
	}
];
// 初值为各项的第一个选项，也可由 URL 参数给出（如 ?rowMode=auto&container=scroller）
const query = new URLSearchParams(location.search);
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => {
	return [key, (data.find(item => String(item.value) === query.get(key)) || data[0]).value];
})));
const recycleListOptions = computed(() => ({ bufferCount: controls.bufferCount }));

const tableRef = ref();
const containerRef = ref();
// Scroller 固定高度、自绘滚动条；页面滚动时只是一个普通容器
const containerProps = computed(() => (controls.container === 'scroller'
	? { class: 'virtualized-performance__scroller', height: '600px', native: false }
	: {}));

// Affix 按窗口定位：页面滚动时吸顶 0、吸底让出分页栏（52px）；Scroller 里取 Scroller 视口到窗口边缘的距离
const { offsets, update: updateOffsets } = useScrollerAffix(
	() => (controls.container === 'scroller' ? containerRef.value?.wrapper : void 0),
	() => tableRef.value
);
const affix = computed(() => (controls.container === 'scroller'
	? [{ offset: offsets.top }, { offset: offsets.bottom }]
	: [{ offset: 0 }, { offset: 52 }]));
watch(() => controls.container, () => nextTick(updateOffsets));

// 单行省略：Text 默认由 CSS 截断；自定义省略符时改为挂载时测量截断位置（JS 测量）
const Ellipsis = props => (controls.textMode === 'css'
	? h('span', { class: 'ellipsis' }, props.value)
	: h(Text, { value: props.value, line: 1, ellipsis: controls.textMode === 'js' ? '...' : void 0 }));
Ellipsis.props = ['value'];

const dataSource = genTableData(10000);
const current = ref(1);
const pageSize = ref(500);
const rows = computed(() => dataSource.slice((current.value - 1) * pageSize.value, current.value * pageSize.value));
const loaded = ref(0);

const handlePageSizeChange = (size) => {
	pageSize.value = size;
	current.value = 1;
};

// 最长任务与 JS 堆由 preload 显示在右上角：setup 时开启（能记到首次挂载），切页时清零，只看这次切页的耗时
window.$perf?.observe();
watch(rows, () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss">
.virtualized-performance {
	padding: 12px 24px 0;
	font-size: 13px;
	color: #080f20;
	background: #fff;

	&__steps {
		padding-left: 20px;
		margin: 8px 0;
		line-height: 22px;
		color: #4e5969;
	}

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 12px;

		.vc-select {
			width: 240px;
		}
	}

	&__scroller {
		border: 1px solid #e5e6eb;
	}

	&__footer {
		position: sticky;
		bottom: 0;
		z-index: 5;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 52px;
		background: #fff;
	}

	.entry {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.entry__img {
		flex-shrink: 0;
		width: 72px;
		height: 72px;
		background: #eceef1;
		border-radius: 8px;
	}

	.cell {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.line {
		display: flex;
		align-items: center;
		height: 20px;
		min-width: 0;

		&.is-title {
			font-weight: 600;
		}

		.vc-text {
			flex: 1;
			min-width: 0;
		}
	}

	.label {
		flex-shrink: 0;
		margin-right: 4px;
		color: #4e5969;
	}

	.value {
		font-weight: 700;
	}

	.ellipsis {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tag {
		padding: 0 5px;
		margin-right: 4px;
		line-height: 20px;
		background: #eceef1;
		border-radius: 3px;
	}

	.pill {
		padding: 2px 8px;
		color: #456cf6;
		background: #e9ecfe;
		border-radius: 6px;
	}

	.link {
		color: #456cf6;
		cursor: pointer;
	}
}
</style>
