<template>
	<div style="width: 100%;text-align: center">
		<div class="box-wrapper">
			<Button :wait="5000" type="default" @click="handleClick">
				default
			</Button>
			<Button :wait="5000" type="default" solid @click="handleClick">
				default/solid
			</Button>
			<Button type="primary" @click="handleClick">
				primary
			</Button>
			<Button type="primary" solid @click="handleClick">
				primary/solid
			</Button>
			<Button type="text" size="small">
				text
			</Button>
			<Button type="success" size="large">
				success
			</Button>
			<Button type="error" size="small">
				error
			</Button>
			<Button type="warning">
				warning
			</Button>
			<Button disabled>
				Primary
			</Button>
		</div>
		<div class="box-wrapper">
			<Button type="success" solid>
				success/solid
			</Button>
			<Button type="error" solid>
				error/solid
			</Button>
			<Button type="warning" solid>
				warning/solid
			</Button>
		</div>
		<div class="box-wrapper">
			<Button type="primary" solid disabled>
				primary/solid
			</Button>
			<Button type="success" solid disabled>
				success/solid
			</Button>
			<Button type="error" solid disabled>
				error/solid
			</Button>
			<Button type="warning" solid disabled>
				warning/solid
			</Button>
		</div>
		<div class="box-wrapper">
			<Button long>
				long
			</Button>
		</div>
		<div class="box-wrapper">
			<Button type="default" circle>
				default
			</Button>
			<Button type="primary" circle disabled>
				primary
			</Button>
			<Button type="success" circle>
				success
			</Button>
			<Button type="error" circle>
				error
			</Button>
			<Button type="warning" circle>
				warning
			</Button>
			<Button disabled circle>
				Primary
			</Button>
		</div>
		<div class="box-wrapper">
			<Button size="large">
				large
			</Button>
			<Button size="medium">
				default
			</Button>
			<Button size="small">
				small
			</Button>
		</div>
		<div class="box-wrapper">
			<Button size="large" icon="success">
				large
			</Button>
			<Button type="success" size="large" icon="search" round />
		</div>
		<div>
			<ButtonGroup size="large">
				<Button type="success">
					large
				</Button>
				<Button type="success">
					large
				</Button>
				<Button type="success">
					large
				</Button>
			</ButtonGroup>
			<ButtonGroup size="medium">
				<Button>medium</Button>
				<Button>medium</Button>
			</ButtonGroup>
			<ButtonGroup size="small">
				<Button>small</Button>
				<Button>small</Button>
				<Button>small</Button>
			</ButtonGroup>
		</div>
		<div>
			<ButtonGroup size="large" circle>
				<Button>large</Button>
				<Button>large</Button>
				<Button>large</Button>
			</ButtonGroup>
			<ButtonGroup size="medium" circle>
				<Button>medium</Button>
				<Button>medium</Button>
			</ButtonGroup>
			<ButtonGroup size="small" circle>
				<Button>small</Button>
				<Button>small</Button>
				<Button>small</Button>
			</ButtonGroup>
		</div>
		<div>
			<ButtonGroup size="large" vertical>
				<Button>large</Button>
				<Button>large</Button>
				<Button>large</Button>
			</ButtonGroup>
			<ButtonGroup vertical>
				<Button>短</Button>
				<Button icon="up">带图标的按钮</Button>
				<Button type="primary">更长一些的按钮文字</Button>
			</ButtonGroup>
			<ButtonGroup circle vertical>
				<Button>测试</Button>
				<Button>测试</Button>
				<Button>测试</Button>
			</ButtonGroup>
			<ButtonGroup size="small" circle vertical>
				<Button icon="up" />
				<Button icon="up" />
				<Button icon="up" />
			</ButtonGroup>
		</div>
		<div>
			<br>
			<ButtonGroup>
				<Button type="primary" @click="handlePromise1">
					Promise1
				</Button>
				<Button type="success" @click="handlePromise2">
					Promise2
				</Button>
			</ButtonGroup>
		</div>
	</div>
</template>
<script setup>
import { Button, ButtonGroup } from '..';

const handleClick = (e) => {
	console.log(e);
};
const handlePromise1 = () => {
	return new Promise(_ => setTimeout(_, 3000));
};
const handlePromise2 = (e, callback) => {
	return new Promise(_ => setTimeout(_, 3000)).then(() => {
		console.log(typeof callback);
	});
};
</script>
<style>
.box-wrapper{
	margin: 20px;
}
</style>
