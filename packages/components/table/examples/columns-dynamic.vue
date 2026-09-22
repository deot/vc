<template>
	<div class="columns-dynamic">
		<p class="columns-dynamic__tips">
			每个场景对比「期望顺序」（模板中的列顺序）与「实际顺序」（store.states.columns 的叶子列），不一致即存在时序/顺序问题。
		</p>

		<!-- 1. 单个 v-if -->
		<section class="columns-dynamic__case">
			<h3>1. 单个 v-if（中间列）</h3>
			<div class="columns-dynamic__actions">
				<Button @click="c1.b = !c1.b">切换 B</Button>
			</div>
			<CaseStatus :expected="expected1" :actual="labelsOf(t1)" />
			<Table ref="t1" primary-key="id" :data="dataSource" border>
				<TableColumn v-bind="col('A')" />
				<TableColumn v-if="c1.b" v-bind="col('B')" />
				<TableColumn v-bind="col('C')" />
				<TableColumn v-bind="col('D')" />
			</Table>
		</section>

		<!-- 2. 多个 v-if 同一 tick 切换 -->
		<section class="columns-dynamic__case">
			<h3>2. 多个非相邻 v-if 同一 tick 切换</h3>
			<div class="columns-dynamic__actions">
				<Button @click="c2.b = !c2.b">切换 B</Button>
				<Button @click="c2.d = !c2.d">切换 D</Button>
				<Button @click="c2.b = !c2.b; c2.d = !c2.d">同时切换 B、D</Button>
			</div>
			<CaseStatus :expected="expected2" :actual="labelsOf(t2)" />
			<Table ref="t2" primary-key="id" :data="dataSource" border>
				<TableColumn v-bind="col('A')" />
				<TableColumn v-if="c2.b" v-bind="col('B')" />
				<TableColumn v-bind="col('C')" />
				<TableColumn v-if="c2.d" v-bind="col('D')" />
				<TableColumn v-bind="col('E')" />
			</Table>
		</section>

		<!-- 3. v-if / v-else -->
		<section class="columns-dynamic__case">
			<h3>3. v-if / v-else 互换</h3>
			<div class="columns-dynamic__actions">
				<Button @click="c3.b1 = !c3.b1">切换 B1 / B2</Button>
			</div>
			<CaseStatus :expected="expected3" :actual="labelsOf(t3)" />
			<Table ref="t3" primary-key="id" :data="dataSource" border>
				<TableColumn v-bind="col('A')" />
				<TableColumn v-if="c3.b1" v-bind="col('B1')" />
				<TableColumn v-else v-bind="col('B2')" />
				<TableColumn v-bind="col('C')" />
			</Table>
		</section>

		<!-- 4. template v-if -->
		<section class="columns-dynamic__case">
			<h3>4. &lt;template v-if&gt; 包裹多列</h3>
			<div class="columns-dynamic__actions">
				<Button @click="c4.group = !c4.group">切换 B、C</Button>
			</div>
			<CaseStatus :expected="expected4" :actual="labelsOf(t4)" />
			<Table ref="t4" primary-key="id" :data="dataSource" border>
				<TableColumn v-bind="col('A')" />
				<template v-if="c4.group">
					<TableColumn v-bind="col('B')" />
					<TableColumn v-bind="col('C')" />
				</template>
				<TableColumn v-bind="col('D')" />
			</Table>
		</section>

		<!-- 5. v-for（带 key） -->
		<section class="columns-dynamic__case">
			<h3>5. v-for 动态列（带 key）</h3>
			<div class="columns-dynamic__actions">
				<Button @click="handleInsertMiddle">中间插入</Button>
				<Button @click="handleInsertBothEnds">首尾同时插入</Button>
				<Button @click="handleRemoveMiddle">删除中间</Button>
				<Button @click="handleReverse">反转</Button>
				<Button @click="handleShuffle">打乱</Button>
				<Button @click="handleReplace">整体替换</Button>
				<Button @click="handleResetList">重置</Button>
			</div>
			<CaseStatus :expected="expected5" :actual="labelsOf(t5)" />
			<Table ref="t5" primary-key="id" :data="dataSource" border>
				<TableColumn v-bind="col('首')" />
				<TableColumn
					v-for="item in c5.list"
					:key="item"
					v-bind="col(item)"
				/>
				<TableColumn v-bind="col('尾')" />
			</Table>
		</section>

		<!-- 6. 多级表头 -->
		<section class="columns-dynamic__case">
			<h3>6. 多级表头：子列 v-if / v-for</h3>
			<div class="columns-dynamic__actions">
				<Button @click="c6.g2 = !c6.g2">切换 G2</Button>
				<Button @click="handleInsertSub">子列 v-for 中间插入</Button>
			</div>
			<CaseStatus :expected="expected6" :actual="labelsOf(t6)" />
			<Table ref="t6" primary-key="id" :data="dataSource" border>
				<TableColumn v-bind="col('A')" />
				<TableColumn label="G">
					<TableColumn v-bind="col('G1')" />
					<TableColumn v-if="c6.g2" v-bind="col('G2')" />
					<TableColumn
						v-for="item in c6.list"
						:key="item"
						v-bind="col(item)"
					/>
					<TableColumn v-bind="col('G3')" />
				</TableColumn>
				<TableColumn v-bind="col('B')" />
			</Table>
		</section>

		<!-- 7. 分组列整体 v-if -->
		<section class="columns-dynamic__case">
			<h3>7. 分组列整体 v-if</h3>
			<div class="columns-dynamic__actions">
				<Button @click="c7.group = !c7.group">切换分组 G</Button>
			</div>
			<CaseStatus :expected="expected7" :actual="labelsOf(t7)" />
			<Table ref="t7" primary-key="id" :data="dataSource" border>
				<TableColumn v-bind="col('A')" />
				<TableColumn v-if="c7.group" label="G">
					<TableColumn v-bind="col('G1')" />
					<TableColumn v-bind="col('G2')" />
				</TableColumn>
				<TableColumn v-bind="col('B')" />
			</Table>
		</section>

		<!-- 8. v-model:columns 外部重排后再 v-if -->
		<section class="columns-dynamic__case">
			<h3>8. v-model:columns 外部重排后再 v-if 插入（外部顺序优先，新列跟在模板中的前一列之后；写回模板顺序即恢复跟随模板）</h3>
			<div class="columns-dynamic__actions">
				<Button @click="c8.columns = [...c8.columns].reverse()">外部反转</Button>
				<Button @click="c8.c = !c8.c">切换 C</Button>
				<Button @click="handleRestoreTemplateOrder">恢复模板顺序</Button>
			</div>
			<CaseStatus :actual="labelsOf(t8)" />
			<Table
				ref="t8"
				v-model:columns="c8.columns"
				primary-key="id"
				:data="dataSource"
				border
			>
				<TableColumn v-bind="col('A')" />
				<TableColumn v-bind="col('B')" />
				<TableColumn v-if="c8.c" v-bind="col('C')" />
				<TableColumn v-bind="col('D')" />
			</Table>
		</section>
	</div>
