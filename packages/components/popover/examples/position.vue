<template>
	<div class="position-demo">
		<p class="position-demo__tip">
			D 组：Popover.open 的定位。弹层内容的尺寸在打开后变化（如图片加载）、触发节点移动、页面 / 容器滚动时，弹层能否保持贴合。
			图片由 canvas 生成，按延迟设置 src 模拟网络，img 不写宽高。
			“自动复现”打开弹层并在稳定后测量：间距 = 弹层与触发节点之间的距离（期望 4px），对齐偏差 = 辅助方向上的偏差（期望 0）。
		</p>
		<p class="position-demo__legend">结论：<b>已修复</b> = 本次已修复；<b>不处理</b> = 已确认不修，自动复现结果以灰色显示；<b>无问题</b> = 对照组</p>
		<div class="position-demo__toolbar">
			<span>手动悬停时的图片延迟：</span>
			<Button
				v-for="item in delays"
				:key="item"
				size="small"
				:type="delay === item ? 'primary' : 'default'"
				@click="delay = item"
			>
				{{ item }}ms
			</Button>
		</div>

		<!-- D1 -->
		<section class="position-demo__case" data-case="d1">
			<h4>D1. 图片预览 placement=top</h4>
			<p>手动：悬停缩略图；自动：依次以 300 / 20 / 0ms 加载图片</p>
			<p>期望：图片加载后弹层底边距缩略图 4px，水平居中</p>
			<p class="position-demo__verdict is-fixed">
				结论：已修复——内容连续变化时按最终尺寸定位；去掉位置过渡，并以靠近按钮的一边定位（translate 上移自身高度），长高时向上伸展，悬停时不再闪烁
			</p>
			<div class="position-demo__center">
				<span
					ref="d1Ref"
					class="position-demo__thumb"
					@mouseenter="e => openImage(e.currentTarget, { placement: 'top' })"
				>缩略图</span>
			</div>
			<Actions :results="results.d1" @run="runD1" />
		</section>

		<!-- D2 -->
		<section class="position-demo__case" data-case="d2">
			<h4>D2. 图片预览 placement=right / left / right-bottom</h4>
			<p>手动：悬停缩略图（right）；自动：三个方向各加载一次（300ms）</p>
			<p>期望：贴在对应一侧（间距 4px），垂直方向按 placement 对齐</p>
			<p class="position-demo__verdict is-fixed">结论：已修复——所有方向在弹层尺寸变化后都重新定位</p>
			<div class="position-demo__center">
				<span
					ref="d2Ref"
					class="position-demo__thumb"
					@mouseenter="e => openImage(e.currentTarget, { placement: 'right' })"
				>缩略图</span>
			</div>
			<Actions :results="results.d2" @run="runD2" />
		</section>

		<!-- D3 -->
		<section class="position-demo__case" data-case="d3">
			<h4>D3. 触发节点靠视口右边缘，placement=top，图片宽 320px</h4>
			<p>期望：弹层完整在视口内，图片按原始宽度显示且不超出弹层</p>
			<p class="position-demo__verdict is-fixed">
				结论：已修复——完整重算后再做右边界修正（按不含滚动条的可视宽度）；悬停时的闪烁同 D1
			</p>
			<div class="position-demo__end">
				<span
					ref="d3Ref"
					class="position-demo__thumb"
					@mouseenter="e => openImage(e.currentTarget, { placement: 'top', width: 320, height: 120 })"
				>缩略图</span>
			</div>
			<Actions :results="results.d3" @run="runD3" />
		</section>

		<!-- D4 -->
		<section class="position-demo__case" data-case="d4">
			<h4>D4. 触发节点靠视口底部，placement=bottom，图片加载后下方放不下</h4>
			<p>自动：先滚动到触发节点距视口底部 80px，再以 20 / 300 / 0ms 加载 240×240 图片</p>
			<p>手动（Chrome）：点击“滚动到视口底部附近”，选 300ms，悬停缩略图后鼠标不动，观察弹层是否反复闪烁、“打开次数”是否持续增加</p>
			<p>期望：翻转到 top，弹层完整在视口内；鼠标不动时只打开 1 次</p>
			<p class="position-demo__verdict is-fixed">
				结论：已修复——50ms 内加载完成时也会翻转；去掉位置过渡后，翻转时弹层不再从鼠标下扫过，鼠标不动时只打开 1 次
			</p>
			<div class="position-demo__center">
				<span
					ref="d4Ref"
					class="position-demo__thumb"
					@mouseenter="e => (d4Opens++, openImage(e.currentTarget, { placement: 'bottom', width: 240, height: 240 }))"
				>缩略图</span>
			</div>
			<Actions :results="results.d4" @run="runD4">
				<Button size="small" @click="scrollD4">
					滚动到视口底部附近
				</Button>
				<span class="position-demo__count">打开次数：{{ d4Opens }}</span>
			</Actions>
		</section>

		<!-- D5 -->
		<section class="position-demo__case" data-case="d5">
			<h4>D5. triggerEl 已被其他代码 Resize.on 监听，placement=right（纯文本内容）</h4>
			<p>左侧节点在挂载时已被 Resize.on 监听（如 Text 组件根节点），右侧为对照</p>
			<p>期望：两者都定位在节点右侧</p>
			<p class="position-demo__verdict is-fixed">结论：已修复（随 D2）——弹层自身的首次尺寸回调即完成定位</p>
			<div class="position-demo__center">
				<span
					ref="d5Ref"
					class="position-demo__thumb"
					@mouseenter="e => openText(e.currentTarget, { placement: 'right' })"
				>已被监听</span>
				<span
					ref="d5ControlRef"
					class="position-demo__thumb"
					@mouseenter="e => openText(e.currentTarget, { placement: 'right' })"
				>对照</span>
			</div>
			<Actions :results="results.d5" @run="runD5" />
		</section>

		<!-- D6 -->
		<section class="position-demo__case" data-case="d6">
			<h4>D6. 触发节点在内部滚动容器里，打开后滚动容器</h4>
			<p>手动：点击节点打开弹层，再滚动灰色容器（让节点靠近容器底边、滚出容器、再滚回）</p>
			<p>期望：弹层跟随触发节点；靠近容器底边时翻转到上方；节点滚出容器可视区时隐藏，滚回后恢复</p>
			<p class="position-demo__verdict is-fixed">
				结论：已修复——监听触发节点所在的滚动容器（含 Scroller 滚轮模式）；翻转以“视口 ∩ 容器可视区”为边界；节点完全滚出容器可视区时 visibility: hidden（不关闭）
			</p>
			<div ref="d6ScrollRef" class="position-demo__scroll">
				<div class="position-demo__scroll-inner">
					<span
						ref="d6Ref"
						class="position-demo__thumb"
						@click="e => openText(e.currentTarget, { placement: 'bottom', hover: false })"
					>点击打开</span>
				</div>
			</div>
			<Actions :results="results.d6" @run="runD6" />
		</section>

		<!-- D7 -->
		<section class="position-demo__case" data-case="d7">
			<h4>D7. 触发节点位置变化但尺寸不变</h4>
			<p>自动：打开后在节点上方插入 80px 内容；手动：点击节点打开后，改变窗口宽度（右侧节点居中布局）</p>
			<p>期望：弹层跟随触发节点</p>
			<p class="position-demo__verdict is-wontfix">结论：不处理——窗口缩放为瞬时场景，重新打开即恢复；上方插入需轮询，成本高</p>
			<div v-if="d7Spacer" class="position-demo__spacer">
				插入的内容
			</div>
			<div class="position-demo__row">
				<span
					ref="d7Ref"
					class="position-demo__thumb"
					@click="e => openText(e.currentTarget, { placement: 'bottom', hover: false })"
				>点击打开（上方插入）</span>
				<div class="position-demo__center position-demo__grow">
					<span
						ref="d7bRef"
						class="position-demo__thumb"
						@click="e => openText(e.currentTarget, { placement: 'bottom', hover: false })"
					>点击打开（窗口缩放）</span>
				</div>
			</div>
			<Actions :results="results.d7" @run="runD7">
				<Button size="small" @click="measureD7b">
					测量右侧节点
				</Button>
			</Actions>
		</section>

		<!-- D8 -->
		<section class="position-demo__case" data-case="d8">
			<h4>D8. 页面横向滚动后打开，placement=bottom vs bottom-left</h4>
			<p>自动：临时加宽页面并横向滚动 300px，分别打开两种方向</p>
			<p>期望：都与触发节点对齐（bottom 居中，bottom-left 左对齐）</p>
			<p class="position-demo__verdict is-fixed">结论：已修复——页面坐标同时加上横向滚动距离，*-left / *-right 不再单独叠加</p>
			<div class="position-demo__center">
				<span ref="d8Ref" class="position-demo__thumb">触发节点</span>
			</div>
			<div v-if="d8Wide" class="position-demo__wide" />
			<Actions :results="results.d8" @run="runD8" />
		</section>
	</div>
