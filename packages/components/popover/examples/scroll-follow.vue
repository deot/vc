<template>
	<div class="scroll-follow-demo">
		<p class="scroll-follow-demo__tip">
			弹层挂在 body 上，触发器随滚动移动时由 JS 重新定位。逐帧探针在绘制前（ResizeObserver 回调，晚于 rAF 与布局）比较弹层与触发器的相对位置，
			偏差超过 0.5px 的帧记为“错位帧”。自动复现：页面与原生容器每 8ms 滚动一次并派发 scroll（模拟 120Hz 等高刷屏上两次 scroll 间隔不足 16ms）；
			Scroller 每帧派发一次滚轮事件（滚轮驱动，滚动位置在 rAF 中写入，同 Table 表体）。
		</p>
		<p class="scroll-follow-demo__legend">
			手动：打开任一弹层后滚动，观察下方实时计数（页面须在前台，后台标签页不执行 rAF）
		</p>

		<div class="scroll-follow-demo__meter" data-meter>
			实时：错位帧 <b data-meter-bad>{{ meter.bad }}</b> / 滚动帧 <b data-meter-total>{{ meter.total }}</b>，最大偏差 {{ meter.max }}px
			<Button size="small" @click="handleResetMeter">
				清零
			</Button>
		</div>

		<!-- F1 -->
		<section class="scroll-follow-demo__case" data-case="f1">
			<h4>F1. 贴边吸附：Popover（right，100 行）贴在视口上沿，滚动页面</h4>
			<p>期望：弹层上沿始终在视口 8px 处，不随页面滚动来回跳</p>
			<p class="scroll-follow-demo__verdict is-fixed">
				结论：已修复——setPopupStyle 原先节流 16ms，高刷屏下每隔一次的计算被推迟到绘制之后（弹层先随页面移动一帧，下一次再被拉回）；
				改为每次滚动同步计算
			</p>
			<Popover
				ref="edgeRef"
				trigger="click"
				placement="right"
				:portal-class="popupClass('edge')"
			>
				<Button>打开</Button>
				<template #content>
					<div v-for="i in 100" :key="i">
						第 {{ i }} 行
					</div>
				</template>
			</Popover>
			<Actions :results="results.f1" @run="handleRunF1" />
		</section>

		<!-- F2 -->
		<section class="scroll-follow-demo__case" data-case="f2">
			<h4>F2. 组件弹层跟随滚动：Select / Cascader / DatePicker / TreeSelect / Dropdown / Popconfirm / Popover</h4>
			<p>切换滚动环境后打开任一组件的弹层再滚动；期望：每一帧弹层与触发器的相对位置都不变</p>
			<p class="scroll-follow-demo__verdict is-fixed">
				结论：已修复——原生容器：同 F1（高刷屏）；Scroller（滚轮驱动）：滚动位置在 rAF 中写入，原生 scroll 事件下一帧才派发，弹层恒定慢一帧，
				改为按根节点取回 Scroller 实例并订阅其滚动通知（见 ScrollerManager），与写入滚动位置同一帧定位
			</p>
			<p class="scroll-follow-demo__verdict">
				页面滚动为对照组，无问题：弹层挂在 body 上，随页面原生滚动，重新计算的结果不变（只有贴边修正时会抖，见 F1）
			</p>
			<div class="scroll-follow-demo__envs">
				<Button
					v-for="item in ENVS"
					:key="item.value"
					:type="env === item.value ? 'primary' : 'default'"
					:data-env="item.value"
					size="small"
					@click="env = item.value"
				>
					{{ item.label }}
				</Button>
			</div>
			<component
				:is="env === 'scroller' ? Scroller : 'div'"
				:key="env"
				ref="envRef"
				v-bind="envAttrs"
			>
				<div :class="['scroll-follow-demo__inner', `is-${env}`]">
					<div class="scroll-follow-demo__field">
						<span>Select</span>
						<Select
							:ref="el => setField('select', el)"
							v-model="values.select"
							:data="options"
							:portal-class="popupClass('select')"
						/>
					</div>
					<div class="scroll-follow-demo__field">
						<span>Cascader</span>
						<Cascader
							:ref="el => setField('cascader', el)"
							v-model="values.cascader"
							:data="treeData"
							:portal-class="popupClass('cascader')"
						/>
					</div>
					<div class="scroll-follow-demo__field">
						<span>DatePicker</span>
						<DatePicker
							:ref="el => setField('datePicker', el)"
							v-model="values.datePicker"
							:portal-class="popupClass('datePicker')"
						/>
					</div>
					<div class="scroll-follow-demo__field">
						<span>TreeSelect</span>
						<TreeSelect
							:ref="el => setField('treeSelect', el)"
							v-model="values.treeSelect"
							:data="treeData"
							:max="99"
							:portal-class="popupClass('treeSelect')"
						/>
					</div>
					<div class="scroll-follow-demo__field">
						<span>Dropdown</span>
						<Dropdown
							:ref="el => setField('dropdown', el)"
							trigger="click"
							placement="bottom-left"
							:portal-class="popupClass('dropdown')"
						>
							<Button>菜单</Button>
							<template #content>
								<DropdownMenu>
									<DropdownItem v-for="i in 6" :key="i" :value="String(i)">
										菜单项 {{ i }}
									</DropdownItem>
								</DropdownMenu>
							</template>
						</Dropdown>
					</div>
					<div class="scroll-follow-demo__field">
						<span>Popconfirm</span>
						<Popconfirm
							:ref="el => setField('popconfirm', el)"
							trigger="click"
							placement="bottom"
							title="确定删除这一项吗？"
							:portal-class="popupClass('popconfirm')"
						>
							<Button>删除</Button>
						</Popconfirm>
					</div>
					<div class="scroll-follow-demo__field">
						<span>Popover</span>
						<Popover
							:ref="el => setField('popover', el)"
							trigger="click"
							placement="bottom"
							content="弹层内容"
							:portal-class="popupClass('popover')"
						>
							<Button>打开</Button>
						</Popover>
					</div>
				</div>
			</component>
			<Actions :results="results.f2" @run="handleRunF2">
				<Button size="small" data-run-all @click="handleRunF2All">
					全部环境
				</Button>
			</Actions>
		</section>

		<!-- F3 -->
		<section class="scroll-follow-demo__case" data-case="f3">
			<h4>F3. Popover.open（hover: false）的触发器在 Scroller（滚轮驱动）内</h4>
			<p>期望：同 F2</p>
			<p class="scroll-follow-demo__verdict is-fixed">
				结论：已修复——Popover.open 没有组件上下文，改由 Scroller 在根节点登记实例，弹层按 getScroller 找到根节点后订阅其滚动通知
			</p>
			<Scroller
				ref="openScrollerRef"
				wheel
				:native="false"
				height="260px"
				class="scroll-follow-demo__box"
			>
				<div class="scroll-follow-demo__inner is-scroller">
					<Button ref="openTriggerRef" @click="handleOpenByApi()">
						Popover.open
					</Button>
				</div>
			</Scroller>
			<Actions :results="results.f3" @run="handleRunF3" />
		</section>

		<!-- F4 -->
		<section class="scroll-follow-demo__case" data-case="f4">
			<h4>F4. 嵌套 Scroller（都为滚轮驱动）：滚动外层</h4>
			<p>期望：同 F2（弹层在内层 Scroller 中，外层滚动时同样同一帧跟随）</p>
			<p class="scroll-follow-demo__verdict is-fixed">结论：已修复——滚动容器链上的每一层 Scroller 都按根节点订阅</p>
			<Scroller
				ref="outerScrollerRef"
				wheel
				:native="false"
				height="260px"
				class="scroll-follow-demo__box"
			>
				<div class="scroll-follow-demo__inner is-scroller">
					<Scroller
						wheel
						:native="false"
						height="200px"
						class="scroll-follow-demo__box is-inner"
					>
						<div class="scroll-follow-demo__inner is-nested">
							<Popover
								ref="nestedRef"
								trigger="click"
								placement="bottom"
								content="弹层内容"
								:portal-class="popupClass('nested')"
							>
								<Button>打开</Button>
							</Popover>
						</div>
					</Scroller>
				</div>
			</Scroller>
			<Actions :results="results.f4" @run="handleRunF4" />
		</section>
	</div>
