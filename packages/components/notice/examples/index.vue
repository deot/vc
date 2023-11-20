<template>
	<div>
		<h3>View</h3>
		<NoticeView title="View" content="123" :fixed="false" />
		<h3>无图标</h3>
		<div style="margin-bottom: 12px">
			<Button :wait="0" @click="handleClick('open')">
				Normal
			</Button>
			<Button :fixed="false" :wait="0" @click="handleClickTitle('open')">
				仅标题
			</Button>
		</div>
		<h3>有图标</h3>
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
			<Button :wait="0" @click="handleClickClose('info')">
				手动关闭的提示
			</Button>
			<Button :wait="0" @click="handleClickrender">
				根据render函数渲染
			</Button>
		</div>
	</div>
</template>
<script setup>
import { h } from 'vue';
import { Notice, NoticeView } from '..';
import { Button } from '../../button';

window.Notice = Notice;

const handleClick = (type) => {
	if (type === 'open') {
		Notice.open({
			title: '这是标题',
			content: '这是内容这是内容这是内容这是内容这是内容这是内容这是内容这是内容这是内容这是内容这是内容这是内容这是内容这是内容这是内容',
			onBeforeClose() {
				return new Promise((resolve) => {
					setTimeout(resolve, 1000);
				});
			},
			onClose() {
				console.log('onBeforeClose: 1s后关闭回调');
			}
		});
	} else if (type === 'success') {
		Notice.success({
			content: '成功的提示',
			insertion: "last",
			onClose() {
				console.log('回调');
			}
		});
	} else if (type === 'error') {
		Notice.error({
			content: '测试错误的提示',
			onClose() {
				console.log('回调2');
			}
		});
	} else if (type === 'warn') {
		Notice.warning({
			content: '测试警告的提示',
		});
	}
};

const handleClickTitle = (type) => {
	if (type === 'open') {
		Notice.open({
			title: '这是标题',
			duration: 0,
			onClose() {
				console.log('回调');
			}
		});
	}
};

const handleClickClose = () => {
	Notice.info({
		title: '标题一',
		content: '可关闭的提示',
		closable: true,
		duration: 0,
		onClose() {
			console.log('回调2');
		}
	});
};

const handleClickrender = () => {
	Notice.info({
		content: () => {
			return h('span', [
				'This is created by ',
				h('a', 'render'),
				' function'
			]);
		}
	});
};

</script>