</template>

<script setup lang="jsx">
import { ref, reactive, nextTick, onMounted, onBeforeUnmount, defineComponent } from 'vue';
import { Resize } from '@deot/helper-resize';
import { Popover } from '..';
import { Button } from '../../button';
import { Portal } from '../../portal';

const NAME = 'position-demo';
const POPUP_CLASS = 'position-demo__popup';
const EXTRA_DISTANCE = 4;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const round = v => Math.round(v * 10) / 10;

const delays = [0, 20, 300];
const delay = ref(300);

// canvas 生成的图片（按尺寸缓存）
const images = {};
const getImage = (width, height) => {
	const key = `${width}x${height}`;
	if (!images[key]) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		const gradient = ctx.createLinearGradient(0, 0, width, height);
		gradient.addColorStop(0, '#5b8ff9');
		gradient.addColorStop(1, '#5ad8a6');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = '#fff';
		ctx.font = '16px sans-serif';
		ctx.fillText(key, 12, 28);
		images[key] = canvas.toDataURL();
	}
	return images[key];
};

// 延迟设置 src 模拟网络；0ms 表示首次渲染即带 src（如命中缓存）
const DelayImage = defineComponent({
	props: {
		src: String,
		delay: Number
	},
	emits: ['load'],
	setup(props, { emit }) {
		const current = ref(props.delay ? '' : props.src);
		let timer;
		onMounted(() => {
			props.delay && (timer = setTimeout(() => (current.value = props.src), props.delay));
		});
		onBeforeUnmount(() => clearTimeout(timer));
		return () => (
			<div class="position-demo__preview">
				{
					current.value
						? <img src={current.value} onLoad={() => emit('load')} />
						: <span>加载中…</span>
				}
			</div>
		);
	}
});

