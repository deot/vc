<template>
	<div style="margin: 40px">
		<Dropdown
			v-model="visible"
			:portal="true"
			:trigger="trigger"
			placement="bottom-left"
			@click="handleClick"
			@visible-change="handleChange"
			@close="handleCloseCb"
		>
			<div>菜单(右){{ visible }}</div>
			<template #content>
				<DropdownMenu>
					<DropdownItem value="1">
						驴打滚
					</DropdownItem>
					<DropdownItem value="2">
						炸酱面
					</DropdownItem>
					<DropdownItem value="3">
						豆汁儿
					</DropdownItem>

					<!-- 高级嵌套 -->
					<Dropdown
						:portal="false"
						tag="li"
						class="vc-dropdown-item"
						placement="right"
						style="display: block"
						@click="handleClick"
						@visible-change="handleChange"
					>
						<span @click.stop>冰糖葫芦</span>
						<template #content>
							<DropdownMenu>
								<DropdownItem value="1">
									驴打滚
								</DropdownItem>
								<DropdownItem value="2">
									炸酱面
								</DropdownItem>
								<DropdownItem value="3">
									豆汁儿
								</DropdownItem>
							</DropdownMenu>
						</template>
					</Dropdown>

					<!-- 高级嵌套需要v-model -->
					<Popover
						v-model="visiblePopover"
						:portal="false"
						trigger="hover"
						tag="li"
						class="vc-dropdown-item"
						portal-class="is-padding-none"
						placement="right"
					>
						<span @click.stop>北京烤鸭popover</span>
						<template #content>
							<DropdownItem value="1">
								驴打滚
							</DropdownItem>
							<DropdownItem value="2">
								炸酱面
							</DropdownItem>
							<DropdownItem value="3">
								豆汁儿
							</DropdownItem>
							<DropdownItem value="4">
								冰糖葫芦
							</DropdownItem>
						</template>
					</Popover>

					<!-- 高级嵌套需要v-model -->
					<Popconfirm
						v-model="visiblePopconfirm"
						:portal="false"
						:trigger="trigger"
						tag="li"
						class="vc-dropdown-item"
						placement="right"
						title="确定删除吗？"
					>
						<span>北京烤鸭popconfirm</span>
						<template #content>
							<Input v-model="inputV" />
						</template>
					</Popconfirm>
				</DropdownMenu>

				<!-- indeterminate 测试slot同步 -->
				<div style="border-bottom: 1px solid #e9e9e9;padding-bottom:6px;margin-bottom:6px;">
					<Checkbox
						:indeterminate="indeterminate"
						:model-value="checkAll"
						@click.prevent="handleCheckAll"
					>
						全选
					</Checkbox>
				</div>
				<CheckboxGroup v-model="checkAllGroup" @change="handleCheckChange">
					<Checkbox value="香蕉" />
					<Checkbox value="苹果" />
					<Checkbox value="西瓜" />
				</CheckboxGroup>
				<Button
					style="margin-left: 100px"
					@click="handleClose"
				>
					关闭
				</Button>
			</template>
		</Dropdown>

		<Button style="margin-left: 100px" @click="handleVisible">
			visible: {{ visible }}
		</Button>
		<Button style="margin-left: 100px" @click="handleTrigger">
			trigger {{ trigger }}
		</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Dropdown, DropdownMenu, DropdownItem } from '..';
import { Popover } from '../../popover';
import { Popconfirm } from '../../popconfirm';
import { Button } from '../../button';
import { Checkbox, CheckboxGroup } from '../../checkbox';
import { Input } from '../../input';

const visible = ref(false);
const visiblePopover = ref(false);
const visiblePopconfirm = ref(false);
const trigger = ref('hover');

const indeterminate = ref(true);
const checkAll = ref(false);
const checkAllGroup = ref(['香蕉', '西瓜']);
const inputV = ref('');

let wait;
let timer;

const handleClick = (...args) => {
	/**
	 * 两层以上销毁
	 */
	visiblePopover.value = false; // 让popover先消失
	visible.value = false;

	console.log('click', ...args);
};

const handleChange = (...args) => {
	console.log('visible-change', ...args);
};

/**
 * 事件冒泡上来了
 */
const handleVisible = () => {
	/**
	 * click模式下，this.visible会一直拿到false
	 */
	if (!wait) {
		visible.value = !visible.value;
	}
};

const handleClose = () => {
	visible.value = false;
};

const handleCloseCb = () => {
	console.log('cb');
	wait = 1;
	timer = setTimeout(() => {
		wait = 0;
	}, 200);
};

const handleTrigger = () => {
	trigger.value = trigger.value === 'click' ? 'hover' : 'click';
};

const handleCheckAll = () => {
	if (indeterminate.value) {
		checkAll.value = false;
	} else {
		checkAll.value = !checkAll.value;
	}
	indeterminate.value = false;

	if (checkAll.value) {
		checkAllGroup.value = ['香蕉', '苹果', '西瓜'];
	} else {
		checkAllGroup.value = [];
	}
};

const handleCheckChange = (data) => {
	if (data.length === 3) {
		indeterminate.value = false;
		checkAll.value = true;
	} else if (data.length > 0) {
		indeterminate.value = true;
		checkAll.value = false;
	} else {
		indeterminate.value = false;
		checkAll.value = false;
	}
};

</script>
