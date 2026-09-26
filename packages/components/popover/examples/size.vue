<template>
	<div class="size-demo">
		<p class="size-demo__tip">
			弹层内容的宽高超出屏幕时的表现。“自动复现”先把触发器滚动到指定位置再打开弹层，稳定后测量：
			弹层（内容区）是否完整在视口内（四周留 8px）、超出的内容能否滚动查看、箭头是否落在触发器范围内、是否盖住触发器。
		</p>
		<p class="size-demo__legend">结论：<b>已修复</b> = 本次已修复；<b>无问题</b> = 对照组</p>

		<!-- S1 -->
		<section class="size-demo__case" data-case="s1">
			<h4>S1. 纵向超长（Popover.open，bottom，100 行）</h4>
			<p>自动：触发器分别位于视口顶部附近、视口中部时打开（同 index.vue 的“无需插槽，动态创建”）</p>
			<p>期望：弹层完整在视口内（放不下时按所在一侧的可用空间限制高度，另一侧更宽裕时先翻转），内容可滚动查看</p>
			<p class="size-demo__verdict is-fixed">结论：已修复——按实际方向所在一侧的可用空间限制内容区高度（先按内容的实际尺寸判断是否翻转），超出时内容区滚动</p>
			<Button ref="s1Ref" @click="e => { openRows(e.currentTarget, 'bottom') }">
				打开
			</Button>
			<Actions :results="results.s1" @run="runS1" />
		</section>

		<!-- S2 -->
		<section class="size-demo__case" data-case="s2">
			<h4>S2. 不可断行的长串（Popover.open，top，600 个字符）</h4>
			<p>期望：宽度不超过视口，长串在宽度内换行，弹层完整在视口内（四周留 8px）</p>
			<p class="size-demo__verdict is-fixed">结论：已修复——内容区最大宽度为视口宽减两侧留白，overflow-wrap: break-word 让长串在宽度内换行</p>
			<div class="size-demo__center">
				<Button ref="s2Ref" @click="e => { openText(e.currentTarget, 'top', LONG_WORD) }">
					打开
				</Button>
			</div>
			<Actions :results="results.s2" @run="runS2" />
		</section>

		<!-- S3 -->
		<section class="size-demo__case" data-case="s3">
			<h4>S3. 可断行的长文本（Popover.open，top，中英文混排）</h4>
			<p>期望：宽度不超过视口，弹层完整在视口内（四周留 8px）</p>
			<p class="size-demo__verdict is-fixed">结论：已修复——同 S2</p>
			<div class="size-demo__center">
				<Button ref="s3Ref" @click="e => { openText(e.currentTarget, 'top', LONG_TEXT) }">
					打开
				</Button>
			</div>
			<Actions :results="results.s3" @run="runS3" />
		</section>

		<!-- S4 -->
		<section class="size-demo__case" data-case="s4">
			<h4>S4. 触发器距视口左 / 右边缘约 100px，超宽的长文本（Popover.open，bottom）</h4>
			<p>期望：弹层完整在视口内（位置被修正时仍如此），箭头落在触发器范围内</p>
			<p class="size-demo__verdict is-fixed">结论：已修复——交叉轴两侧都修正到视口内，位置被修正后箭头指向触发器中心</p>
			<div class="size-demo__edges">
				<Button ref="s4LeftRef" @click="e => { openWide(e.currentTarget) }">
					靠左
				</Button>
				<Button ref="s4RightRef" @click="e => { openWide(e.currentTarget) }">
					靠右
				</Button>
			</div>
			<Actions :results="results.s4" @run="runS4" />
		</section>

		<!-- S5 -->
		<section class="size-demo__case" data-case="s5">
			<h4>S5. left / right 方向的超高内容（Popover.open，right，100 行）</h4>
			<p>期望：弹层完整在视口内，内容可滚动查看，箭头落在触发器范围内</p>
			<p class="size-demo__verdict is-fixed">结论：已修复——左右方向的高度上限为视口高减留白，上下位置修正到视口内，箭头指向触发器中心</p>
			<Button ref="s5Ref" @click="e => { openRows(e.currentTarget, 'right') }">
				打开
			</Button>
			<Actions :results="results.s5" @run="runS5" />
		</section>

		<!-- S6 -->
		<section class="size-demo__case" data-case="s6">
			<h4>S6. Dropdown：超长菜单（60 项）与未超出时的 portal=false 子菜单</h4>
			<p>期望：超长菜单完整在视口内并可滚动；短菜单中的 portal=false 子菜单正常显示、不被裁剪（对照）</p>
			<p class="size-demo__verdict is-fixed">
				结论：超长菜单已修复（同 S1）；子菜单为对照，无问题——未达到上限时内容区保持 overflow 可见，portal=false 的子菜单不被裁剪
			</p>
			<div class="size-demo__row">
				<Dropdown
					ref="s6LongRef"
					trigger="click"
					placement="bottom-left"
					portal-class="size-demo__s6-long"
				>
					<Button>超长菜单</Button>
					<template #content>
						<DropdownMenu>
							<DropdownItem v-for="i in 60" :key="i" :value="String(i)">
								菜单项 {{ i }}
							</DropdownItem>
						</DropdownMenu>
					</template>
				</Dropdown>
				<Dropdown
					ref="s6ShortRef"
					trigger="click"
					placement="bottom-left"
					portal-class="size-demo__s6-short"
				>
					<Button>短菜单（含子菜单）</Button>
					<template #content>
						<DropdownMenu>
							<DropdownItem value="1">
								菜单项 1
							</DropdownItem>
							<Dropdown
								ref="s6SubRef"
								:portal="false"
								tag="li"
								class="vc-dropdown-item"
								placement="right"
								portal-class="size-demo__s6-sub"
								style="display: block"
							>
								<span>子菜单 ▸</span>
								<template #content>
									<DropdownMenu>
										<DropdownItem value="2-1">
											子菜单项 1
										</DropdownItem>
										<DropdownItem value="2-2">
											子菜单项 2
										</DropdownItem>
									</DropdownMenu>
								</template>
							</Dropdown>
						</DropdownMenu>
					</template>
				</Dropdown>
			</div>
			<Actions :results="results.s6" @run="runS6" />
		</section>
	</div>