const Actions = defineComponent({
	props: {
		results: Array
	},
	emits: ['run'],
	setup(props, { emit, slots }) {
		return () => (
			<div class="position-demo__actions">
				<div class="position-demo__buttons">
					<Button type="primary" size="small" onClick={() => emit('run')}>自动复现</Button>
					{ slots.default?.() }
				</div>
				{
					props.results?.map(item => (
						<div
							key={item.label}
							data-result={item.pass ? 'pass' : 'fail'}
							data-wontfix={item.wontfix ? '' : void 0}
							class={['position-demo__result', item.wontfix ? 'is-wontfix' : item.pass ? 'is-pass' : 'is-fail']}
						>
							{ `${item.wontfix ? '不处理｜' : ''}${item.label}｜期望：${item.expected}｜实际：${item.actual}` }
						</div>
					))
				}
			</div>
		);
	}
});

const results = reactive({ d1: [], d2: [], d3: [], d4: [], d5: [], d6: [], d7: [], d8: [] });

// 同一时刻只保留一个弹层（同名，打开新的会销毁旧的）
const open = (triggerEl, options) => Popover.open({
	el: document.body,
	name: NAME,
	triggerEl,
	hover: true,
	portalClass: POPUP_CLASS,
	...options
});

const openImage = (triggerEl, { width = 240, height = 180, delay: delay$ = delay.value, onLoad, ...rest } = {}) => open(triggerEl, {
	content: () => <DelayImage src={getImage(width, height)} delay={delay$} onLoad={onLoad} />,
	...rest
});

const openText = (triggerEl, options = {}) => open(triggerEl, {
	content: () => <div class="position-demo__text">弹层文本内容</div>,
	...options
});

