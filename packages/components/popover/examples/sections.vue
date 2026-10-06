<template>
	<div class="sections-demo">
		<p class="sections-demo__tip">
			浮层放不下时按所在一侧的可用空间限制高度，内容区在 Scroller 内滚动；header / footer 插槽为固定区，不随内容滚动。
			调整“行数”与窗口高度，观察内容区是否出现滚动条、固定区是否始终可见。
		</p>
		<div class="sections-demo__options">
			<span>行数</span>
			<Select v-model="rows" :data="rowOptions" style="width: 120px;" />
			<span>方向</span>
			<Select v-model="placement" :data="placementOptions" style="width: 140px;" />
		</div>

		<section class="sections-demo__case">
			<h4>1. header + content + footer</h4>
			<p>期望：标题与按钮固定，只有中间的列表滚动；滚动条贴住浮层右边缘</p>
			<Popover
				:key="placement"
				v-model="isAllVisible"
				trigger="click"
				:placement="placement"
				portal-class="is-padding-none"
			>
				<Button>打开</Button>
				<template #header>
					<div class="sections-demo__header">
						标题
					</div>
				</template>
				<template #content>
					<div class="sections-demo__list">
						<div v-for="i in rows" :key="i">
							第 {{ i }} 行内容
						</div>
					</div>
				</template>
				<template #footer>
					<div class="sections-demo__footer">
						<Button size="small" @click="isAllVisible = false">
							取消
						</Button>
						<Button type="primary" size="small" @click="isAllVisible = false">
							确定
						</Button>
					</div>
				</template>
			</Popover>
		</section>

		<section class="sections-demo__case">
			<h4>2. 只有 header</h4>
			<p>期望：标题固定，列表滚动到底时最后一行完整可见</p>
			<Popover
				:key="placement"
				trigger="click"
				:placement="placement"
				portal-class="is-padding-none"
			>
				<Button>打开</Button>
				<template #header>
					<div class="sections-demo__header">
						标题
					</div>
				</template>
				<template #content>
					<div class="sections-demo__list">
						<div v-for="i in rows" :key="i">
							第 {{ i }} 行内容
						</div>
					</div>
				</template>
			</Popover>
		</section>

		<section class="sections-demo__case">
			<h4>3. 只有 content（默认内边距）</h4>
			<p>期望：整块内容在 Scroller 内滚动，内边距随内容滚动，滚动条贴住浮层右边缘</p>
			<Popover :key="placement" trigger="click" :placement="placement">
				<Button>打开</Button>
				<template #content>
					<div v-for="i in rows" :key="i">
						第 {{ i }} 行内容
					</div>
				</template>
			</Popover>
		</section>

		<section class="sections-demo__case">
			<h4>4. 内容高度动态变化</h4>
			<p>期望：打开后点击浮层内的按钮增减行数——内容由高变低、放得下时滚动条消失，由低变高、放不下时滚动条出现；浮层始终完整在视口内</p>
			<Popover
				:key="placement"
				trigger="click"
				:placement="placement"
				portal-class="is-padding-none sections-demo__dynamic"
			>
				<Button>打开</Button>
				<template #header>
					<div class="sections-demo__header">
						当前 {{ dynamicRows }} 行
					</div>
				</template>
				<template #content>
					<div class="sections-demo__list">
						<div v-for="i in dynamicRows" :key="i">
							第 {{ i }} 行内容
						</div>
					</div>
				</template>
				<template #footer>
					<div class="sections-demo__footer">
						<Button size="small" @click="dynamicRows = 3">
							3 行
						</Button>
						<Button size="small" @click="dynamicRows = 60">
							60 行
						</Button>
						<Button size="small" @click="dynamicRows = Math.max(dynamicRows - 5, 0)">
							-5
						</Button>
						<Button size="small" @click="dynamicRows += 5">
							+5
						</Button>
					</div>
				</template>
			</Popover>
		</section>
		<section class="sections-demo__case">
			<h4>5. scrollerOptions：限定内容区高度</h4>
			<p>期望：内容区最高 160px 并始终显示自绘滚动条（maxHeight + always；always 在各系统下都使用自绘滚动条）；浮层可用空间不足 160px 时仍按可用空间收缩</p>
			<Popover
				:key="placement"
				trigger="click"
				:placement="placement"
				portal-class="is-padding-none sections-demo__limited"
				:scroller-options="{ maxHeight: 160, always: true }"
			>
				<Button>打开</Button>
				<template #content>
					<div class="sections-demo__list">
						<div v-for="i in rows" :key="i">
							第 {{ i }} 行内容
						</div>
					</div>
				</template>
			</Popover>
		</section>

		<section class="sections-demo__case">
			<h4>6. scrollable=false：内容自行滚动</h4>
			<p>期望：两列各自滚动、互不影响；浮层仍完整在视口内，标题固定</p>
			<Popover
				:key="placement"
				trigger="click"
				:placement="placement"
				:scrollable="false"
				portal-class="is-padding-none sections-demo__custom"
			>
				<Button>打开</Button>
				<template #header>
					<div class="sections-demo__header">
						标题
					</div>
				</template>
				<template #content>
					<div class="sections-demo__columns">
						<Scroller v-for="column in 2" :key="column" class="sections-demo__column">
							<div v-for="i in rows" :key="i">
								第 {{ column }} 列 {{ i }}
							</div>
						</Scroller>
					</div>
				</template>
			</Popover>
		</section>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Popover } from '..';
import { Button } from '../../button';
import { Select } from '../../select';
import { Scroller } from '../../scroller';

const rows = ref(60);
const rowOptions = [5, 20, 60, 200].map(value => ({ value, label: `${value} 行` }));
const placement = ref('bottom-left');
const placementOptions = ['bottom-left', 'top-left', 'right', 'left'].map(value => ({ value, label: value }));
const isAllVisible = ref(false);
const dynamicRows = ref(3);
</script>

<style lang="scss">
.sections-demo {
	padding: 40px;

	&__tip {
		color: #666;
	}

	&__options {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 24px;
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

	&__header {
		padding: 12px 16px;
		font-weight: 600;
		border-bottom: 1px solid #e9e9e9;
	}

	&__list {
		min-width: 200px;
		padding: 8px 16px;
	}

	// scrollable=false：根节点设 min-height: 0 在浮层的高度上限内收缩，由各列滚动
	&__columns {
		display: flex;
		min-height: 0;
	}

	&__column {
		min-width: 140px;
		padding: 8px 16px;
	}

	&__footer {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		padding: 12px 16px;
		border-top: 1px solid #e9e9e9;
	}
}
</style>
