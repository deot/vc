<template>
	<div>
		<Button :wait="0" @click="handleClick('success')">
			成功的提示
		</Button>
		<Button :wait="0" @click="handleClick('error')">
			错误的提示
		</Button>
		<Button :wait="0" @click="handleClick('warn')">
			警告的提示
		</Button>
		<Button :wait="0" @click="handleClick('loading')">
			加载中提示
		</Button>
		<Button :wait="0" @click="handleClickClose('info')">
			手动关闭的提示
		</Button>
		<Button :wait="0" @click="handleClickrender">
			根据render函数渲染
		</Button>
	</div>
</template>
<script setup>
import { h } from 'vue';
import { Message } from '..';
import { Button } from '../../button';

window.Message = Message;

const handleClick = (type) => {
	if (type === 'success') {
		Message.success('成功的提示', 1000, function () {
			console.log('回调');
		});
	} else if (type === 'error') {
		Message.error({
			content: '33333',
			mask: false,
			duration: 0
		});
	} else if (type === 'warn') {
		Message.warning('测试警告的提示');
	} else if (type === 'loading') {
		Message.loading('正在加载中', 1000);
	}
};
const handleClickClose = () => {
	Message.info('可关闭的提示', {
		closable: true,
		duration: 0,
		top: 200,
		onBeforeClose() {
			return new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});
		},
		onClose() {
			console.log('onBeforeClose: 1s后关闭回调');
		}
	});
};

const handleClickrender = () => {
	Message.info({
		content: () => {
			return h('span', [
				'This is created by ',
				h('a', 'render'),
				' function'
			]);
		}
	});
}
</script>
