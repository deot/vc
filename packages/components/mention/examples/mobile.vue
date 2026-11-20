<!-- 移动端提及：跟随光标的下拉，靠右时向左展开、放不下时翻到上方；点按选中 -->
<template>
	<div class="vcm-mention-basic">
		<MForm label-width="auto">
			<MFormItem label="提及成员">
				<MMention v-model="model.basic" :data="USERS" :rows="3" placeholder="输入 @ 提及" />
			</MFormItem>
			<MFormItem label="@ 与 #">
				<MMention
					v-model="model.multiple"
					:data="data"
					:prefix="['@', '#']"
					:autosize="{ minRows: 2, maxRows: 5 }"
					placeholder="输入 @ 或 #"
					@search="handleSearch"
				/>
			</MFormItem>
			<MFormItem label="1 万条">
				<MMention v-model="model.large" :data="LARGE" virtualized :rows="2" placeholder="输入 @ 后输入数字" />
			</MFormItem>
		</MForm>
		<div class="vcm-mention-basic__output">value: {{ model.basic }}</div>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MMention } from '../index.m';

const USERS = ['成员甲', '成员乙', '成员丙', '成员丁', '成员戊', '成员己', 'Alpha', 'Beta'];
const TOPICS = ['话题一', '话题二', '话题三'];
const LARGE = Array.from({ length: 10000 }, (_, index) => `成员${index + 1}`);

const model = reactive({ basic: '', multiple: '', large: '' });
const data = ref(USERS);

const handleSearch = ({ prefix }) => {
	data.value = prefix === '#' ? TOPICS : USERS;
};
</script>
<style lang="scss">
.vcm-mention-basic {
	&__output {
		padding: 12px 16px;
		font-size: 13px;
		color: #666;
		word-break: break-all;
	}
}
</style>