// 打开图片弹层，等图片加载、入场动画（300ms）与重算结束后返回
const openImageAndWait = async (triggerEl, options) => {
	let done;
	const loaded = new Promise(r => (done = r));
	openImage(triggerEl, { ...options, onLoad: () => done() });
	await Promise.race([loaded, sleep(3000)]);
	await sleep(500);
};

const getPopup = () => document.querySelector(`.${POPUP_CLASS}`);
// 实际方向：箭头上的 is-{主方向}-basic / is-{placement}（弹层上 right-bottom 会同时带 is-right 与 is-bottom）
const getFit = (popup) => {
	const classes = Array.from(popup.querySelector('.vc-popover-wrapper__arrow')?.classList || []);
	const main = classes.map(i => i.match(/^is-(top|bottom|left|right)-basic$/)?.[1]).find(Boolean);
	const full = classes.map(i => i.match(/^is-((top|bottom|left|right)(-(top|bottom|left|right))?)$/)?.[1]).find(Boolean);
	return { main, full };
};

/**
 * 弹层与触发节点的几何关系
 * @param triggerEl 触发节点
 * @param placement 期望的方向
 * @returns ok / 描述
 */
const check = (triggerEl, placement) => {
	const popup = getPopup();
	if (!popup) return { ok: false, text: '弹层不存在' };
	const t = triggerEl.getBoundingClientRect();
	const r = popup.getBoundingClientRect();
	const { main: fit, full } = getFit(popup);
	const [main, assist] = placement.split('-');
	const gaps = {
		top: t.top - r.bottom,
		bottom: r.top - t.bottom,
		left: t.left - r.right,
		right: r.left - t.right
	};
	const gap = gaps[fit || main];
	let align;
	if (/top|bottom/.test(fit || main)) {
		align = assist === 'left'
			? r.left - t.left
			: assist === 'right'
				? r.right - t.right
				: (r.left + r.width / 2) - (t.left + t.width / 2);
	} else {
		align = assist === 'top'
			? r.top - t.top
			: assist === 'bottom'
				? r.bottom - t.bottom
				: (r.top + r.height / 2) - (t.top + t.height / 2);
	}
	const ok = fit === main && Math.abs(gap - EXTRA_DISTANCE) <= 1 && Math.abs(align) <= 1;
	const style = popup.style.top ? '' : '，style.top 为空（未定位）';
	return {
		ok,
		gap,
		rect: r,
		text: `方向 ${full || '-'}，间距 ${round(gap)}px，对齐偏差 ${round(align)}px${style}`
	};
};

const scrollCenter = async (el) => {
	el.scrollIntoView({ block: 'center' });
	await sleep(100);
};

const d1Ref = ref();
const runD1 = async () => {
	results.d1 = [];
	await scrollCenter(d1Ref.value);
	const list = [];
	for (const d of [300, 20, 0]) {
		await openImageAndWait(d1Ref.value, { placement: 'top', delay: d });
		const c = check(d1Ref.value, 'top');
		list.push({ label: `${d}ms`, expected: '方向 top，间距 4px，对齐偏差 0', actual: c.text, pass: c.ok });
	}
	results.d1 = list;
};

const d2Ref = ref();
const runD2 = async () => {
	results.d2 = [];
	await scrollCenter(d2Ref.value);
	const list = [];
	for (const placement of ['right', 'left', 'right-bottom']) {
		await openImageAndWait(d2Ref.value, { placement, delay: 300 });
		const c = check(d2Ref.value, placement);
		list.push({ label: placement, expected: `方向 ${placement.split('-')[0]}，间距 4px，对齐偏差 0`, actual: c.text, pass: c.ok });
	}
	results.d2 = list;
};

const d3Ref = ref();
const runD3 = async () => {
	results.d3 = [];
	await scrollCenter(d3Ref.value);
	await openImageAndWait(d3Ref.value, { placement: 'top', width: 320, height: 120, delay: 300 });
	const popup = getPopup();
	const c = check(d3Ref.value, 'top');
	const container = popup.querySelector('.vc-popover-wrapper__container').getBoundingClientRect();
	const img = popup.querySelector('img').getBoundingClientRect();
	const viewport = document.documentElement.clientWidth;
	const full = Math.round(img.width) === 320;
	const inside = img.right <= container.right + 0.5;
	const visible = c.rect.right <= viewport + 0.5 && c.rect.left >= -0.5;
	results.d3 = [{
		label: '320×120',
		expected: '图片宽 320px、不超出弹层，弹层在视口内',
		actual: `图片宽 ${round(img.width)}px，弹层容器宽 ${round(container.width)}px（图片${inside ? '未超出' : '超出'}弹层），`
			+ `弹层右边界 ${round(c.rect.right)} / 视口 ${viewport}；${c.text}`,
		pass: full && inside && visible && Math.abs(c.gap - EXTRA_DISTANCE) <= 1
	}];
};