</template>

<script setup lang="jsx">
import { reactive, ref, onBeforeUnmount, defineComponent } from 'vue';
import { Popover } from '..';
import { Button } from '../../button';
import { Dropdown, DropdownMenu, DropdownItem } from '../../dropdown';
import { Portal } from '../../portal';

const NAME = 'size-demo';
const POPUP_CLASS = 'size-demo__popup';
const LONG_WORD = 'A'.repeat(600);
const LONG_TEXT = '可以断行的长文本 long english words, '.repeat(60);

const GAP = 8; // 弹层与视口边缘的留白

const sleep = ms => new Promise(r => setTimeout(r, ms));
const round = v => Math.round(v);

const Actions = defineComponent({
	props: {
		results: Array
	},
	emits: ['run'],
	setup(props, { emit }) {
		return () => (
			<div class="size-demo__actions">
				<Button type="primary" size="small" onClick={() => emit('run')}>自动复现</Button>
				{
					props.results?.map(item => (
						<div
							key={item.label}
							data-result={item.pass ? 'pass' : 'fail'}
							class={['size-demo__result', item.pass ? 'is-pass' : 'is-fail']}
						>
							{ `${item.label}｜期望：${item.expected}｜实际：${item.actual}` }
						</div>
					))
				}
			</div>
		);
	}
});

const results = reactive({ s1: [], s2: [], s3: [], s4: [], s5: [], s6: [] });