</template>

<script setup lang="jsx">
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref, nextTick } from 'vue';
import { Resize } from '@deot/helper-resize';
import { Popover } from '..';
import { Button } from '../../button';
import { Select } from '../../select';
import { Cascader } from '../../cascader';
import { DatePicker } from '../../date-picker';
import { TreeSelect } from '../../tree';
import { Dropdown, DropdownMenu, DropdownItem } from '../../dropdown';
import { Popconfirm } from '../../popconfirm';
import { Scroller } from '../../scroller';
import { Portal } from '../../portal';

const POPUP_CLASS = 'scroll-follow-demo__popup';
const API_NAME = 'scroll-follow-demo-open';
const TOLERANCE = 0.5; // 偏差超过该值（px）记为错位

const ENVS = [
	{ value: 'page', label: '页面滚动' },
	{ value: 'native', label: '原生容器（overflow: auto）' },
	{ value: 'scroller', label: 'Scroller（滚轮驱动，同 Table 表体）' }
];
const FIELDS = [
	{ key: 'select', label: 'Select' },
	{ key: 'cascader', label: 'Cascader' },
	{ key: 'datePicker', label: 'DatePicker' },
	{ key: 'treeSelect', label: 'TreeSelect' },
	{ key: 'dropdown', label: 'Dropdown' },
	{ key: 'popconfirm', label: 'Popconfirm' },
	{ key: 'popover', label: 'Popover' }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const round = v => Math.round(v * 10) / 10;
const popupClass = key => `${POPUP_CLASS}-${key}`;
// 打开中的弹层（关闭动画结束前 display 仍可能为空，按 v-show 的 display 判断）
const getPopup = (key) => {
	const el = document.querySelector(`.${popupClass(key)}`);
	return el && el.style.display !== 'none' ? el : null;
};

const options = Array.from({ length: 20 }).map((_, i) => ({ value: `${i}`, label: `选项 ${i + 1}` }));
const treeData = ['分组 A', '分组 B', '分组 C'].map((region, i) => ({
	value: `${i}`,
	label: `${region}`,
	children: ['条目一', '条目二', '条目三'].map((dept, j) => ({
		value: `${i}-${j}`,
		label: `${dept}`
	}))
}));
const values = reactive({ select: '', cascader: [], datePicker: '', treeSelect: [] });

const env = ref('page');
const envRef = ref();
const envAttrs = computed(() => {
	if (env.value === 'scroller') {
		// 须显式 native=false：覆盖式滚动条下 native 默认为 true，不走滚轮驱动
		return { wheel: true, native: false, height: '260px', class: 'scroll-follow-demo__box' };
	}
	return env.value === 'native' ? { class: 'scroll-follow-demo__box is-native' } : {};
});

const fields = {};
const setField = (key, instance) => {
	fields[key] = instance;
};

/**
 * 逐帧探针：1px 的节点每个 rAF 切换宽度，ResizeObserver 回调在 rAF 与布局之后、绘制之前执行，
 * 此时读到的几何信息就是即将绘制的一帧
 */
const frameHooks = new Set();
let stopProbe;
const startProbe = () => {
	const el = document.createElement('div');
	el.style.cssText = 'position: fixed; top: 0; left: 0; width: 1px; height: 1px; visibility: hidden; pointer-events: none;';
	document.body.appendChild(el);
	const offResize = Resize.on(el, () => frameHooks.forEach(fn => fn()));
	let id;
	let isFlipped = false;
	const tick = () => {
		isFlipped = !isFlipped;
		el.style.width = isFlipped ? '2px' : '1px';
		id = requestAnimationFrame(tick);
	};
	id = requestAnimationFrame(tick);
	return () => {
		cancelAnimationFrame(id);
		offResize();
		el.remove();
	};
};

/**
 * 弹层位置的采样值
 * 	- follow：相对触发器的偏移（跟随时应不变）
 * 	- edge：视口中的位置（贴边吸附时应不变）
 * @param mode ~
 * @param triggerEl ~
 * @param popupEl ~
 * @returns ~
 */
const readOffset = (mode, triggerEl, popupEl) => {
	const t = triggerEl.getBoundingClientRect();
	const p = popupEl.getBoundingClientRect();
	return {
		trigger: { x: t.left, y: t.top },
		offset: mode === 'edge' ? { x: p.left, y: p.top } : { x: p.left - t.left, y: p.top - t.top }
	};
};
const getDeviation = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

// 统计触发器移动了的帧（滚动帧）中，弹层偏离基准的帧（错位帧）
const createStat = () => ({ total: 0, bad: 0, max: 0 });
const record = (stat, deviation) => {
	stat.total++;
	deviation > TOLERANCE && stat.bad++;
	stat.max = Math.max(stat.max, round(deviation));
};

// 自动复现：开始时的位置为基准
const measure = (mode, triggerEl, popupEl) => {
	const stat = createStat();
	const base = readOffset(mode, triggerEl, popupEl);
	let last = base.trigger;
	const hook = () => {
		const current = readOffset(mode, triggerEl, popupEl);
		const moved = getDeviation(current.trigger, last) > 0;
		last = current.trigger;
		moved && record(stat, getDeviation(current.offset, base.offset));
	};
	frameHooks.add(hook);
	return () => {
		frameHooks.delete(hook);
		return stat;
	};
};

/**
 * 实时计数（手动滚动）：静止的帧更新基准（打开、翻转、贴边修正后的位置），移动的帧与基准比较
 */
const meter = reactive(createStat());
const handleResetMeter = () => Object.assign(meter, createStat());
let meterState;
const getOpened = () => {
	if (getPopup('edge')) return { mode: 'edge', key: 'edge', triggerEl: edgeRef.value?.$el };
	if (getPopup('api')) return { mode: 'follow', key: 'api', triggerEl: openTriggerRef.value?.$el };
	if (getPopup('nested')) return { mode: 'follow', key: 'nested', triggerEl: nestedRef.value?.$el };
	const field = FIELDS.find(({ key }) => getPopup(key) && fields[key]?.$el);
	return field && { mode: 'follow', key: field.key, triggerEl: fields[field.key].$el };
};
const meterHook = () => {
	const opened = getOpened();
	if (!opened?.triggerEl) return (meterState = null);
	const current = readOffset(opened.mode, opened.triggerEl, getPopup(opened.key));
	if (!meterState || meterState.key !== opened.key) {
		meterState = { key: opened.key, base: current.offset, last: current.trigger };
		return;
	}
	const moved = getDeviation(current.trigger, meterState.last) > 0;
	meterState.last = current.trigger;
	moved ? record(meter, getDeviation(current.offset, meterState.base)) : (meterState.base = current.offset);
};

onMounted(() => {
	stopProbe = startProbe();
	frameHooks.add(meterHook);
});
onBeforeUnmount(() => {
	stopProbe?.();
	frameHooks.clear();
	Portal.leafs.get(API_NAME)?.destroy();
});

/**
 * 滚动驱动
 * 	- 页面 / 原生容器：每 8ms 滚动 2px 并派发 scroll（模拟高刷屏：两次 scroll 间隔不足 16ms），先 30 次反向再 30 次正向
 * 	- Scroller（滚轮驱动）：每帧派发一次滚轮事件（同触控板），由 Scroller 在 rAF 中写入滚动位置
 */
const STEPS = 30;
const STEP = 2;
const driveScroll = async (target) => {
	const isPage = target === window;
	const eventTarget = isPage ? document : target;
	for (let i = 0; i < STEPS * 2; i++) {
		const delta = i < STEPS ? -STEP : STEP;
		isPage ? window.scrollBy(0, delta) : (target.scrollTop += delta);
		eventTarget.dispatchEvent(new Event('scroll'));
		await sleep(8);
	}
	await sleep(100);
};
const driveWheel = async (target) => {
	for (let i = 0; i < STEPS * 2; i++) {
		const deltaY = i < STEPS ? -STEP : STEP;
		target.dispatchEvent(new WheelEvent('wheel', { deltaY, deltaMode: 0, bubbles: true, cancelable: true }));
		await new Promise(r => requestAnimationFrame(r));
	}
	await sleep(100);
};

// 点击空白处关闭所有 click 弹层，等关闭动画结束
const closeAll = async () => {
	document.body.click();
	Portal.leafs.get(API_NAME)?.destroy();
	await sleep(300);
};

const formatStat = stat => `错位帧 ${stat.bad} / 滚动帧 ${stat.total}，最大偏差 ${stat.max}px`;
const toResult = (label, stat) => ({
	label,
	expected: '错位帧 0',
	actual: stat.total ? formatStat(stat) : '没有滚动帧（弹层未打开或未滚动）',
	pass: !!stat.total && !stat.bad
});
const toFailure = (label, actual) => ({ label, expected: '错位帧 0', actual, pass: false });

/**
 * 自动复现一个用例：定位 → 打开 → 逐帧测量滚动 → 关闭
 * @param options ~
 * @param options.label 结果标签
 * @param options.key 弹层（见 popupClass）
 * @param options.triggerEl 触发器
 * @param options.place 把触发器放到固定位置
 * @param options.open 打开弹层，默认点击触发器
 * @param options.drive 滚动驱动
 * @param options.mode 采样方式，见 readOffset
 * @param options.check 打开后、滚动前的额外检查，返回结果行
 * @returns 结果行
 */
const runCase = async ({ label, key, triggerEl, place, open = () => triggerEl.click(), drive, mode = 'follow', check = () => [] }) => {
	await closeAll();
	if (!triggerEl) return [toFailure(label, '触发器未渲染')];

	await place();
	open();
	await sleep(600);
	const popupEl = getPopup(key);
	if (!popupEl) return [toFailure(label, '弹层未打开')];

	const extra = check(popupEl);
	const stop = measure(mode, triggerEl, popupEl);
	await drive();
	const result = toResult(label, stop());
	await closeAll();
	return [...extra, result];
};

const results = reactive({ f1: [], f2: [], f3: [], f4: [] });

// 把滚动容器滚到可视区中部，并让触发器距容器上沿 40px（下方的弹层不翻转，滚动时不会滚出容器）
const placeInScroller = async (box, triggerEl) => {
	box.wrapper.scrollIntoView({ block: 'center' });
	await sleep(50);
	box.scrollTo({ y: triggerEl.getBoundingClientRect().top - box.wrapper.getBoundingClientRect().top - 40 + box.wrapper.scrollTop });
	await sleep(100);
};

// F1
const edgeRef = ref();
const handleRunF1 = async () => {
	results.f1 = [];
	const triggerEl = edgeRef.value.$el;
	results.f1 = await runCase({
		label: '滚动页面',
		key: 'edge',
		mode: 'edge',
		triggerEl,
		place: async () => {
			triggerEl.scrollIntoView({ block: 'center' });
			await sleep(100);
		},
		check: (popupEl) => {
			const top = round(popupEl.getBoundingClientRect().top);
			return [{ label: '打开后', expected: '上沿在视口 8px 处（贴边）', actual: `上沿 ${top}px`, pass: Math.abs(top - 8) <= TOLERANCE }];
		},
		drive: () => driveScroll(window)
	});
};

// F2
const getScrollTarget = () => {
	if (env.value === 'page') return window;
	return env.value === 'scroller' ? envRef.value.wrapper : envRef.value;
};

// 把触发器放到滚动区域内的固定位置：页面为视口 35% 处，容器见 placeInScroller
const place = async (triggerEl) => {
	if (env.value === 'scroller') return placeInScroller(envRef.value, triggerEl);
	if (env.value === 'page') {
		window.scrollBy(0, triggerEl.getBoundingClientRect().top - window.innerHeight * 0.35);
	} else {
		const box = envRef.value;
		box.scrollIntoView({ block: 'center' });
		await sleep(50);
		box.scrollTop += triggerEl.getBoundingClientRect().top - box.getBoundingClientRect().top - 40;
	}
	await sleep(100);
};

const runField = ({ key, label }) => {
	const envLabel = ENVS.find(i => i.value === env.value).label;
	const triggerEl = fields[key]?.$el;
	return runCase({
		label: `${env.value === 'page' ? '对照｜' : ''}${envLabel}｜${label}`,
		key,
		triggerEl,
		place: () => place(triggerEl),
		drive: () => (env.value === 'scroller' ? driveWheel(envRef.value.content) : driveScroll(getScrollTarget()))
	});
};

const runEnv = async () => {
	for (const field of FIELDS) {
		const rows = await runField(field);
		results.f2 = [...results.f2, ...rows];
	}
};

const handleRunF2 = async () => {
	results.f2 = [];
	await runEnv();
};

const handleRunF2All = async () => {
	results.f2 = [];
	for (const item of ENVS) {
		env.value = item.value;
		await nextTick();
		await sleep(300);
		await runEnv();
	}
};

// F3
const openScrollerRef = ref();
const openTriggerRef = ref();
const handleOpenByApi = () => {
	Popover.open({
		element: document.body,
		name: API_NAME,
		triggerElement: openTriggerRef.value.$el,
		hover: false,
		placement: 'bottom',
		content: '弹层内容',
		portalClass: popupClass('api')
	});
};
const handleRunF3 = async () => {
	results.f3 = [];
	const box = openScrollerRef.value;
	const triggerEl = openTriggerRef.value.$el;
	results.f3 = await runCase({
		label: 'Scroller 滚轮滚动',
		key: 'api',
		triggerEl,
		place: () => placeInScroller(box, triggerEl),
		open: handleOpenByApi,
		drive: () => driveWheel(box.content)
	});
};

// F4
const outerScrollerRef = ref();
const nestedRef = ref();
const handleRunF4 = async () => {
	results.f4 = [];
	const box = outerScrollerRef.value;
	const triggerEl = nestedRef.value.$el;
	results.f4 = await runCase({
		label: '滚动外层 Scroller',
		key: 'nested',
		triggerEl,
		place: () => placeInScroller(box, triggerEl),
		// 滚轮事件派发到外层内容（不经过内层），由外层 Scroller 写入滚动位置
		drive: () => driveWheel(box.content)
	});
};

const Actions = defineComponent({
	props: {
		results: Array
	},
	emits: ['run'],
	setup(props, { emit, slots }) {
		return () => (
			<div class="scroll-follow-demo__actions">
				<div class="scroll-follow-demo__buttons">
					<Button type="primary" size="small" onClick={() => emit('run')}>自动复现</Button>
					{ slots.default?.() }
				</div>
				{
					props.results?.map(item => (
						<div
							key={item.label}
							data-result={item.pass ? 'pass' : 'fail'}
							class={['scroll-follow-demo__result', item.pass ? 'is-pass' : 'is-fail']}
						>
							{ `${item.label}｜期望：${item.expected}｜实际：${item.actual}` }
						</div>
					))
				}
			</div>
		);
	}
});
</script>

<style lang="scss">
.scroll-follow-demo {
	padding: 40px;
	padding-bottom: 100vh;

	&__tip {
		color: #666;
	}

	&__legend {
		font-size: 12px;
		color: #666;
	}

	&__meter {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		padding: 8px 12px;
		margin-bottom: 16px;
		font-size: 12px;
		background: #fffbe6;
		border: 1px solid #ffe58f;
		align-items: center;
		gap: 8px;
	}

	&__verdict {
		font-size: 12px;

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

	&__envs {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	&__box {
		width: 420px;
		background: #f5f5f5;

		&.is-native {
			height: 260px;
			overflow: auto;
		}

		&.is-inner {
			width: 360px;
			background: #e8e8e8;
		}
	}

	&__inner {
		display: flex;
		flex-direction: column;
		gap: 16px;

		&.is-native,
		&.is-scroller {
			padding: 120px 20px 400px;
		}

		// 触发器靠内层上沿，弹层在内层可视区内朝下打开，滚动时不翻转
		&.is-nested {
			padding: 40px 20px 400px;
		}
	}

	&__field {
		display: flex;
		align-items: center;
		gap: 12px;

		> span:first-child {
			width: 88px;
			flex-shrink: 0;
			color: #666;
		}

		> :last-child {
			width: 240px;
		}
	}

	&__actions {
		margin-top: 12px;
	}

	&__buttons {
		display: flex;
		gap: 8px;
	}

	&__result {
		margin-top: 4px;
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
