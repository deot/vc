<!-- 移动端输入联想：弹层按可视区限高，软键盘弹出后下方放不下时翻到输入框上方；点按选中 -->
<template>
	<div class="vcm-auto-complete-basic">
		<MForm label-width="auto">
			<MFormItem label="本地过滤">
				<MAutoComplete v-model="model.local" :data="ITEMS" placeholder="输入名称" clearable />
			</MFormItem>
			<MFormItem label="邮箱补全">
				<MAutoComplete v-model="model.email" :data="emails" placeholder="输入邮箱" />
			</MFormItem>
			<MFormItem label="远程加载">
				<MAutoComplete v-model="model.remote" :load-data="loadData" placeholder="输入任意文字" />
			</MFormItem>
			<MFormItem label="1 万条">
				<MAutoComplete v-model="model.large" :data="LARGE" virtualized placeholder="聚焦即显示，输入数字过滤" />
			</MFormItem>
		</MForm>
		<div class="vcm-auto-complete-basic__spacer">页面底部留白：输入框靠近底部时弹层翻到上方</div>
		<MForm label-width="auto">
			<MFormItem label="靠近底部">
				<MAutoComplete v-model="model.bottom" :data="ITEMS" placeholder="输入名称" />
			</MFormItem>
		</MForm>
	</div>
</template>
<script setup>
import { computed, reactive } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MAutoComplete } from '../index.m';

const ITEMS = ['条目甲', '条目乙', '条目丙', '项目一', '项目二', '项目三', '名称较长的一项条目', 'Alpha', 'Beta', 'Gamma'];
const SUFFIXES = ['example.com', 'example.org', 'example.net', 'mail.test'];
const LARGE = Array.from({ length: 10000 }, (_, index) => `条目 ${index + 1}`);

const model = reactive({ local: '', email: '', remote: '', large: '', bottom: '' });

const emails = computed(() => {
	const [name] = model.email.split('@');
	return name ? SUFFIXES.map(suffix => `${name}@${suffix}`) : [];
});

const loadData = keyword => new Promise((resolve) => {
	setTimeout(() => {
		resolve(keyword ? Array.from({ length: 6 }, (_, index) => `${keyword} 的结果 ${index + 1}`) : []);
	}, 400);
});
</script>
<style lang="scss">
.vcm-auto-complete-basic {
	&__spacer {
		display: flex;
		height: 60vh;
		font-size: 13px;
		color: #999;
		align-items: center;
		justify-content: center;
	}
}
</style>
