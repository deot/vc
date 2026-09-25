<template>
	<div class="timer-demo">
		<p class="timer-demo__tip">
			hover / strictHover 移出后延时 200ms 关闭（popover.tsx handleChange）。
			“自动复现”按固定时序派发 mouseenter / mouseleave、卸载、修改 v-model，日志时间相对第一条记录，最后给出期望与实际。
			C 组为 Popover.open 直接调用：弹层独立于调用方的 Vue 树，触发节点被移除或重复调用时由谁清理。
		</p>
		<p class="timer-demo__legend">结论：<b>已修复</b> = 本次已修复；<b>不处理</b> = 已确认不修，自动复现结果以灰色显示；<b>无问题</b> = 对照组</p>

		<!-- B1 -->
		<section class="timer-demo__case" data-case="b1">
			<h4>B1. strictHover：移出后 200ms 内移回</h4>
			<p>手动：悬停按钮，快速移出再移回（200ms 内），鼠标停在按钮上</p>
			<p>期望：保持打开</p>
			<p class="timer-demo__verdict is-fixed">结论：已修复——离开后移回会取消关闭，连续离开只 emit 一次</p>
			<Popover
				ref="b1Ref"
				v-model="b1"
				trigger="strictHover"
				content="strictHover 内容"
				portal-class="timer-demo__b1"
				@visible-change="v => logs.b1.push(`visible-change(${v})`)"
			>
				<Button>悬停（strictHover）</Button>
			</Popover>
			<Actions :result="results.b1" @run="runB1" @clear="clear('b1')" />
			<Log :state="b1" :list="logs.b1.list" />
		</section>

		<!-- B2 -->
		<section class="timer-demo__case" data-case="b2">
			<h4>B2. hover：移出后 200ms 内卸载</h4>
			<p>
				手动：勾选“移出即卸载”，悬停按钮后移出
				<label>
					<input v-model="b2UnmountOnLeave" type="checkbox">
					移出即卸载
				</label>
			</p>
			<p>期望：卸载后不再收到 visible-change / update:modelValue</p>
			<p class="timer-demo__verdict is-wontfix">结论：不处理——未复现：Vue 3.5 的 emit 会忽略已卸载实例</p>
			<div class="timer-demo__slot" @mouseleave="b2UnmountOnLeave && unmountB2()">
				<Popover
					v-if="b2Mounted"
					ref="b2Ref"
					v-model="b2"
					trigger="hover"
					content="hover 内容"
					portal-class="timer-demo__b2"
					@visible-change="v => logs.b2.push(`visible-change(${v})`)"
					@update:model-value="v => logs.b2.push(`update:modelValue(${v})`)"
				>
					<Button>悬停（hover）</Button>
				</Popover>
				<span v-else>（已卸载）</span>
			</div>
			<Actions :result="results.b2" @run="runB2" @clear="clear('b2')">
				<Button size="small" @click="b2Mounted = true">
					重新挂载
				</Button>
			</Actions>
			<Log :state="b2" :list="logs.b2.list" />
		</section>

		<!-- B3 -->
		<section class="timer-demo__case" data-case="b3">
			<h4>B3. hover：移出后 200ms 内，外部通过 v-model 关闭再打开</h4>
			<p>期望：以外部最后一次设置为准，保持打开</p>
			<p class="timer-demo__verdict is-wontfix">结论：不处理——需要外部在 200ms 内关闭再打开，属刻意构造</p>
			<Popover
				ref="b3Ref"
				v-model="b3"
				trigger="hover"
				content="hover 内容"
				portal-class="timer-demo__b3"
				@visible-change="v => logs.b3.push(`visible-change(${v})`)"
			>
				<Button>悬停（hover）</Button>
			</Popover>
			<Actions :result="results.b3" @run="runB3" @clear="clear('b3')" />
			<Log :state="b3" :list="logs.b3.list" />
		</section>

		<h3>C. Popover.open：触发节点被移除 / 重复调用</h3>

		<!-- C1 -->
		<section class="timer-demo__case" data-case="c1">
			<h4>C1. hover 打开后，定时器 500ms 移除 triggerEl（鼠标不碰弹层）</h4>
			<p>手动：悬停下方节点打开弹层，鼠标停住不动，500ms 后节点被移除；之后不要移入弹层</p>
			<p>期望：弹层关闭并销毁</p>
			<p class="timer-demo__verdict is-fixed">结论：已修复——触发节点移除后弹层关闭并销毁，不再残留在左上角</p>
			<div class="timer-demo__slot">
				<span
					v-if="c1Show"
					ref="c1Ref"
					class="timer-demo__trigger"
					@mouseenter="e => openC('c1', e.currentTarget, {}, 500)"
				>悬停（500ms 后移除）</span>
				<span v-else>（节点已移除）</span>
			</div>
			<Actions :result="results.c1" @run="runC1" @clear="clear('c1')">
				<Button size="small" @click="resetC('c1')">
					恢复节点并销毁弹层
				</Button>
			</Actions>
			<Log :list="logs.c1.list" />
		</section>

		<!-- C2 -->
		<section class="timer-demo__case" data-case="c2">
			<h4>C2. hover 移出后 50ms 移除 triggerEl（对照：移出的关闭定时器仍在）</h4>
			<p>手动：悬停下方节点后移出，移出 50ms 后节点被移除</p>
			<p>期望：弹层正常关闭并销毁</p>
			<p class="timer-demo__verdict is-ok">结论：对照，无问题</p>
			<div class="timer-demo__slot">
				<span
					v-if="c2Show"
					ref="c2Ref"
					class="timer-demo__trigger"
					@mouseenter="e => openC('c2', e.currentTarget)"
					@mouseleave="removeLater('c2', 50)"
				>悬停后移出（50ms 后移除）</span>
				<span v-else>（节点已移除）</span>
			</div>
			<Actions :result="results.c2" @run="runC2" @clear="clear('c2')">
				<Button size="small" @click="resetC('c2')">
					恢复节点并销毁弹层
				</Button>
			</Actions>
			<Log :list="logs.c2.list" />
		</section>

		<!-- C3 -->
		<section class="timer-demo__case" data-case="c3">
			<h4>C3. click（非 hover）打开后，定时器 500ms 移除 triggerEl</h4>
			<p>手动：点击下方节点打开弹层，500ms 后节点被移除；随后滚动页面，观察弹层位置</p>
			<p>期望：弹层关闭并销毁</p>
			<p class="timer-demo__verdict is-fixed">结论：已修复（同 C1）</p>
			<div class="timer-demo__slot">
				<span
					v-if="c3Show"
					ref="c3Ref"
					class="timer-demo__trigger"
					@click="e => openC('c3', e.currentTarget, { hover: false }, 500)"
				>点击（500ms 后移除）</span>
				<span v-else>（节点已移除）</span>
			</div>
			<Actions :result="results.c3" @run="runC3" @clear="clear('c3')">
				<Button size="small" @click="resetC('c3')">
					恢复节点并销毁弹层
				</Button>
			</Actions>
			<Log :list="logs.c3.list" />
		</section>

		<!-- C4 -->
		<section class="timer-demo__case" data-case="c4">
			<h4>C4. 列表按 key 重新渲染：triggerEl 被同位置的新节点替换</h4>
			<p>手动：悬停任一项打开弹层，500ms 后列表刷新（key 变化，节点被替换）</p>
			<p>期望：旧弹层关闭</p>
			<p class="timer-demo__verdict is-fixed">结论：已修复（同 C1）——表格 / 列表刷新数据时最常见</p>
			<div class="timer-demo__slot timer-demo__list">
				<span
					v-for="item in c4List"
					:key="item.key"
					class="timer-demo__trigger"
					@mouseenter="e => openC('c4', e.currentTarget, {}, 500)"
				>{{ item.label }}</span>
			</div>
			<Actions :result="results.c4" @run="runC4" @clear="clear('c4')">
				<Button size="small" @click="resetC('c4')">
					销毁弹层
				</Button>
			</Actions>
			<Log :list="logs.c4.list" />
		</section>

		<!-- C5 -->
		<section class="timer-demo__case" data-case="c5">
			<h4>C5. 对照：Popover 组件本身被 v-if 卸载</h4>
			<p>手动：悬停按钮打开弹层，500ms 后 Popover 组件被卸载</p>
			<p>期望：弹层销毁</p>
			<p class="timer-demo__verdict is-ok">结论：对照，无问题</p>
			<div class="timer-demo__slot">
				<Popover
					v-if="c5Show"
					ref="c5Ref"
					trigger="hover"
					content="C5 弹层"
					portal-class="timer-demo__c5"
					@visible-change="v => v && removeLater('c5', 500)"
				>
					<Button>悬停（500ms 后卸载 Popover）</Button>
				</Popover>
				<span v-else>（Popover 已卸载）</span>
			</div>
			<Actions :result="results.c5" @run="runC5" @clear="clear('c5')">
				<Button size="small" @click="c5Show = true">
					重新挂载
				</Button>
			</Actions>
			<Log :list="logs.c5.list" />
		</section>

		<!-- C6 -->
		<section class="timer-demo__case" data-case="c6">
			<h4>C6. 同一 triggerEl 在 mouseover 中重复调用 Popover.open（Text 组件的用法）</h4>
			<p>手动：在下方文字上来回移动（经过不同的子节点），观察弹层入场动画是否反复重播</p>
			<p>期望：弹层只创建 1 次</p>
			<p class="timer-demo__verdict is-wontfix">结论：不处理——调用方用法问题，改用 mouseenter 即可（见右侧对照）</p>
			<div class="timer-demo__slot timer-demo__list">
				<span>mouseover（Text 当前写法）：</span>
				<span
					ref="c6Ref"
					class="timer-demo__trigger timer-demo__c6"
					@mouseover="e => openC6(e, 'over')"
				><span>文字 A</span> <span>文字 B</span> <span>文字 C</span></span>
				<span>对照 mouseenter：</span>
				<span
					ref="c6EnterRef"
					class="timer-demo__trigger timer-demo__c6"
					@mouseenter="e => openC6(e, 'enter')"
				><span>文字 A</span> <span>文字 B</span> <span>文字 C</span></span>
			</div>
			<Actions :result="results.c6" @run="runC6" @clear="clear('c6')">
				<Button size="small" @click="resetC('c6')">
					销毁弹层
				</Button>
			</Actions>
			<Log :list="logs.c6.list" />
		</section>
	</div>
