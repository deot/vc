<template>
	<div class="direction-demo">
		<p class="direction-demo__tip">
			点任一方向的按钮：弹窗从按钮的方向展开、立即弹出，关闭时缩回按钮附近。按钮离弹窗远时，第一帧和最后一帧都离开按钮 8px，按钮上不留残影；
			离得近或被弹窗盖住（Center）时，从路程 40% 处长出来。切换尺寸可以看同一个按钮离弹窗远近不同时的效果。
			Dropdown：先展开下拉菜单，再点菜单项打开弹窗，弹窗从点中的菜单项展开。
			请求后打开：点击后先显示加载中，等请求回来才打开，弹窗仍从这个按钮展开。
			定时打开：模拟定时器、推送打开的弹窗，和点击无关，传 triggerElement: null 原位淡入淡出。
		</p>
		<div class="direction-demo__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<div class="direction-demo__stage">
			<Button
				v-for="item in PLACEMENTS"
				:key="item.label"
				class="direction-demo__button"
				:style="item.style"
				@click="handleOpen(item.label)"
			>
				{{ item.label }}
			</Button>
			<!-- 先展开下拉菜单，再从菜单项打开弹窗 -->
			<Dropdown class="direction-demo__dropdown" placement="bottom-left" @click="handleMenu">
				<Button>Dropdown</Button>
				<template #content>
					<DropdownMenu>
						<DropdownItem v-for="item in MENU" :key="item" :value="item">
							{{ item }}
						</DropdownItem>
					</DropdownMenu>
				</template>
			</Dropdown>
			<!-- 点击后先请求，回来才打开：点击早已分发完 -->
			<Button class="direction-demo__request" @click="handleRequest">
				请求后打开
			</Button>
			<Button class="direction-demo__timer" @click="handleTimer">
				定时打开
			</Button>
		</div>
		<ModalView
			:key="controls.size"
			v-model="isVisible"
			:width="size.width"
			:height="size.height"
			:title="title"
			:trigger-element="triggerElement"
		>
			<p>第一行说明文字</p>
			<p>第二行说明文字，长度略长一些</p>
		</ModalView>
	</div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { Modal, ModalView } from '..';
import { Button } from '../../button';
import { Dropdown, DropdownMenu, DropdownItem } from '../../dropdown';
import { Message } from '../../message';
import { Select } from '../../select';

// 四周 12 个方向，外加正中间一个（会被弹窗最终位置盖住）
const PLACEMENTS = [
	{ label: 'TL', style: { top: 0, left: '15%' } },
	{ label: 'Top', style: { top: 0, left: '50%', transform: 'translateX(-50%)' } },
	{ label: 'TR', style: { top: 0, right: '15%' } },
	{ label: 'LT', style: { top: '20%', left: 0 } },
	{ label: 'Left', style: { top: '50%', left: 0, transform: 'translateY(-50%)' } },
	{ label: 'LB', style: { bottom: '20%', left: 0 } },
	{ label: 'RT', style: { top: '20%', right: 0 } },
	{ label: 'Right', style: { top: '50%', right: 0, transform: 'translateY(-50%)' } },
	{ label: 'RB', style: { bottom: '20%', right: 0 } },
	{ label: 'BL', style: { bottom: 0, left: '15%' } },
	{ label: 'Bottom', style: { bottom: 0, left: '50%', transform: 'translateX(-50%)' } },
	{ label: 'BR', style: { bottom: 0, right: '15%' } },
	{ label: 'Center', style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } }
];

const MENU = ['选项一', '选项二', '选项三'];

const SIZES = {
	small: { width: 360, height: 'auto' },
	medium: { width: 520, height: 300 },
	large: { width: 800, height: 480 }
};

// 对照项：每项一个 Select，尺寸切换时重新挂载
const CONTROLS = [
	{ key: 'mode', label: '打开方式', data: [{ value: 'view', label: '组件 v-model' }, { value: 'portal', label: 'Modal.info（Portal）' }] },
	{
		key: 'size',
		label: '尺寸',
		data: [{ value: 'medium', label: '520 × 300' }, { value: 'small', label: '360 × auto' }, { value: 'large', label: '800 × 480' }]
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const size = computed(() => SIZES[controls.size]);

const isVisible = ref(false);
const title = ref('');
// 不传（undefined）时取打开它的那次点击
const triggerElement = ref();

const handleMenu = (value) => {
	handleOpen(`Dropdown · ${value}`);
};

// 模拟请求：加载中 600ms
const handleRequest = async () => {
	const loading = Message.loading('加载中...');
	await new Promise(resolve => setTimeout(resolve, 600));
	loading.destroy();
	handleOpen('请求后打开');
};

// 模拟和点击无关的弹窗：1 秒后打开，原位淡入淡出
const handleTimer = () => {
	setTimeout(() => handleOpen('定时器', null), 1000);
};

const handleOpen = (label, element) => {
	title.value = `从 ${label} 打开`;
	triggerElement.value = element;
	if (controls.mode === 'view') {
		isVisible.value = true;
		return;
	}
	Modal.info({
		title: title.value,
		content: '第一行说明文字',
		width: size.value.width,
		height: size.value.height,
		triggerElement: element
	});
};
</script>

<style lang="scss">
.direction-demo {
	padding: 20px 40px;

	&__tip {
		color: #666;
	}

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 16px;

		.vc-select {
			width: 240px;
		}
	}

	// 撑满视口剩下的高度：各方向的按钮离居中的弹窗远近不同
	&__stage {
		position: relative;
		height: calc(100vh - 160px);
		min-height: 420px;
		border: 1px dashed var(--vc-border-color, #ddd);
		border-radius: 8px;
	}

	&__button {
		position: absolute;
		width: 80px;
	}

	// 左上象限：菜单向下展开，菜单项离弹窗有一段距离
	&__dropdown {
		position: absolute;
		top: 20%;
		left: 30%;
	}

	// 和 Dropdown 左右对称
	&__request {
		position: absolute;
		top: 20%;
		right: 30%;
	}

	// 在 Dropdown、请求后打开的下方
	&__timer {
		position: absolute;
		top: calc(20% + 48px);
		right: 30%;
	}
}
</style>
