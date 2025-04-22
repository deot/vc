<template>
	<div style="width: 100%;text-align: center">
		<div class="box-wrapper">
			<Button :wait="5000" type="default" @click="handleClick">
				default
			</Button>
			<Button type="primary" @click="handleClick">
				primary
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
			<Button disabled type="primary">
				Primary
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
			<Button type="primary" circle>
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
			<Button disabled type="primary" circle>
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
				large
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