</template>

<script setup lang="jsx">
import { ref, reactive, computed, nextTick, defineComponent } from 'vue';
import { Popover } from '..';
import { Button } from '../../button';
import { Portal } from '../../portal';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const createLog = () => {
	let start = 0;
	const list = ref([]);
	return {
		list,
		push(text) {
			const now = performance.now();
			start = list.value.length ? start : now;
			list.value.push(`[+${Math.round(now - start)}ms] ${text}`);
		},
		clear() {
			list.value = [];
		}
	};
};

const Log = defineComponent({
	props: {
		state: {
			type: Boolean,
			default: undefined
		},
		list: Array
	},
	setup(props) {
		return () => (
			<div class="timer-demo__log">
				{
					typeof props.state === 'boolean' && (
						<div>
							v-model:
							<b data-state>{ String(props.state) }</b>
						</div>
					)
				}
				<pre data-log>{ props.list.join('\n') || '（无记录）' }</pre>
			</div>
		);
	}
});

const Actions = defineComponent({
	props: {
		result: [Object, Array]
	},
	emits: ['run', 'clear'],
	setup(props, { emit, slots }) {
		// 不处理的场景以灰色显示，前缀“不处理”
		const getClass = item => (item.wontfix ? 'is-wontfix' : item.pass ? 'is-pass' : 'is-fail');
		return () => (
			<div class="timer-demo__actions">
				<div class="timer-demo__buttons">
					<Button type="primary" size="small" onClick={() => emit('run')}>自动复现</Button>
					<Button size="small" onClick={() => emit('clear')}>清空日志</Button>
					{ slots.default?.() }
				</div>
				{
					props.result && [].concat(props.result).map(item => (
						<div
							key={item.label || 'result'}
							data-result={item.pass ? 'pass' : 'fail'}
							data-wontfix={item.wontfix ? '' : void 0}
							class={['timer-demo__result', getClass(item)]}
						>
							{ `${item.wontfix ? '不处理｜' : ''}${item.label ? `${item.label}｜` : ''}期望：${item.expected}；实际：${item.actual}` }
						</div>
					))
				}
			</div>
		);
	}
});

