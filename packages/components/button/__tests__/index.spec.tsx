// @vitest-environment jsdom

import { Button, ButtonGroup, Spin, Icon } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Button).toBe('object');
	});

	it('tag', async () => {
		const link = 'any';
		const wrapper = mount(() => (
			<Button 
				tag="a" 
				// @ts-ignore 
				href={link} 
			/>
		));

		expect(wrapper.element.nodeName).toBe('A');
		expect(wrapper.attributes('href')).toBe(link);
	});

	it('type', async () => {
		const wrapper = mount(() => <Button type="primary" />);

		expect(wrapper.classes()).toContain('is-primary');
	});

	it('icon', async () => {
		const wrapper = mount(() => <Button icon="search" />);

		expect(wrapper.findComponent(Icon).exists()).toBeTruthy();
	});

	it('size, disabled, circle, round, long', async () => {
		const wrapper = mount(() => <Button size="large" disabled circle round long />);

		expect(wrapper.classes()).toContain('is-large');
		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.classes()).toContain('is-circle');
		expect(wrapper.classes()).toContain('is-round');
		expect(wrapper.classes()).toContain('is-long');
	});

	it('htmlType', async () => {
		const wrapper = mount(() => <Button htmlType="submit" />);

		expect(wrapper.attributes('type')).toContain('submit');
	});

	it('click, debounce', async () => {
		let count = 0;
		const handler = () => {
			count++;
		};

		const wrapper = mount(() => <Button wait={300} onClick={handler} />);

		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');

		expect(count).toBe(1);

	});
	it('click, loading', async () => {
		expect.assertions(4);
		const handler = async () => {
			await Utils.sleep(10);
			expect(wrapper.html()).toMatch('stroke="#ccc');
			expect(wrapper.findComponent(Spin).exists()).toBeTruthy();
		};

		const wrapper = mount(() => <Button onClick={handler} />);

		await wrapper.trigger('click');
		await Utils.sleep(10);
		expect(wrapper.emitted()).toBeDefined();
		expect(wrapper.findComponent(Spin).exists()).toBeFalsy();
	});

	it('click, loading, foreground', async () => {
		expect.assertions(1);
		const handler = async () => {
			await Utils.sleep(10);
			expect(wrapper.html()).toMatch('stroke="#fff');
		};

		const wrapper = mount(() => <Button type="primary" onClick={handler} />);

		await wrapper.trigger('click');
		await Utils.sleep(10);
	});

	it('group', async () => {
		const wrapper = mount(() => <ButtonGroup><Button /></ButtonGroup>);

		expect(wrapper.classes()).toContain('vc-button-group');
	});

	it('group, fragment', async () => {
		const wrapper = mount(() => <ButtonGroup fragment><Button /></ButtonGroup>);

		expect(wrapper.classes()).not.toContain('vc-button-group');
	});
});
