<template>
	<div class="nested-demo">
		<p class="nested-demo__tip">
			子弹层（Popover.open、内容区里的 Select / Popover）默认挂在 body 下，DOM 上不在外层的触发区或弹层内。
			以下每个场景记录外层的 visible-change，用于复现“在子弹层内操作时外层被当成点击外部 / 移出而关闭”。
		</p>
		<p class="nested-demo__legend">结论：<b>已修复</b> = 本次已修复；<b>不处理</b> = 已确认不修，自动复现结果以灰色显示；<b>无问题</b> = 对照组</p>

		<!-- A1 -->
		<section class="nested-demo__case" data-case="a1">
			<h4>A1. 触发区内的 hover 弹层（抽象自 Select 标签列表）</h4>
			<ol>
				<li>点击“打开外层”</li>
				<li>悬停右侧的“悬停”标签，弹出子弹层</li>
				<li>点击子弹层里的“内部按钮”</li>
			</ol>
			<p>期望：外层保持打开</p>
			<p class="nested-demo__verdict is-fixed">结论：已修复——与 A4 同一根因（点击区域判断）</p>
			<Popover
				v-model="a1"
				trigger="click"
				portal-class="nested-demo__a1"
				@visible-change="v => logs.a1.push(`外层 visible-change(${v})`)"
			>
				<div class="nested-demo__trigger">
					<Button>打开外层</Button>
					<span
						class="nested-demo__hover"
						@mouseenter="handleA1Enter"
					>悬停</span>
				</div>
				<template #content>
					<div class="nested-demo__content">
						外层内容
					</div>
				</template>
			</Popover>
			<Log :state="a1" :list="logs.a1.list" @clear="logs.a1.clear()" />
		</section>

		<!-- A2 -->
		<section class="nested-demo__case" data-case="a2">
			<h4>A2. 外层内容区内嵌 Select（下拉挂 body）</h4>
			<ol>
				<li>点击“打开外层”</li>
				<li>在外层内容区打开 Select，选择任一选项</li>
			</ol>
			<p>期望：外层保持打开</p>
			<p class="nested-demo__verdict is-fixed">结论：已修复——下拉挂在 body 时，在下拉中操作不再关闭外层</p>
			<Popover
				v-model="a2"
				trigger="click"
				portal-class="nested-demo__a2"
				@visible-change="v => logs.a2.push(`外层 visible-change(${v})`)"
			>
				<Button>打开外层</Button>
				<template #content>
					<div class="nested-demo__content">
						<Select
							v-model="a2Value"
							:data="cityList"
							class="nested-demo__select"
						/>
					</div>
				</template>
			</Popover>
			<Log :state="a2" :list="logs.a2.list" @clear="logs.a2.clear()" />
		</section>

		<!-- A3 -->
		<section class="nested-demo__case" data-case="a3">
			<h4>A3. 外层内容区内嵌 click Popover</h4>
			<ol>
				<li>点击“打开外层”，再点击外层内容区的“打开内层”</li>
				<li>点击内层弹层的内容</li>
			</ol>
			<p>期望：两层都保持打开（对照：内层 portal=false 时正常，dropdown 示例即用此方式绕开）</p>
			<p class="nested-demo__verdict is-fixed">结论：已修复（随 A2）——与 B4 是同一组合的 click 版，与 A2 走同一处判断</p>
			<div class="nested-demo__row">
				<Popover
					v-model="a3"
					trigger="click"
					portal-class="nested-demo__a3"
					@visible-change="v => logs.a3.push(`外层 visible-change(${v})`)"
				>
					<Button>打开外层（内层 portal）</Button>
					<template #content>
						<div class="nested-demo__content">
							<Popover
								trigger="click"
								placement="right"
								portal-class="nested-demo__a3-inner"
								@visible-change="v => logs.a3.push(`内层 visible-change(${v})`)"
							>
								<Button>打开内层</Button>
								<template #content>
									<div class="nested-demo__inner">
										内层内容（点我）
									</div>
								</template>
							</Popover>
						</div>
					</template>
				</Popover>
				<Popover
					v-model="a3Control"
					trigger="click"
					portal-class="nested-demo__a3-control"
					@visible-change="v => logs.a3.push(`对照外层 visible-change(${v})`)"
				>
					<Button>对照：内层 portal=false</Button>
					<template #content>
						<div class="nested-demo__content">
							<Popover
								:portal="false"
								trigger="click"
								placement="right"
								@visible-change="v => logs.a3.push(`对照内层 visible-change(${v})`)"
							>
								<Button>打开内层</Button>
								<template #content>
									<div class="nested-demo__inner">
										内层内容（点我）
									</div>
								</template>
							</Popover>
						</div>
					</template>
				</Popover>
			</div>
			<Log :state="a3" :list="logs.a3.list" @clear="logs.a3.clear()" />
		</section>

		<!-- A4 -->
		<section class="nested-demo__case" data-case="a4">
			<h4>A4. 真实场景：Select 下拉打开时，在 +N... 列表里点 ×</h4>
			<ol>
				<li>点击 Select 打开下拉</li>
				<li>悬停 +N...，弹出被折叠的标签列表</li>
				<li>点击列表里任一标签的 ×</li>
			</ol>
			<p>期望：标签被移除，下拉保持打开（与点击输入框内标签的 × 一致）</p>
			<p class="nested-demo__verdict is-fixed">结论：已修复——原始问题</p>
			<div class="nested-demo__select">
				<Select
					v-model="a4Value"
					:data="cityList"
					:max="99"
					@visible-change="v => logs.a4.push(`下拉 visible-change(${v})`)"
				/>
			</div>
			<div>value: {{ a4Value }}</div>
			<Button @click="a4Value = ['1', '2', '3', '4', '5', '6']">
				重置 value
			</Button>
			<Log :list="logs.a4.list" @clear="logs.a4.clear()" />
		</section>

		<!-- B4 -->
		<section class="nested-demo__case" data-case="b4">
			<h4>B4. 嵌套 hover：外层 hover 弹层内容区内嵌 hover Popover</h4>
			<ol>
				<li>悬停“悬停外层”，移入外层弹层</li>
				<li>悬停外层弹层里的“悬停内层”，再移入内层弹层</li>
			</ol>
			<p>期望：鼠标在内层弹层上时两层都保持；移到外部后两层都关闭（对照：内层 portal=false 时正常）</p>
			<p class="nested-demo__verdict is-wontfix">结论：不处理——内层使用 portal=false 即可（见右侧对照），改动最大，已确认不修</p>
			<div class="nested-demo__row">
				<Popover
					v-model="b4"
					trigger="hover"
					portal-class="nested-demo__b4"
					@visible-change="v => logs.b4.push(`外层 visible-change(${v})`)"
				>
					<Button>悬停外层（内层 portal）</Button>
					<template #content>
						<div class="nested-demo__content">
							<Popover
								trigger="hover"
								placement="right"
								portal-class="nested-demo__b4-inner"
								@visible-change="v => logs.b4.push(`内层 visible-change(${v})`)"
							>
								<Button>悬停内层</Button>
								<template #content>
									<div class="nested-demo__inner">
										内层内容
									</div>
								</template>
							</Popover>
						</div>
					</template>
				</Popover>
				<Popover
					v-model="b4Control"
					trigger="hover"
					portal-class="nested-demo__b4-control"
					@visible-change="v => logs.b4.push(`对照外层 visible-change(${v})`)"
				>
					<Button>对照：内层 portal=false</Button>
					<template #content>
						<div class="nested-demo__content">
							<Popover
								:portal="false"
								trigger="hover"
								placement="right"
								@visible-change="v => logs.b4.push(`对照内层 visible-change(${v})`)"
							>
								<Button>悬停内层</Button>
								<template #content>
									<div class="nested-demo__inner">
										内层内容
									</div>
								</template>
							</Popover>
						</div>
					</template>
				</Popover>
			</div>
			<Log :state="b4" :list="logs.b4.list" @clear="logs.b4.clear()" />
		</section>
	</div>