const logs = reactive({
	b1: createLog(),
	b2: createLog(),
	b3: createLog(),
	c1: createLog(),
	c2: createLog(),
	c3: createLog(),
	c4: createLog(),
	c5: createLog(),
	c6: createLog()
});
const results = reactive({ b1: null, b2: null, b3: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null });

const clear = (key) => {
	logs[key].clear();
	results[key] = null;
};

// 弹层是否可见：离场动画结束后才会 display: none
const isShown = (cls) => {
	const el = document.querySelector(`.${cls}`);
	return !!el && el.style.display !== 'none';
};

const fire = (el, type) => el.dispatchEvent(new MouseEvent(type));

const b1Ref = ref();
const b1 = ref(false);
const runB1 = async () => {
	clear('b1');
	b1.value = false;
	await sleep(400);
	const el = b1Ref.value.$el;

	logs.b1.push('mouseenter');
	fire(el, 'mouseenter');
	await sleep(300);
	logs.b1.push('mouseleave');
	fire(el, 'mouseleave');
	await sleep(100);
	logs.b1.push('mouseenter（移回，鼠标停留）');
	fire(el, 'mouseenter');
	await sleep(400);

	const shown = isShown('timer-demo__b1');
	logs.b1.push(`检查：v-model=${b1.value}，弹层${shown ? '可见' : '不可见'}`);
	results.b1 = {
		expected: '保持打开',
		actual: shown ? '保持打开' : '已关闭',
		pass: shown
	};
};

