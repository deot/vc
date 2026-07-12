<template>
	<div style="padding: 20px;">
		<MButton type="primary" @click="handleOpen">
			唤起 ActionSheet
		</MButton>
		<MButton style="margin-left: 8px;" @click="handlePrevent">
			阻止关闭
		</MButton>
	</div>
</template>
<script setup>
import { h } from 'vue';
import { MActionSheet } from '../index.m';
import { MButton } from '../../button/index.m';

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

const handleOpen = async () => {
	await MActionSheet.open({
		title: '请选择一个操作',
		cancelText: '取消',
		onClose: v => console.log('onClose', v),
		data: [
			{
				content: '选项一',
				subContent: '点击后异步关闭',
				onClick: () => sleep(3000)
			},
			{
				content: '<span style="color: #456CF6;">HTML 选项</span>',
				subContent: '字符串默认使用 v-html'
			},
			{
				content: () => h('span', { style: { color: '#f04134' } }, 'DELETE'),
				subContent: () => h('span', '使用 MCustomer 渲染'),
				class: 'test'
			},
			{
				content: '禁用选项',
				disabled: true
			}
		]
	});
};

const handlePrevent = () => {
	MActionSheet.open({
		title: () => h('span', '返回 false 或 Promise.reject 会阻止关闭'),
		cancelText: '取消',
		data: [
			{
				content: '返回 false',
				onClick: () => false
			},
			{
				content: 'Promise.reject',
				onClick: () => Promise.reject()
			}
		]
	});
};
</script>