// 同一时刻只保留一个弹层（同名，打开新的会销毁旧的）
// 按钮的点击回调不返回它：Button 会等待回调返回的 thenable，按钮会一直处于加载中
const open = (triggerEl, options) => Popover.open({
	el: document.body,
	name: NAME,
	triggerEl,
	portalClass: POPUP_CLASS,
	...options
});
const openRows = (triggerEl, placement) => open(triggerEl, {
	placement,
	content: () => <div>{ Array.from({ length: 100 }).map((_, i) => <div key={i}>{ `第 ${i + 1} 行` }</div>) }</div>
});
const openText = (triggerEl, placement, content) => open(triggerEl, { placement, content });
const destroy = () => Portal.leafs.get(NAME)?.destroy();
onBeforeUnmount(destroy);

/**
 * 测量弹层（内容区）与视口、触发器的关系
 * @param popup 弹层节点（.vc-popover-wrapper）
 * @param triggerEl 触发器
 * @returns 各项检查结果与描述
 */
const measure = (popup, triggerEl) => {
	if (!popup) return { ok: false, text: '弹层不存在' };
	const vw = document.documentElement.clientWidth;
	const vh = document.documentElement.clientHeight;
	const container = popup.querySelector('.vc-popover-wrapper__container');
	const c = container.getBoundingClientRect();
	const w = popup.getBoundingClientRect();
	const t = triggerEl.getBoundingClientRect();
	const inView = c.left >= GAP - 0.5 && c.top >= GAP - 0.5 && c.right <= vw - GAP + 0.5 && c.bottom <= vh - GAP + 0.5;
	// 内容超出内容区时，内容区须可滚动
	const style = getComputedStyle(container);
	const overflows = container.scrollHeight > container.clientHeight + 1 || container.scrollWidth > container.clientWidth + 1;
	const reachable = !overflows || /(auto|scroll)/.test(style.overflowY + style.overflowX);
	const covers = w.left < t.right && w.right > t.left && w.top < t.bottom && w.bottom > t.top;
	// 箭头：按实际方向，箭头中心须落在触发器范围内（*-left / *-right 方向的箭头本就不在中心）
	const arrow = popup.querySelector('.vc-popover-wrapper__arrow');
	let arrowOffset = null;
	let arrowOk = true;
	if (arrow) {
		const a = arrow.getBoundingClientRect();
		const vertical = /is-(top|bottom)-basic/.test(arrow.className);
		const [center, start, end] = vertical
			? [a.left + a.width / 2, t.left, t.right]
			: [a.top + a.height / 2, t.top, t.bottom];
		arrowOffset = center - (start + end) / 2;
		arrowOk = center >= start && center <= end;
	}
	const text = [
		`内容区 (${round(c.left)}, ${round(c.top)}) ~ (${round(c.right)}, ${round(c.bottom)}) ${round(c.width)}×${round(c.height)} / 视口 ${vw}×${vh}`,
		inView ? '在视口内' : '超出视口（或未留 8px）',
		overflows ? (reachable ? '可滚动' : '超出部分无法查看') : '内容未超出',
		arrowOffset === null ? '' : `箭头距触发器中心 ${round(arrowOffset)}px${arrowOk ? '' : '（在触发器范围外）'}`,
		covers ? '盖住触发器' : ''
	].filter(Boolean).join('，');
	return { ok: inView && reachable && arrowOk && !covers, inView, reachable, arrowOk, covers, text };
};

const getPopup = (cls = POPUP_CLASS) => document.querySelector(`.${cls}`);

// 触发器顶部滚到距视口顶部 top 处；top 为 'center' 时居中
const scrollTo = async (el, top) => {
	el.scrollIntoView({ block: 'center' });
	top !== 'center' && window.scrollBy(0, el.getBoundingClientRect().top - top);
	await sleep(150);
};

// 打开后等待入场动画（300ms）与尺寸回调后测量
const openAndMeasure = async (el, openFn) => {
	destroy();
	await sleep(100);
	openFn();
	await sleep(700);
	return measure(getPopup(), el);
};

/**
 * 依次把触发器滚到指定位置、打开弹层并测量
 * @param key 结果的 key
 * @param cases 场景：label、触发器 trigger（ref）、触发器顶部位置 top（默认居中）、打开方式 open、期望 expected
 */
