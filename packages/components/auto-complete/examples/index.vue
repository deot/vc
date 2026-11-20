<!-- 输入联想：v-model 就是输入框的文字，选中联想项时整段替换；↑ ↓ 移动、Enter 选中、Esc 关闭 -->
<template>
	<div class="auto-complete-basic">
		<h4>本地过滤：输入时按文字过滤，命中的部分高亮</h4>
		<AutoComplete
			v-model="city"
			:data="CITIES"
			placeholder="输入名称"
			clearable
			@select="handleSelect"
		/>
		<div>value: {{ city }}；select: {{ selected }}</div>

		<h4>按输入生成：邮箱后缀补全（data 随输入变化）</h4>
		<AutoComplete v-model="email" :data="emails" placeholder="输入邮箱" />

		<h4>分组 + 禁用项</h4>
		<AutoComplete v-model="grouped" :data="GROUPS" placeholder="输入条目" />

		<h4>远程加载：loadData 返回 Promise，解析为数组时直接作为结果（不再在本地过滤）</h4>
		<AutoComplete v-model="remote" :load-data="loadData" placeholder="输入任意文字" />

		<h4>自定义标签：renderLabel 保留行的高亮与键盘</h4>
		<AutoComplete v-model="custom" :data="ITEMS" placeholder="输入条目">
			<template #label="{ row }">
				<span class="auto-complete-basic__label">
					<b>{{ row.label }}</b>
					<span>{{ row.description }}</span>
				</span>
			</template>
		</AutoComplete>

		<h4>输入框插槽与禁用</h4>
		<AutoComplete v-model="city" :data="CITIES" placeholder="prepend / append">
			<template #prepend>
				<span class="auto-complete-basic__addon">名称</span>
			</template>
		</AutoComplete>
		<AutoComplete v-model="city" :data="CITIES" disabled />
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { AutoComplete } from '..';

const CITIES = ['条目甲', '条目乙', '条目丙', '项目一', '项目二', '项目三', '名称较长的一项条目', 'Alpha', 'Beta', 'Gamma', 'Delta'];
const SUFFIXES = ['example.com', 'example.org', 'example.net', 'mail.test'];
const GROUPS = [
	{ value: 'g1', label: '分组一', children: [{ value: '条目 1-1' }, { value: '条目 1-2', disabled: true }, { value: '条目 1-3' }] },
	{ value: 'g2', label: '分组二', children: [{ value: '条目 2-1' }, { value: '条目 2-2' }] }
];
const ITEMS = Array.from({ length: 8 }, (_, index) => ({
	value: `条目 ${index + 1}`,
	label: `条目 ${index + 1}`,
	description: `说明文字 ${index + 1}`
}));

const city = ref('');
const selected = ref('');
const email = ref('');
const grouped = ref('');
const remote = ref('');
const custom = ref('');

const emails = computed(() => {
	const [name] = email.value.split('@');
	return name ? SUFFIXES.map(suffix => `${name}@${suffix}`) : [];
});

const handleSelect = ({ value }) => {
	selected.value = value;
};

const loadData = keyword => new Promise((resolve) => {
	setTimeout(() => {
		resolve(keyword ? Array.from({ length: 6 }, (_, index) => `${keyword} 的结果 ${index + 1}`) : []);
	}, 400);
});
</script>
<style lang="scss">
.auto-complete-basic {
	display: flex;
	max-width: 360px;
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

	&__addon {
		padding: 0 8px;
	}
}
</style>