const b2Ref = ref();
const b2 = ref(false);
const b2Mounted = ref(true);
const b2UnmountOnLeave = ref(false);
let b2AfterUnmount = 0;
const unmountB2 = () => {
	b2Mounted.value = false;
	logs.b2.push('卸载 Popover');
};
const runB2 = async () => {
	clear('b2');
	b2.value = false;
	b2Mounted.value = true;
	await nextTick();
	await sleep(400);
	const el = b2Ref.value.$el;

	logs.b2.push('mouseenter');
	fire(el, 'mouseenter');
	await sleep(300);
	logs.b2.push('mouseleave');
	fire(el, 'mouseleave');
	unmountB2();
	b2AfterUnmount = logs.b2.list.length;
	await sleep(400);

	const stale = logs.b2.list.slice(b2AfterUnmount);
	logs.b2.push(`检查：卸载后收到 ${stale.length} 条事件，v-model=${b2.value}`);
	results.b2 = {
		expected: '卸载后无事件',
		actual: stale.length ? `卸载后收到 ${stale.length} 条事件，v-model 被改为 ${b2.value}` : '卸载后无事件',
		pass: !stale.length
	};
};

const b3Ref = ref();
const b3 = ref(false);
const runB3 = async () => {
	clear('b3');
	b3.value = false;
	await sleep(400);
	const el = b3Ref.value.$el;

	logs.b3.push('mouseenter');
	fire(el, 'mouseenter');
	await sleep(300);
	logs.b3.push('mouseleave');
	fire(el, 'mouseleave');
	await sleep(50);
	logs.b3.push('外部 v-model = false');
	b3.value = false;
	await sleep(50);
	logs.b3.push('外部 v-model = true');
	b3.value = true;
	await sleep(400);

	const shown = isShown('timer-demo__b3');
	logs.b3.push(`检查：v-model=${b3.value}，弹层${shown ? '可见' : '不可见'}`);
	results.b3 = {
		expected: '保持打开',
		actual: shown ? '保持打开' : '已关闭',
		pass: shown,
		wontfix: true
	};
};

