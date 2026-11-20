<!-- 多个前缀：@ 提及成员、# 插入话题；数据按前缀切换（search 事件或 loadData 的 prefix） -->
<template>
	<div class="mention-prefix">
		<h4>按 search 事件切换 data</h4>
		<Mention
			v-model="text"
			:data="data"
			:prefix="['@', '#']"
			:rows="3"
			placeholder="输入 @ 或 #"
			@search="handleSearch"
		/>
		<div>value: {{ text }}</div>

		<h4>loadData 按前缀返回不同结果</h4>
		<Mention
			v-model="remote"
			:load-data="loadData"
			:prefix="['@', '#']"
			:rows="3"
			placeholder="输入 @ 或 #"
		/>

		<h4>分隔符：split 为空时选中后不补空格</h4>
		<Mention v-model="joined" :data="USERS" split="" :rows="2" placeholder="输入 @" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Mention } from '..';

const USERS = ['成员甲', '成员乙', '成员丙', '成员丁'];
const TOPICS = ['话题一', '话题二', '话题三'];

const text = ref('');
const remote = ref('');
const joined = ref('');
const data = ref(USERS);

const handleSearch = ({ prefix }) => {
	data.value = prefix === '#' ? TOPICS : USERS;
};

const loadData = (keyword, instance, { prefix }) => new Promise((resolve) => {
	setTimeout(() => {
		const source = prefix === '#' ? TOPICS : USERS;
		resolve(source.filter(item => item.includes(keyword)));
	}, 300);
});
</script>
<style lang="scss">
.mention-prefix {
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
}
</style>
