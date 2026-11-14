<!-- 移动端：750 稿列宽 / 高度、尺寸、固定列、多选、点表头排序、底部弹层筛选、点按提示、树形、虚拟滚动 -->
<template>
	<div class="table-mobile">
		<p class="table-mobile__tip">
			数字 width / minWidth / height / rowHeight / indent 为 750 稿长度，可用右上角的 rem 按钮切换 --vc-rem 观察缩放；字符串（如 '120px'）不换算
		</p>
		<div class="table-mobile__types">
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
		<div class="table-mobile__types">
			<MButton
				v-for="item in SIZES"
				:key="item"
				size="small"
				:type="size === item ? 'primary' : 'default'"
				@click="size = item"
			>
				{{ item }}
			</MButton>
		</div>

		<!--
			基础：多选 + 左右固定列，列宽之和超出屏幕时横向滚动
			点「数量」表头循环排序；点筛选图标从底部弹出（状态单选、类别多选）；点「?」与被截断的备注弹出提示
		-->
		<MTable
			v-if="type === 'basic'"
			key="basic"
			v-model:sort="sort"
			:data="visibleRows"
			:size="size"
			primary-key="id"
			divider
		>
			<MTableColumn type="selection" fixed="left" />
			<MTableColumn prop="name" label="名称" :width="160" fixed="left" />
			<MTableColumn
				prop="count"
				label="数量"
				:width="180"
				align="right"
				sortable
				tooltip="点表头按 升序 → 降序 → 取消 循环"
			/>
			<MTableColumn prop="status" label="状态" :width="160" :filter-options="statusFilter" />
			<MTableColumn prop="category" label="类别" :width="160" :filter-options="categoryFilter" />
			<MTableColumn prop="remark" label="备注（单行省略）" :width="320" :line="1" />
			<MTableColumn prop="date" label="日期" :min-width="240" />
			<MTableColumn label="操作" :width="120" fixed="right">
				<template #default>
					<span class="table-mobile__link">查看</span>
				</template>
			</MTableColumn>
		</MTable>

		<!-- 固定高度：表体为虚拟列表，rowHeight 同为 750 稿 -->
		<MTable
			v-else-if="type === 'virtual'"
			key="virtual"
			:data="manyRows"
			:size="size"
			:height="800"
			:row-height="88"
			primary-key="id"
			stripe
			show-summary
		>
			<MTableColumn type="index" fixed="left" />
			<MTableColumn prop="name" label="名称" :width="200" />
			<MTableColumn prop="count" label="数量" :width="160" align="right" />
			<MTableColumn prop="remark" label="备注" :width="320" :line="1" />
			<MTableColumn prop="date" label="日期" :min-width="240" />
		</MTable>

		<!-- 树形：indent 为 750 稿，默认 32；长按整行后拖动排序 -->
		<MTable
			v-else-if="type === 'tree'"
			key="tree"
			v-model:data="treeRows"
			draggable
			:size="size"
			primary-key="id"
			default-expand-all
			divider
		>
			<MTableColumn prop="name" label="名称" :min-width="320" />
			<MTableColumn prop="count" label="数量" :width="160" align="right" />
			<MTableColumn prop="date" label="日期" :width="240" />
		</MTable>

		<!-- 展开行 + 拖拽把手 -->
		<MTable
			v-else
			key="expand"
			v-model:data="dragRows"
			:size="size"
			primary-key="id"
			divider
		>
			<MTableColumn type="drag" />
			<MTableColumn type="expand">
				<template #default="{ row }">
					<div class="table-mobile__expand">
						{{ row.remark }}
					</div>
				</template>
			</MTableColumn>
			<MTableColumn prop="name" label="名称" :min-width="200" />
			<MTableColumn prop="count" label="数量" :width="160" align="right" />
		</MTable>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { MTable, MTableColumn } from '../index.m';
import { MButton } from '../../button/index.m';

const TYPES = [
	{ label: '基础', value: 'basic' },
	{ label: '虚拟滚动', value: 'virtual' },
	{ label: '树形', value: 'tree' },
	{ label: '展开 / 拖拽', value: 'expand' }
];
const SIZES = ['medium', 'large', 'small', 'mini'];
const STATUS = ['待处理', '进行中', '已完成'];
const CATEGORY = ['类别 A', '类别 B', '类别 C', '类别 D'];

const type = ref('basic');
const size = ref('medium');
const sort = ref({});

const buildRows = (length, prefix = '') => Array.from({ length }).map((_, index) => ({
	id: `${prefix}${index + 1}`,
	name: `条目 ${prefix}${index + 1}`,
	count: (index * 37) % 500,
	status: STATUS[index % STATUS.length],
	category: CATEGORY[index % CATEGORY.length],
	remark: `这是第 ${index + 1} 条的备注，内容较长时按行数截断并省略`,
	date: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`
}));

const rows = ref(buildRows(12));
const manyRows = ref(buildRows(2000));
const dragRows = ref(buildRows(6));
const treeRows = ref(buildRows(4).map(row => ({
	...row,
	children: buildRows(3, `${row.id}-`).map(child => ({
		...child,
		children: buildRows(2, `${child.id}-`)
	}))
})));

const createFilter = (values, max) => {
	const options = ref({
		data: values.map(value => ({ label: value, value })),
		max,
		modelValue: [],
		onChange: (value) => {
			options.value.modelValue = value;
		}
	});
	return options;
};
// 单选：弹层第一项为「全部」，点选即生效
const statusFilter = createFilter(STATUS, 1);
// 多选：最多 2 项，「清空」后「确定」即取消筛选
const categoryFilter = createFilter(CATEGORY, 2);

// 排序、筛选只给出状态，数据由外部处理
const visibleRows = computed(() => {
	const status = statusFilter.value.modelValue;
	const category = categoryFilter.value.modelValue;
	const result = rows.value.filter((row) => {
		return (!status.length || status.includes(row.status))
			&& (!category.length || category.includes(row.category));
	});
	const { prop, order } = sort.value;
	if (!prop || !order) return result;
	const direction = order === 'ascending' ? 1 : -1;
	return [...result].sort((a, b) => (a[prop] - b[prop]) * direction);
});
</script>

<style lang="scss">
.table-mobile {
	padding: calc(var(--vc-rem) * 24) 0;

	&__tip {
		padding: 0 calc(var(--vc-rem) * 32);
		margin: 0 0 calc(var(--vc-rem) * 24);
		font-size: calc(var(--vc-rem) * 24);
		line-height: 1.5;
		color: var(--vc-color-dark-light);
	}

	&__types {
		display: flex;
		padding: 0 calc(var(--vc-rem) * 32);
		margin-bottom: calc(var(--vc-rem) * 24);
		flex-wrap: wrap;
		gap: calc(var(--vc-rem) * 16);
	}

	&__link {
		color: var(--vc-color-primary);
	}

	&__expand {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		color: var(--vc-color-dark-light);
	}
}
</style>