// ---------- C. Popover.open ----------
// 弹层当前状态：实例是否仍登记在 Portal、节点是否在 DOM、是否可见、位置
const inspect = (name, cls) => {
	const el = document.querySelector(`.${cls}`);
	const rect = el?.getBoundingClientRect();
	return {
		alive: name ? Portal.leafs.has(name) : undefined,
		inDom: !!el,
		shown: isShown(cls),
		inViewport: !!rect && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth,
		rect: rect ? `(${Math.round(rect.left)}, ${Math.round(rect.top)}) ${Math.round(rect.width)}×${Math.round(rect.height)}` : '-'
	};
};
const describeState = (s) => {
	const alive = typeof s.alive === 'boolean' ? `实例${s.alive ? '仍在' : '已销毁'}，` : '';
	const where = s.inDom ? `，位置 ${s.rect}${s.inViewport ? '（视口内）' : '（视口外）'}` : '';
	return `${alive}DOM ${s.inDom ? '存在' : '不存在'}，${s.shown ? '可见' : '不可见'}${where}`;
};

const c1Show = ref(true);
const c2Show = ref(true);
const c3Show = ref(true);
const c4Version = ref(0);
const c4List = computed(() => ['甲', '乙', '丙'].map(label => ({ key: `${label}-${c4Version.value}`, label })));
const c5Show = ref(true);
const c1Ref = ref();
const c2Ref = ref();
const c3Ref = ref();
const c5Ref = ref();

const cName = id => `timer-demo-${id}`;
const cClass = id => `timer-demo__${id}`;

// 移除触发节点：C1~C3 为 v-if，C4 为 key 变化后列表重建，C5 为卸载 Popover 组件
const removeTrigger = (id) => {
	const map = {
		c1: () => (c1Show.value = false),
		c2: () => (c2Show.value = false),
		c3: () => (c3Show.value = false),
		c4: () => (c4Version.value++),
		c5: () => (c5Show.value = false)
	};
	map[id]?.();
	logs[id].push(id === 'c4' ? '定时器：列表刷新（triggerEl 被替换）' : id === 'c5' ? '定时器：卸载 Popover 组件' : '定时器：移除 triggerEl');
};

const timers = {};
const removeLater = (id, delay) => {
	clearTimeout(timers[id]);
	timers[id] = setTimeout(() => removeTrigger(id), delay);
};

const openC = (id, el, options = {}, removeDelay) => {
	logs[id].push(`Popover.open（${options.hover === false ? 'click' : 'hover'}）`);
	Popover.open({
		el: document.body,
		name: cName(id),
		triggerEl: el,
		hover: true,
		placement: 'bottom',
		portalClass: cClass(id),
		content: `${id.toUpperCase()} 弹层`,
		...options
	});
	removeDelay && removeLater(id, removeDelay);
};

const shows = { c1: c1Show, c2: c2Show, c3: c3Show, c5: c5Show };
const resetC = (id) => {
	clearTimeout(timers[id]);
	Portal.leafs.get(cName(id))?.destroy();
	shows[id] && (shows[id].value = true);
};

const prepare = async (id) => {
	clear(id);
	resetC(id);
	await nextTick();
	await sleep(300);
};

const report = (id, expected, actual, pass) => {
	logs[id].push(`检查：${actual}`);
	results[id] = { expected, actual, pass };
};

const runC1 = async () => {
	await prepare('c1');
	fire(c1Ref.value, 'mouseenter');
	await sleep(500 + 500);
	const s = inspect(cName('c1'), cClass('c1'));
	report('c1', '弹层关闭并销毁', describeState(s), !s.alive && !s.inDom);
};

const runC2 = async () => {
	await prepare('c2');
	fire(c2Ref.value, 'mouseenter');
	await sleep(300);
	logs.c2.push('mouseleave');
	fire(c2Ref.value, 'mouseleave');
	await sleep(700);
	const s = inspect(cName('c2'), cClass('c2'));
	report('c2', '弹层关闭并销毁', describeState(s), !s.alive && !s.inDom);
};

