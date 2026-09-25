<template>
	<div class="text-popover-demo">
		<p class="text-popover-demo__tip">
			Text 截断后悬停弹出全文（Popover.open，同名，打开新的会销毁旧的）。原先在根节点的 mouseover 中打开，triggerEl 与宽度取 e.target：
			mouseover 会冒泡，renderRow 返回元素时鼠标每跨过一次子元素边界就重新打开一次，落到行内元素上时宽度为 0；根节点下只有文本节点时只在移入时触发一次（与 mouseenter 相同）。
			现改为 mouseenter，triggerEl 与宽度取根节点。
		</p>
		<p class="text-popover-demo__legend">结论：<b>已修复</b> = 本次已修复；<b>无问题</b> = 对照组</p>

		<section
			v-for="item in cases"
			:key="item.id"
			class="text-popover-demo__case"
			:data-case="item.id"
		>
			<h4>{{ item.title }}</h4>
			<p>手动：鼠标移入文字后，在文字上（含行间、末行右侧空白）来回移动；自动：按真实移动时的顺序派发事件（移入根节点时 mouseenter，之后每跨过一次子元素边界 mouseover：{{ item.path }}）</p>
			<p>期望：弹层只创建 1 次，宽度与 Text 相同（{{ boxWidth }}px）</p>
			<p :class="['text-popover-demo__verdict', item.fixed ? 'is-fixed' : 'is-ok']">
				{{ item.verdict }}
			</p>
			<div class="text-popover-demo__box">
				<Text
					:ref="el => (refs[item.id] = el)"
					:value="value"
					:line="2"
					:render-row="item.renderRow"
					:portal-class="popupClass(item.id)"
				/>
			</div>
			<div class="text-popover-demo__actions">
				<Button type="primary" size="small" @click="run(item)">
					自动复现
				</Button>
				<Button size="small" @click="reset(item.id)">
					清空
				</Button>
				<span>创建次数：<b data-count>{{ counts[item.id] }}</b>，弹层宽度：<b data-width>{{ widths[item.id] }}</b></span>
			</div>
			<div
				v-if="results[item.id]"
				:data-result="results[item.id].pass ? 'pass' : 'fail'"
				:class="['text-popover-demo__result', results[item.id].pass ? 'is-pass' : 'is-fail']"
			>
				期望：{{ results[item.id].expected }}；实际：{{ results[item.id].actual }}
			</div>
		</section>
	</div>
</template>

<script setup lang="jsx">
import { reactive, onMounted, onBeforeUnmount } from 'vue';
import { Text } from '..';
import { Button } from '../../button';
import { Portal } from '../../portal';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const boxWidth = 300;
const value = '关键字 A、关键字 B 与关键字 C 在 T3 中会被高亮，关键字之间是普通文本；这是一段很长的文字，用来演示截断后的悬停弹层，鼠标移动时会在不同的元素之间切换。';
const KEYWORD = '关键字';

const cases = [
	{
		id: 't1',
		title: 'T1. 默认 renderRow（返回文本，根节点下只有文本节点）',
		path: '根节点',
		verdict: '结论：无问题（对照组）——根节点下只有文本节点，mouseover 只在移入时触发一次，e.target 即根节点',
		targets: root => [root]
	},
	{
		id: 't2',
		title: 'T2. renderRow 返回一个 <span>（根节点下只有一个子元素）',
		path: 'span → 根节点（行间 / 末行空白）→ span',
		fixed: true,
		verdict: '结论：已修复——原先在 span 与行间空白之间移动时反复重建，triggerEl 为 span，宽度取行内元素的 clientWidth 为 0，全文一字一行',
		renderRow: ({ value: v }) => <span class="text-popover-demo__row">{ v }</span>,
		targets: root => [root.querySelector('span'), root, root.querySelector('span')]
	},
	{
		id: 't3',
		title: 'T3. renderRow 高亮关键字（多个子元素，关键字之间是文本节点）',
		path: 'b → 根节点（普通文本）→ b → 根节点',
		fixed: true,
		verdict: '结论：已修复——原先每经过一个关键字就重建一次，弹层贴到该关键字上方且宽度为 0',
		renderRow: ({ value: v }) => v.split(KEYWORD).flatMap((text, i) => (i ? [<b>{ KEYWORD }</b>, text] : [text])),
		targets: (root) => {
			const [b1, b2] = root.querySelectorAll('b');
			return [b1, root, b2, root];
		}
	}
];

const refs = {};
const counts = reactive({ t1: 0, t2: 0, t3: 0 });
const widths = reactive({ t1: '-', t2: '-', t3: '-' });
const results = reactive({ t1: null, t2: null, t3: null });
const popupClass = id => `text-popover-demo__${id}`;

// 统计弹层创建次数（Portal 每次新建都会在 body 下插入弹层节点），并记录最近一次的宽度
let observer;
onMounted(() => {
	observer = new MutationObserver(list => list.forEach(m => m.addedNodes.forEach((node) => {
		const item = cases.find(i => node.classList?.contains(popupClass(i.id)));
		if (!item) return;
		counts[item.id]++;
		// offsetWidth 不受入场动画的缩放影响
		requestAnimationFrame(() => (widths[item.id] = `${node.offsetWidth}px`));
	})));
	observer.observe(document.body, { childList: true });
});

const destroy = () => Portal.leafs.get('vc-text-popover')?.destroy();
onBeforeUnmount(() => {
	observer?.disconnect();
	destroy();
});

const reset = (id) => {
	destroy();
	counts[id] = 0;
	widths[id] = '-';
	results[id] = null;
};

const run = async (item) => {
	reset(item.id);
	await sleep(300);
	const root = refs[item.id].$el;
	root.dispatchEvent(new MouseEvent('mouseenter'));
	for (const el of item.targets(root)) {
		el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		await sleep(100);
	}
	await sleep(400);
	const width = Math.round(root.getBoundingClientRect().width);
	const actualWidth = parseFloat(widths[item.id]);
	results[item.id] = {
		expected: `创建 1 次，宽度 ${width}px`,
		actual: `创建 ${counts[item.id]} 次，宽度 ${widths[item.id]}`,
		pass: counts[item.id] === 1 && Math.abs(actualWidth - width) <= 1
	};
};
</script>

<style lang="scss">
.text-popover-demo {
	padding: 40px;
	padding-bottom: 300px;

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
			color: #52c41a;
			font-weight: bold;
		}
	}

	&__case {
		margin-bottom: 32px;
		padding: 16px;
		border: 1px solid #e9e9e9;
		border-radius: 4px;

		h4 {
			margin: 0 0 8px;
		}
	}

	&__box {
		width: 300px;
		margin: 16px 0;
		padding: 8px;
		background: #f5f5f5;
		line-height: 28px;
	}

	&__row {
		color: #1890ff;
	}

	&__actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	&__result {
		margin-top: 8px;
		font-size: 12px;

		&.is-pass {
			color: #52c41a;
		}

		&.is-fail {
			color: #f5222d;
		}
	}
}
</style>