const d4Ref = ref();
const d4Opens = ref(0);
// 触发节点底边距视口底部 80px
const scrollD4 = async () => {
	d4Opens.value = 0;
	await scrollCenter(d4Ref.value);
	window.scrollBy(0, d4Ref.value.getBoundingClientRect().bottom - (window.innerHeight - 80));
	await sleep(150);
};
const runD4 = async () => {
	results.d4 = [];
	const list = [];
	for (const d of [20, 300, 0]) {
		await scrollD4();
		await openImageAndWait(d4Ref.value, { placement: 'bottom', width: 240, height: 240, delay: d });
		const c = check(d4Ref.value, 'top');
		const inView = c.rect && c.rect.top >= 0 && c.rect.bottom <= window.innerHeight;
		list.push({
			label: `${d}ms`,
			expected: '翻转为 top，间距 4px，弹层在视口内',
			actual: `${c.text}，弹层 ${round(c.rect?.top)}~${round(c.rect?.bottom)} / 视口高 ${window.innerHeight}`,
			pass: c.ok && inView
		});
	}
	results.d4 = list;
};

const d5Ref = ref();
const d5ControlRef = ref();
const noop = () => {};
onMounted(() => Resize.on(d5Ref.value, noop));
onBeforeUnmount(() => Resize.off(d5Ref.value, noop));
const runD5 = async () => {
	results.d5 = [];
	await scrollCenter(d5Ref.value);
	const list = [];
	for (const [label, el] of [['已被监听', d5Ref.value], ['对照', d5ControlRef.value]]) {
		openText(el, { placement: 'right' });
		await sleep(500);
		const c = check(el, 'right');
		list.push({ label, expected: '方向 right，间距 4px，对齐偏差 0', actual: c.text, pass: c.ok });
	}
	results.d5 = list;
};

const d6Ref = ref();
const d6ScrollRef = ref();
const runD6 = async () => {
	results.d6 = [];
	await scrollCenter(d6ScrollRef.value);
	const scrollTo = async (top) => {
		d6ScrollRef.value.scrollTop = top;
		await sleep(300);
	};
	const isHidden = () => getComputedStyle(getPopup()).visibility === 'hidden';
	await scrollTo(100);
	openText(d6Ref.value, { placement: 'bottom', hover: false });
	await sleep(500);
	const before = check(d6Ref.value, 'bottom');
	await scrollTo(140);
	const after = check(d6Ref.value, 'bottom');
	// 节点靠近容器底边（下方只剩约 -10px）
	await scrollTo(20);
	const nearBottom = check(d6Ref.value, 'top');
	// 节点完全滚出容器上边
	await scrollTo(220);
	const hidden = isHidden();
	await scrollTo(100);
	const back = check(d6Ref.value, 'bottom');
	const shownAgain = !isHidden();
	results.d6 = [
		{ label: '滚动前', expected: '间距 4px', actual: before.text, pass: before.ok },
		{ label: '容器滚动 40px 后', expected: '间距 4px（跟随）', actual: after.text, pass: after.ok },
		{ label: '靠近容器底边', expected: '翻转为 top，间距 4px', actual: nearBottom.text, pass: nearBottom.ok },
		{ label: '滚出容器可视区', expected: '弹层隐藏', actual: hidden ? '弹层隐藏' : '弹层仍显示', pass: hidden },
		{ label: '滚回', expected: '弹层恢复显示，方向 bottom', actual: `${shownAgain ? '已显示' : '仍隐藏'}，${back.text}`, pass: shownAgain && back.ok }
	];
};

