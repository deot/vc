<template>
	<div class="text-popover-content-demo">
		<p class="text-popover-content-demo__tip">
			Text 把 value 当文本显示；截断后悬停弹出的全文提示，原先把同一个 value 交给 Popover 当 HTML 解析：
			含标签的文本在提示里变成了元素，onerror 之类的属性也会执行，提示与本体显示的内容不一致。现改为按文本渲染。
		</p>
		<p class="text-popover-content-demo__legend">结论：<b>已修复</b> = 本次已修复；<b>无问题</b> = 对照组</p>

		<section
			v-for="item in cases"
			:key="item.id"
			class="text-popover-content-demo__case"
			:data-case="item.id"
		>
			<h4>{{ item.title }}</h4>
			<p>手动：鼠标移入被截断的文字，看提示里的内容；自动：向根节点派发 mouseenter 后检查提示层</p>
			<p>期望：提示里的文字与 value 完全一致，不生成元素，脚本执行 0 次</p>
			<p :class="['text-popover-content-demo__verdict', item.fixed ? 'is-fixed' : 'is-ok']">
				{{ item.verdict }}
			</p>
			<div class="text-popover-content-demo__box">
				<Text
					:ref="el => (refs[item.id] = el)"
					:value="item.value"
					:line="1"
					:portal-class="popupClass(item.id)"
				/>
			</div>
			<div class="text-popover-content-demo__actions">
				<Button type="primary" size="small" @click="handleRun(item)">
					自动复现
				</Button>
				<Button size="small" @click="handleReset(item.id)">
					清空
				</Button>
			</div>
			<div
				v-if="results[item.id]"
				:data-result="results[item.id].pass ? 'pass' : 'fail'"
				:class="['text-popover-content-demo__result', results[item.id].pass ? 'is-pass' : 'is-fail']"
			>
				期望：{{ results[item.id].expected }}；实际：{{ results[item.id].actual }}
			</div>
		</section>
	</div>
</template>

<script setup>
import { reactive, onBeforeUnmount } from 'vue';
import { Text } from '..';
import { Button } from '../../button';
import { Portal } from '../../portal';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const TAIL = '；这是一段很长的说明文字，用来让内容超出一行并被截断，鼠标移入后弹出全文提示。';

const cases = [
	{
		id: 'c1',
		title: 'C1. 普通文本（对照）',
		verdict: '结论：无问题（对照组）——没有标签，当文本还是当 HTML 解析结果都一样',
		value: `条目 A 的说明${TAIL}`
	},
	{
		id: 'c2',
		title: 'C2. 文本里含标签',
		fixed: true,
		verdict: '结论：已修复——原先提示里的 <b> 被解析成加粗元素，标签文字消失，与本体显示不一致',
		value: `条目 <b>B</b> 的说明${TAIL}`
	},
	{
		id: 'c3',
		title: 'C3. 文本里含带 onerror 的标签',
		fixed: true,
		verdict: '结论：已修复——原先提示里生成了 img 元素，加载失败后 onerror 执行',
		value: `条目 <img src="data:," alt="" onerror="window.$textPopoverExecuted()"> 的说明${TAIL}`
	}
];

const refs = {};
const results = reactive({ c1: null, c2: null, c3: null });
const popupClass = id => `text-popover-content-demo__${id}`;

let executed = 0;
window.$textPopoverExecuted = () => executed++;

const destroy = () => Portal.leafs.get('vc-text-popover')?.destroy();
onBeforeUnmount(() => {
	destroy();
	delete window.$textPopoverExecuted;
});

const handleReset = (id) => {
	destroy();
	results[id] = null;
};

const handleRun = async (item) => {
	handleReset(item.id);
	executed = 0;
	await sleep(300);
	refs[item.id].$el.dispatchEvent(new MouseEvent('mouseenter'));
	// 等弹层挂载、图片加载失败
	await sleep(600);

	const content = document.querySelector(`.${popupClass(item.id)} .vc-popover-wrapper__content`);
	const elements = content ? content.querySelectorAll('b, img').length : 0;
	const isSame = !!content && content.textContent.trim() === item.value;
	results[item.id] = {
		expected: '文字与 value 一致，生成元素 0 个，脚本执行 0 次',
		actual: `${content ? (isSame ? '文字与 value 一致' : '文字与 value 不一致') : '没有弹出提示'}，生成元素 ${elements} 个，脚本执行 ${executed} 次`,
		pass: isSame && elements === 0 && executed === 0
	};
};
</script>

<style lang="scss">
.text-popover-content-demo {
	padding: 40px 240px 300px 40px;

	&__tip {
		color: #666;
	}

	&__legend {
		font-size: 12px;
		color: #666;
	}

	&__verdict {
		font-size: 12px;

		&.is-ok {
			color: #52c41a;
		}

		&.is-fixed {
			font-weight: bold;
			color: #52c41a;
		}
	}

	&__case {
		padding: 16px;
		margin-bottom: 32px;
		border: 1px solid #e9e9e9;
		border-radius: 4px;

		h4 {
			margin: 0 0 8px;
		}
	}

	&__box {
		width: 300px;
		padding: 8px;
		margin: 16px 0;
		line-height: 28px;
		background: #f5f5f5;
	}

	&__actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	&__result {
		padding: 8px;
		margin-top: 12px;
		font-size: 12px;

		&.is-pass {
			color: #52c41a;
			background: #f6ffed;
		}

		&.is-fail {
			color: #f5222d;
			background: #fff1f0;
		}
	}
}
</style>