const runCases = async (key, cases) => {
	results[key] = [];
	const list = [];
	for (const { label, trigger, top = 'center', open: openFn, expected } of cases) {
		const el = trigger.value.$el;
		await scrollTo(el, top);
		const m = await openAndMeasure(el, () => openFn(el));
		list.push({ label, expected, actual: m.text, pass: m.ok });
	}
	destroy();
	results[key] = list;
};

const s1Ref = ref();
const s2Ref = ref();
const s3Ref = ref();
const s4LeftRef = ref();
const s4RightRef = ref();
const s5Ref = ref();
const openRowsBottom = el => openRows(el, 'bottom');
const openWide = el => openText(el, 'bottom', LONG_TEXT);
const runS1 = () => runCases('s1', [
	{ label: '触发器在视口顶部附近', trigger: s1Ref, top: 80, open: openRowsBottom, expected: '在视口内，可滚动' },
	{ label: '触发器在视口中部', trigger: s1Ref, open: openRowsBottom, expected: '在视口内，可滚动' }
]);
const runS2 = () => runCases('s2', [
	{ label: '600 个字符', trigger: s2Ref, open: el => openText(el, 'top', LONG_WORD), expected: '宽度不超过视口，在视口内' }
]);
const runS3 = () => runCases('s3', [
	{ label: '中英文混排', trigger: s3Ref, open: el => openText(el, 'top', LONG_TEXT), expected: '宽度不超过视口，在视口内' }
]);
const runS4 = () => runCases('s4', [
	{ label: '靠左', trigger: s4LeftRef, open: openWide, expected: '在视口内，箭头在触发器范围内' },
	{ label: '靠右', trigger: s4RightRef, open: openWide, expected: '在视口内，箭头在触发器范围内' }
]);
const runS5 = () => runCases('s5', [
	{ label: 'right，100 行', trigger: s5Ref, open: el => openRows(el, 'right'), expected: '在视口内，可滚动，箭头在触发器范围内' }
]);

const s6LongRef = ref();
const s6ShortRef = ref();
const s6SubRef = ref();
const clickOutside = async () => {
	document.body.click();
	await sleep(400);
};
const runS6 = async () => {
	results.s6 = [];
	destroy();
	const list = [];
	const long = s6LongRef.value.$el;
	await scrollTo(long, 'center');
	await clickOutside();
	long.click();
	await sleep(700);
	const m1 = measure(getPopup('size-demo__s6-long'), long);
	list.push({ label: '超长菜单', expected: '在视口内，可滚动', actual: m1.text, pass: m1.ok });
	await clickOutside();

	const short = s6ShortRef.value.$el;
	short.click();
	await sleep(700);
	const sub = s6SubRef.value.$el;
	sub.dispatchEvent(new MouseEvent('mouseenter'));
	await sleep(700);
	const popup = getPopup('size-demo__s6-sub');
	const m2 = measure(popup, sub);
	// 子菜单中心点上的元素须属于子菜单（未被外层裁剪或遮挡）
	const r = popup?.querySelector('.vc-popover-wrapper__container').getBoundingClientRect();
	const hit = r && popup.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
	list.push({
		label: 'portal=false 子菜单（对照）',
		expected: '在视口内，未被裁剪',
		actual: `${m2.text}，${hit ? '未被裁剪' : '被裁剪或遮挡'}`,
		pass: m2.inView && !!hit
	});
	sub.dispatchEvent(new MouseEvent('mouseleave'));
	await clickOutside();
	results.s6 = list;
};
</script>

<style lang="scss">
.size-demo {
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

	&__center {
		display: flex;
		justify-content: center;
	}

	// 触发器距视口左右边缘约 100px（抵消页面与 section 的左右 padding）
	&__edges {
		display: flex;
		margin: 0 -57px;
		padding: 0 100px;
		justify-content: space-between;
	}

	&__row {
		display: flex;
		gap: 24px;
	}

	&__actions {
		margin-top: 12px;
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
