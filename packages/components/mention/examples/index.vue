<!-- 提及：输入 @ 后按前缀之后的文字联想，弹层跟随光标；选中后插入 前缀 + value + 分隔符 -->
<template>
	<div class="mention-basic">
		<h4>基础：输入 @ 试试；邮箱 a@b 不触发</h4>
		<Mention v-model="text" :data="USERS" :rows="3" placeholder="输入 @ 提及" @select="handleSelect" />
		<div>value: {{ text }}；select: {{ selected }}</div>

		<h4>autosize：随内容增高，弹层跟随光标所在的行</h4>
		<Mention v-model="growing" :data="USERS" :autosize="{ minRows: 2, maxRows: 6 }" placeholder="多行输入，@ 提及" />

		<h4>固定高度、内容超出时在文本域内滚动：弹层随滚动重新定位</h4>
		<Mention v-model="scrolled" :data="USERS" :rows="3" />

		<h4>远程加载：loadData(keyword, instance, { prefix })</h4>
		<Mention v-model="remote" :load-data="loadData" :rows="2" placeholder="输入 @ 后输入任意文字" />

		<h4>自定义标签与分组</h4>
		<Mention v-model="custom" :data="GROUPS" :rows="2" placeholder="输入 @ 提及">
			<template #label="{ row }">
				<span class="mention-basic__label">
					<b>{{ row.label }}</b>
					<span>{{ row.description }}</span>
				</span>
			</template>
		</Mention>

		<h4>计数与禁用</h4>
		<Mention v-model="text" :data="USERS" :rows="2" :maxlength="100" indicator />
		<Mention v-model="text" :data="USERS" :rows="2" disabled />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Mention } from '..';

const USERS = ['成员甲', '成员乙', '成员丙', '成员丁', '成员戊', '成员己', '名称较长的一位成员', 'Alpha', 'Beta', 'Gamma'];
const GROUPS = [
	{ value: 'g1', label: '分组一', children: [
		{ value: '成员甲', label: '成员甲', description: '说明 1' },
		{ value: '成员乙', label: '成员乙', description: '说明 2' }
	] },
	{ value: 'g2', label: '分组二', children: [
		{ value: '成员丙', label: '成员丙', description: '说明 3' },
		{ value: '成员丁', label: '成员丁', description: '说明 4', disabled: true }
	] }
];

const text = ref('');
const selected = ref('');
const growing = ref('');
const scrolled = ref(Array.from({ length: 12 }, (_, index) => `第 ${index + 1} 行文字`).join('\n'));
const remote = ref('');
const custom = ref('');

const handleSelect = ({ value, prefix }) => {
	selected.value = `${prefix}${value}`;
};

const loadData = keyword => new Promise((resolve) => {
	setTimeout(() => {
		resolve(Array.from({ length: 5 }, (_, index) => `${keyword || '成员'}${index + 1}`));
	}, 400);
});
</script>
<style lang="scss">
.mention-basic {
	display: flex;
	max-width: 480px;
	padding: 20px;
	flex-direction: column;
	gap: 12px;

	h4 {
		margin: 12px 0 0;
		font-size: 14px;
		color: var(--vc-color-dark-lightest);
	}

	&__label {
		display: flex;
		justify-content: space-between;
		width: 100%;
		gap: 12px;

		span {
			color: var(--vc-color-dark-extralight);
		}
	}
}
</style>
