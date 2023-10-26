import { Theme, ThemeView, ThemeText, ThemeImage, VcInstance } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
// import { Utils } from '@deot/dev-test';

// @vitest-environment jsdom
describe('index.ts', () => {
	const variables = {
		background: 'white',
		border: 'white',
		color: 'white',
		image: 'https://github.githubassets.com/favicons/favicon.svg'
	};
	it('basic', () => {
		expect(typeof Theme).toBe('object');
		expect(typeof ThemeView).toBe('object');
		expect(typeof ThemeText).toBe('object');
		expect(typeof ThemeImage).toBe('object');
	});

	it('ThemeView', async () => {
		const wrapper = mount(() => (
			<ThemeView 
				variables={variables}
				style="font-size: 30px"
				backgroundColor="background" 
				borderColor="border"
			/>
		));

		expect(wrapper.element.nodeName).toBe('DIV');
	});

	it('ThemeView, backgroundImage', async () => {
		const wrapper = mount(() => (
			<ThemeView 
				variables={variables}
				style="font-size: 30px"
				backgroundImage="image" 
			/>
		));

		expect(wrapper.element.nodeName).toBe('DIV');
	});

	it('ThemeView, backgroundImage, url', async () => {
		const wrapper = mount(() => (
			<ThemeView 
				style="font-size: 30px"
				backgroundImage={variables.image} 
			/>
		));

		expect(wrapper.element.nodeName).toBe('DIV');
	});

	it('ThemeText', async () => {
		const wrapper = mount(() => (
			<ThemeText 
				variables={variables}
				style="font-size: 30px"
				backgroundColor="background" 
				borderColor="border"
			/>
		));

		expect(wrapper.element.nodeName).toBe('SPAN');
	});

	it('ThemeImage', async () => {
		const wrapper = mount(() => (
			<ThemeImage src="image" />
		));

		expect(wrapper.element.nodeName).toBe('IMG');
	});

	it('ThemeImage, url', async () => {
		const wrapper = mount(() => (
			<ThemeImage src={variables.image} />
		));

		expect(wrapper.element.nodeName).toBe('IMG');
	});

	it('ThemeView, basic', async () => {
		VcInstance.configure({
			Theme: {
				variables
			}
		});
		const wrapper = mount(() => (
			<ThemeView 
				backgroundColor="background" 
				color="color" 
				pseudo={
					{
						'before': {
							background: 'background'
						},
						':hover > span': {
							color: 'color',
						}
					}
				}
			/>
		));

		expect(wrapper.html()).toMatch('background-color: white');
		expect(wrapper.html()).toMatch('color: white');
	});

	it('ThemeView, none', async () => {
		VcInstance.configure({
			Theme: {
				variables
			}
		});
		const wrapper = mount(() => (
			<ThemeView backgroundColor="none" color="none" pseudo="''" />
		));

		expect(wrapper.element.nodeName).toBe('DIV');

		// expect(wrapper.html()).toMatch('background-color: var(--none)');
		// expect(wrapper.html()).toMatch('color: var(--none)');
	});

});