const d7Ref = ref();
const d7bRef = ref();
const d7Spacer = ref(false);
const runD7 = async () => {
	results.d7 = [];
	d7Spacer.value = false;
	await nextTick();
	await scrollCenter(d7Ref.value);
	openText(d7Ref.value, { placement: 'bottom', hover: false });
	await sleep(500);
	const before = check(d7Ref.value, 'bottom');
	d7Spacer.value = true;
	await sleep(300);
	const after = check(d7Ref.value, 'bottom');
	d7Spacer.value = false;
	results.d7 = [
		{ label: '插入前', expected: '间距 4px', actual: before.text, pass: before.ok },
		{ label: '上方插入 80px 后', expected: '间距 4px（跟随）', actual: after.text, pass: after.ok, wontfix: true }
	];
};
// 窗口缩放需手动完成，这里只测量
const measureD7b = () => {
	const c = check(d7bRef.value, 'bottom');
	results.d7 = [
		...results.d7.filter(i => i.label !== '右侧节点'),
		{ label: '右侧节点', expected: '间距 4px，对齐偏差 0', actual: c.text, pass: c.ok, wontfix: true }
	];
};

const d8Ref = ref();
const d8Wide = ref(false);
const runD8 = async () => {
	results.d8 = [];
	d8Wide.value = true;
	await nextTick();
	await scrollCenter(d8Ref.value);
	window.scrollTo(300, window.scrollY);
	await sleep(150);
	const list = [];
	for (const placement of ['bottom', 'bottom-left']) {
		openText(d8Ref.value, { placement });
		await sleep(500);
		const c = check(d8Ref.value, placement);
		list.push({ label: `${placement}（scrollX=${Math.round(window.scrollX)}）`, expected: `方向 bottom，间距 4px，对齐偏差 0`, actual: c.text, pass: c.ok });
	}
	Portal.leafs.get(NAME)?.destroy();
	window.scrollTo(0, window.scrollY);
	d8Wide.value = false;
	results.d8 = list;
};

onBeforeUnmount(() => Portal.leafs.get(NAME)?.destroy());
</script>

<style lang="scss">
.position-demo {
	padding: 40px;
	padding-bottom: 600px;

	&__tip {
		color: #666;
	}

	&__legend {
		font-size: 12px;
		color: #666;
	}

	&__verdict {
		font-size: 12px;

		&.is-wontfix {
			color: #999;
		}

		&.is-fixed {
			color: #52c41a;
			font-weight: bold;
		}
	}

	&__toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 16px;
	}

	&__case {
		margin-bottom: 32px;
		padding: 16px;
		border: 1px solid #e9e9e9;
		border-radius: 4px;

		h4 {
			margin: 0 0 8px;
		}

		p {
			margin: 4px 0;
		}
	}

	&__center {
		display: flex;
		justify-content: center;
		gap: 24px;
		padding: 16px 0;
	}

	&__end {
		display: flex;
		justify-content: flex-end;
		padding: 16px 0;
	}

	&__row {
		display: flex;
		align-items: center;
		padding: 16px 0;
	}

	&__grow {
		flex: 1;
	}

	&__thumb {
		display: inline-block;
		padding: 8px 16px;
		border: 1px dashed #999;
		border-radius: 4px;
		background: #fafafa;
		cursor: default;
		user-select: none;
	}

	&__preview {
		padding: 4px 0;

		img {
			display: block;
		}
	}

	&__text {
		padding: 4px 0;
		white-space: nowrap;
	}

	&__scroll {
		height: 160px;
		overflow: auto;
		background: #f0f0f0;
	}

	&__scroll-inner {
		height: 400px;
		padding-top: 150px;
		padding-left: 24px;
		box-sizing: border-box;
	}

	&__spacer {
		height: 80px;
		line-height: 80px;
		text-align: center;
		background: #fffbe6;
	}

	&__wide {
		width: 3000px;
		height: 1px;
	}

	&__actions {
		margin-top: 12px;
	}

	&__buttons {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}

	&__count {
		font-size: 12px;
		line-height: 24px;
	}

	&__result {
		font-size: 12px;
		line-height: 20px;

		&.is-pass {
			color: #52c41a;
		}

		&.is-fail {
			color: #f5222d;
		}

		&.is-wontfix {
			color: #999;
		}
	}
}
</style>