</template>
<script setup>
import { computed, defineComponent, h, reactive, ref } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

const CaseStatus = defineComponent({
	props: {
		expected: Array,
		actual: Array
	},
	setup(props) {
		return () => {
			const actual = props.actual.join(' ');
			if (!props.expected) {
				return h('div', { class: 'columns-dynamic__status' }, `实际：${actual}`);
			}
			const expected = props.expected.join(' ');
			const ok = expected === actual;
			return h('div', { class: ['columns-dynamic__status', ok ? 'is-ok' : 'is-error'] }, [
				h('div', `期望：${expected}`),
				h('div', `实际：${actual}`),
				h('b', ok ? '✓ 一致' : '✗ 不一致')
			]);
		};
	}
});

const dataSource = ref([{ id: 1 }, { id: 2 }]);

// 单元格输出「列名 + 行号」，便于同时核对表体与表头顺序
const renderCell = ({ column, rowIndex }) => `${column.label}${rowIndex + 1}`;
const col = label => ({ label, formatter: renderCell });

// 实际顺序：store 中已注册并参与渲染的叶子列
const labelsOf = table => (table?.store.states.columns || []).map(column => column.states.label);

const t1 = ref();
const t2 = ref();
const t3 = ref();
const t4 = ref();
const t5 = ref();
const t6 = ref();
const t7 = ref();
const t8 = ref();

let uid = 0;

const c1 = reactive({ b: false });
const expected1 = computed(() => ['A', c1.b && 'B', 'C', 'D'].filter(Boolean));

const c2 = reactive({ b: false, d: false });
const expected2 = computed(() => ['A', c2.b && 'B', 'C', c2.d && 'D', 'E'].filter(Boolean));

const c3 = reactive({ b1: true });
const expected3 = computed(() => ['A', c3.b1 ? 'B1' : 'B2', 'C']);

const c4 = reactive({ group: false });
const expected4 = computed(() => ['A', ...(c4.group ? ['B', 'C'] : []), 'D']);

const createList = () => ['X1', 'X2', 'X3'];
const c5 = reactive({ list: createList() });
const expected5 = computed(() => ['首', ...c5.list, '尾']);

const handleInsertMiddle = () => {
	c5.list.splice(Math.floor(c5.list.length / 2), 0, `N${++uid}`);
};
const handleInsertBothEnds = () => {
	c5.list = [`N${++uid}`, ...c5.list, `N${++uid}`];
};
const handleRemoveMiddle = () => {
	c5.list.length && c5.list.splice(Math.floor(c5.list.length / 2), 1);
};
const handleReverse = () => {
	c5.list = [...c5.list].reverse();
};
const handleShuffle = () => {
	const list = [...c5.list];
	for (let i = list.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[list[i], list[j]] = [list[j], list[i]];
	}
	c5.list = list;
};
const handleReplace = () => {
	c5.list = c5.list.map(() => `R${++uid}`);
};
const handleResetList = () => {
	c5.list = createList();
};

const c6 = reactive({ g2: false, list: ['S1', 'S2'] });
const expected6 = computed(() => ['A', 'G1', c6.g2 && 'G2', ...c6.list, 'G3', 'B'].filter(Boolean));
const handleInsertSub = () => {
	c6.list.splice(1, 0, `S${++uid}`);
};

const c7 = reactive({ group: false });
const expected7 = computed(() => ['A', ...(c7.group ? ['G1', 'G2'] : []), 'B']);

const c8 = reactive({ c: false, columns: [] });
// 按模板中的列顺序写回
const handleRestoreTemplateOrder = () => {
	c8.columns = [...c8.columns].sort((a, b) => 'ABCD'.indexOf(a.label) - 'ABCD'.indexOf(b.label));
};
</script>
<style>
.columns-dynamic {
	padding: 30px;
}

.columns-dynamic__tips {
	color: #666;
}

.columns-dynamic__case {
	margin-bottom: 32px;
}

.columns-dynamic__actions {
	margin-bottom: 8px;
}

.columns-dynamic__status {
	padding: 6px 10px;
	margin-bottom: 8px;
	font-family: monospace;
	line-height: 1.6;
	background: #f5f5f5;
	border-left: 3px solid #999;
}

.columns-dynamic__status.is-ok {
	border-left-color: #52c41a;
}

.columns-dynamic__status.is-error {
	color: #cf1322;
	background: #fff1f0;
	border-left-color: #cf1322;
}
</style>
