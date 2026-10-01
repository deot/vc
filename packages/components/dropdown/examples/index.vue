<template>
	<div style="margin: 40px">
		<Dropdown
			v-model="isVisible"
			:portal="true"
			:trigger="trigger"
			placement="bottom-left"
			@click="handleClick"
			@visible-change="handleChange"
			@close="handleCloseCb"
		>
			<div>菜单(右){{ isVisible }}</div>
			<template #content>
				<DropdownMenu>
					<DropdownItem value="1">
						选项一
					</DropdownItem>
					<DropdownItem value="2">
						选项二
					</DropdownItem>
					<DropdownItem value="3">
						选项三
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
						<span @click.stop>嵌套菜单</span>
						<template #content>
							<DropdownMenu>
								<DropdownItem value="1">
									选项一
								</DropdownItem>
								<DropdownItem value="2">
									选项二
								</DropdownItem>
								<DropdownItem value="3">
									选项三
								</DropdownItem>
							</DropdownMenu>
						</template>
					</Dropdown>

					<!-- 高级嵌套需要v-model -->
					<Popover
						v-model="isPopoverVisible"
						:portal="false"
						trigger="hover"
						tag="li"
						class="vc-dropdown-item"
						portal-class="is-padding-none"
						placement="right"
					>
						<span @click.stop>嵌套popover</span>
						<template #content>
							<DropdownItem value="1">
								选项一
							</DropdownItem>
							<DropdownItem value="2">
								选项二
							</DropdownItem>
							<DropdownItem value="3">
								选项三
							</DropdownItem>
							<DropdownItem value="4">
								嵌套菜单
							</DropdownItem>
						</template>
					</Popover>

					<!-- 高级嵌套需要v-model -->
					<Popconfirm
						v-model="isPopconfirmVisible"
						:portal="false"
						:trigger="trigger"
						tag="li"
						class="vc-dropdown-item"
						placement="right"
						title="确定删除吗？"
					>
						<span>嵌套popconfirm</span>
						<template #content>
							<Input v-model="inputV" />
						</template>
					</Popconfirm>
				</DropdownMenu>

				<!-- indeterminate 测试slot同步 -->
				<div style="border-bottom: 1px solid #e9e9e9;padding-bottom:6px;margin-bottom:6px;">
					<Checkbox
						:indeterminate="isIndeterminate"
						:model-value="isAllChecked"
						@click.prevent="handleCheckAll"
					>
						全选
					</Checkbox>
				</div>
				<CheckboxGroup v-model="checkedItems" @change="handleCheckChange">
					<Checkbox value="条目 B" />
					<Checkbox value="条目 A" />
					<Checkbox value="条目 C" />
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
			visible: {{ isVisible }}
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

const isVisible = ref(false);
const isPopoverVisible = ref(false);
const isPopconfirmVisible = ref(false);
const trigger = ref('hover');

const isIndeterminate = ref(true);
const isAllChecked = ref(false);
const checkedItems = ref(['条目 B', '条目 C']);
const inputV = ref('');

let wait;

const handleClick = (...args) => {
	/**
	 * 两层以上销毁
	 */
	isPopoverVisible.value = false; // 让popover先消失
	isVisible.value = false;

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
		isVisible.value = !isVisible.value;
	}
};

const handleClose = () => {
	isVisible.value = false;
};

const handleCloseCb = () => {
	console.log('cb');
	wait = 1;
	setTimeout(() => {
		wait = 0;
	}, 200);
};

const handleTrigger = () => {
	trigger.value = trigger.value === 'click' ? 'hover' : 'click';
};

const handleCheckAll = () => {
	if (isIndeterminate.value) {
		isAllChecked.value = false;
	} else {
		isAllChecked.value = !isAllChecked.value;
	}
	isIndeterminate.value = false;

	if (isAllChecked.value) {
		checkedItems.value = ['条目 B', '条目 A', '条目 C'];
	} else {
		checkedItems.value = [];
	}
};

const handleCheckChange = (data) => {
	if (data.length === 3) {
		isIndeterminate.value = false;
		isAllChecked.value = true;
	} else if (data.length > 0) {
		isIndeterminate.value = true;
		isAllChecked.value = false;
	} else {
		isIndeterminate.value = false;
		isAllChecked.value = false;
	}
};

</script>