const runC3 = async () => {
	await prepare('c3');
	c3Ref.value.click();
	await sleep(500 + 500);
	const s1 = inspect(cName('c3'), cClass('c3'));
	logs.c3.push('document scroll');
	document.dispatchEvent(new Event('scroll'));
	await sleep(200);
	const s2 = inspect(cName('c3'), cClass('c3'));
	const afterScroll = s2.inDom ? `位置 ${s2.rect}${s2.inViewport ? '（视口内）' : '（视口外）'}` : 'DOM 不存在';
	report('c3', '弹层关闭并销毁', `移除后：${describeState(s1)}；滚动后：${afterScroll}`, !s1.alive && !s1.inDom);
};

const runC4 = async () => {
	await prepare('c4');
	const el = document.querySelector('[data-case="c4"] .timer-demo__trigger');
	fire(el, 'mouseenter');
	await sleep(500 + 500);
	const s = inspect(cName('c4'), cClass('c4'));
	report('c4', '旧弹层关闭', `${describeState(s)}；旧 triggerEl ${el.isConnected ? '仍在文档中' : '已脱离文档'}`, !s.alive && !s.inDom);
};

const runC5 = async () => {
	clear('c5');
	c5Show.value = true;
	await nextTick();
	await sleep(300);
	logs.c5.push('mouseenter');
	fire(c5Ref.value.$el, 'mouseenter');
	await sleep(500 + 500);
	const s = inspect('', cClass('c5'));
	report('c5', '弹层销毁', describeState(s), !s.inDom);
};

// C6：mouseover 经过每个子节点都会触发，每次都调用 Popover.open（同名、同 triggerEl）；mouseenter 只在进入根节点时触发一次
const c6Ref = ref();
const c6EnterRef = ref();
const c6Count = { over: { calls: 0, created: 0 }, enter: { calls: 0, created: 0 } };
const openC6 = (e, type) => {
	const count = c6Count[type];
	count.calls++;
	logs.c6.push(`${e.type}（${e.target.textContent.trim()}）→ Popover.open`);
	Popover.open({
		el: document.body,
		name: cName('c6'),
		triggerEl: e.currentTarget,
		hover: true,
		placement: 'bottom',
		portalClass: cClass('c6'),
		content: 'C6 弹层',
		onReady: () => count.created++
	});
};
// 模拟鼠标从左到右经过三个子节点
const passOver = async (root) => {
	for (const span of root.querySelectorAll('span')) {
		span.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		await sleep(100);
	}
	await sleep(400);
};
const runC6 = async () => {
	await prepare('c6');
	Object.values(c6Count).forEach(i => Object.assign(i, { calls: 0, created: 0 }));

	await passOver(c6Ref.value);
	resetC('c6');
	await sleep(300);

	fire(c6EnterRef.value, 'mouseenter');
	await passOver(c6EnterRef.value);

	const { over, enter } = c6Count;
	results.c6 = [
		{ label: 'mouseover', expected: '只创建 1 次', actual: `调用 ${over.calls} 次，创建 ${over.created} 次`, pass: over.created === 1, wontfix: true },
		{ label: '对照 mouseenter', expected: '只创建 1 次', actual: `调用 ${enter.calls} 次，创建 ${enter.created} 次`, pass: enter.created === 1 }
	];
	logs.c6.push(`检查：mouseover 创建 ${over.created} 次；mouseenter 创建 ${enter.created} 次`);
};
</script>

<style lang="scss">
.timer-demo {
	padding: 40px;

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

		p {
			margin: 4px 0;
		}
	}

	&__slot {
		display: inline-block;
		padding: 8px 0;
	}

	&__list {
		display: flex;
		gap: 8px;
	}

	&__trigger {
		display: inline-block;
		padding: 4px 12px;
		border: 1px dashed #999;
		border-radius: 4px;
		cursor: default;
	}

	&__actions {
		margin-top: 12px;
	}

	&__buttons {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	&__result {
		font-size: 12px;

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

	&__log pre {
		min-height: 20px;
		margin: 4px 0;
		padding: 8px;
		background: #f5f5f5;
		font-size: 12px;
		white-space: pre-wrap;
	}
}
</style>