</template>

<script setup lang="jsx">
import { ref, reactive, defineComponent } from 'vue';
import { Popover } from '..';
import { useHoverPopover } from '../use-hover-popover';
import { Button } from '../../button';
import { Select } from '../../select';
import { cityList } from '../../select/examples/basic/data';

// 带时间戳的日志：时间相对本场景第一条记录
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
	emits: ['clear'],
	setup(props, { emit }) {
		return () => (
			<div class="nested-demo__log">
				{
					typeof props.state === 'boolean' && (
						<div>
							外层 visible:
							<b data-state>{ String(props.state) }</b>
						</div>
					)
				}
				<pre data-log>{ props.list.join('\n') || '（无记录）' }</pre>
				<Button size="small" onClick={() => emit('clear')}>清空日志</Button>
			</div>
		);
	}
});

const logs = reactive({
	a1: createLog(),
	a2: createLog(),
	a3: createLog(),
	a4: createLog(),
	b4: createLog()
});

const a1 = ref(false);
const a2 = ref(false);
const a2Value = ref('');
const a3 = ref(false);
const a3Control = ref(false);
const a4Value = ref(['1', '2', '3', '4', '5', '6']);
const b4 = ref(false);
const b4Control = ref(false);

// A1：与 SelectTags 相同，用 useHoverPopover 打开挂在 body 下的 hover 弹层
const hoverPopover = useHoverPopover();
const handleA1Enter = (e) => {
	hoverPopover.open(e.currentTarget, {
		portalClass: 'nested-demo__a1-inner',
		content: () => (
			<Button
				class="nested-demo__inner-btn"
				onClick={() => logs.a1.push('点击 内部按钮')}
			>
				内部按钮
			</Button>
		)
	});
};
</script>

<style lang="scss">
.nested-demo {
	padding: 40px;
	padding-bottom: 400px;

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

	&__case {
		margin-bottom: 32px;
		padding: 16px;
		border: 1px solid #e9e9e9;
		border-radius: 4px;

		h4 {
			margin: 0 0 8px;
		}

		ol {
			margin: 0 0 8px;
			padding-left: 20px;
		}
	}

	&__row {
		display: flex;
		gap: 24px;
	}

	&__trigger {
		display: inline-flex;
		align-items: center;
		gap: 12px;
	}

	&__hover {
		padding: 4px 8px;
		border: 1px dashed #999;
		border-radius: 4px;
		cursor: default;
	}

	&__content {
		width: 240px;
		padding: 8px 0;
	}

	&__select {
		width: 200px;
	}

	&__inner {
		width: 160px;
		padding: 16px 0;
		cursor: pointer;
	}

	&__log {
		margin-top: 12px;

		pre {
			min-height: 20px;
			margin: 4px 0;
			padding: 8px;
			background: #f5f5f5;
			font-size: 12px;
			white-space: pre-wrap;
		}
	}
}
</style>
