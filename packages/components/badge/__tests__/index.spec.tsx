// @vitest-environment jsdom

import { Badge, MBadge } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h, ref, nextTick } from 'vue';

const Box = () => (<span class="box" />);

// 当前显示的徽标元素（角标或状态点外层），没有时为 null；角标在 Transition 的桩节点 transition-stub 内
const indicator = (wrapper: any) => {
	return wrapper.element.querySelector('.vc-badge__value, .vc-badge__dot, .vc-badge__custom, .vc-badge__status') as HTMLElement | null;
};
const kind = (wrapper: any) => indicator(wrapper)?.className.split(' ')[0].replace('vc-badge__', '');
const text = (wrapper: any) => indicator(wrapper)?.textContent;

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Badge).toBe('object');
		expect(MBadge).toBe(Badge);
	});

	it('create', () => {
		const wrapper = mount(() => (<Badge value={9}><Box /></Badge>));

		expect(wrapper.element.tagName).toBe('SPAN');
		expect(wrapper.classes()).toEqual(['vc-badge']);
		expect(wrapper.element.firstElementChild!.className).toBe('box');
		expect(kind(wrapper)).toBe('value');
		expect(text(wrapper)).toBe('9');
	});

	it('is-standalone: 没有默认插槽时', () => {
		expect(mount(() => (<Badge value={9} />)).classes()).toEqual(['vc-badge', 'is-standalone']);
		expect(mount(() => (<Badge value={9}><Box /></Badge>)).classes('is-standalone')).toBe(false);
	});

	it('value: 数字小于等于0时隐藏', () => {
		for (const value of [0, -1, Number.NaN]) {
			expect(indicator(mount(() => (<Badge value={value} />))), String(value)).toBeNull();
		}
		expect(indicator(mount(() => (<Badge />)))).toBeNull();
		expect(text(mount(() => (<Badge value={1} />)))).toBe('1');
	});

	it('max: 默认99, 超过时显示 max+, 0 表示不限', () => {
		const render = (value: number, max?: number) => text(mount(() => (<Badge value={value} max={max} />)));

		expect(render(99)).toBe('99');
		expect(render(100)).toBe('99+');
		expect(render(11, 10)).toBe('10+');
		expect(render(10, 10)).toBe('10');
		expect(render(1000, 999)).toBe('999+');
		expect(render(1000, 0)).toBe('1000');
	});

	it('value: 字符串原样显示, 不受 max 限制, 空字符串隐藏', () => {
		const render = (value: string) => mount(() => (<Badge value={value} max={10} />));

		expect(text(render('NEW'))).toBe('NEW');
		expect(text(render('0'))).toBe('0');
		expect(text(render('1000'))).toBe('1000');
		expect(indicator(render(''))).toBeNull();
	});

	it('dot: 不传 value 也显示, value 为小于等于0的数字时隐藏', () => {
		const render = (value?: number | string) => mount(() => (<Badge dot value={value}><Box /></Badge>));

		expect(kind(render())).toBe('dot');
		expect(kind(render(5))).toBe('dot');
		expect(text(render(5))).toBe('');
		expect(kind(render('NEW'))).toBe('dot');
		expect(indicator(render(0))).toBeNull();
		expect(indicator(render(-1))).toBeNull();
	});

	it('#dot: 自定义徽标, 优先于 dot 与 value', () => {
		const wrapper = mount(() => (
			<Badge dot value={0} color="red" offset={[2, 3]}>
				{{
					default: () => (<Box />),
					dot: () => (<i class="custom">C</i>)
				}}
			</Badge>
		));

		expect(kind(wrapper)).toBe('custom');
		expect(indicator(wrapper)!.querySelector('.custom')!.textContent).toBe('C');
		// color 只作用于数字、文字、圆点与状态点
		expect(indicator(wrapper)!.style.backgroundColor).toBe('');
		expect(indicator(wrapper)!.style.marginRight).toBe('-2px');
		expect(indicator(wrapper)!.style.marginTop).toBe('3px');
	});

	it('status: 状态点, 忽略 value / dot / #dot', () => {
		const wrapper = mount(() => (
			<Badge status="success" value={9} dot>
				{{ dot: () => (<i class="custom" />) }}
			</Badge>
		));
		const dot = wrapper.find('.vc-badge__status > .vc-badge__status-dot');

		expect(kind(wrapper)).toBe('status');
		expect(dot.classes()).toEqual(['vc-badge__status-dot', 'is-success']);
		expect(wrapper.find('.vc-badge__label').exists()).toBe(false);
		expect(wrapper.find('.custom').exists()).toBe(false);
		expect(wrapper.find('.vc-badge__value').exists()).toBe(false);

		for (const status of ['default', 'pending', 'success', 'warning', 'error']) {
			const item = mount(() => (<Badge status={status as any} />));
			expect(item.find('.vc-badge__status-dot').classes(`is-${status}`), status).toBe(true);
		}
	});

	it('label: 只传 label 时按 default 显示状态点', () => {
		const wrapper = mount(() => (<Badge label="说明" />));

		expect(kind(wrapper)).toBe('status');
		expect(wrapper.find('.vc-badge__status-dot').classes('is-default')).toBe(true);
		expect(wrapper.find('.vc-badge__label').text()).toBe('说明');
		expect(wrapper.find('.vc-badge__label').element.tagName).toBe('SPAN');
	});

	it('label: 0 显示, 空值不进入状态点', () => {
		expect(mount(() => (<Badge label={0} />)).find('.vc-badge__label').text()).toBe('0');

		for (const label of ['', null, undefined]) {
			const wrapper = mount(() => (<Badge label={label as any} value={9} />));
			expect(kind(wrapper), String(label)).toBe('value');
		}
	});

	it('label: 插槽优先, 支持函数与 { type, value }', () => {
		const slot = mount(() => (
			<Badge status="pending" label="属性">
				{{ label: () => (<b>插槽</b>) }}
			</Badge>
		));
		expect(slot.find('.vc-badge__label').html()).toBe('<span class="vc-badge__label"><b>插槽</b></span>');

		const fn = mount(() => (<Badge label={() => h('i', '函数')} />));
		expect(fn.find('.vc-badge__label > i').text()).toBe('函数');

		const html = mount(() => (<Badge label={{ type: 'html', value: '<u>HTML</u>' }} />));
		expect(html.find('.vc-badge__label > u').text()).toBe('HTML');

		// 字符串始终按文本渲染
		const raw = mount(() => (<Badge label="<u>文本</u>" />));
		expect(raw.find('.vc-badge__label').text()).toBe('<u>文本</u>');
		expect(raw.find('.vc-badge__label u').exists()).toBe(false);
	});

	it('status: 与默认插槽同用时状态点跟在内容后', () => {
		const wrapper = mount(() => (<Badge status="warning" label="说明"><Box /></Badge>));
		const children = Array.from(wrapper.element.children).map((el: any) => el.className);

		expect(children).toEqual(['box', 'vc-badge__status']);
	});

	it('color: 作用于数字、文字、圆点与状态点', () => {
		const color = 'rgb(1, 2, 3)';
		const cases = [
			mount(() => (<Badge value={9} color={color} />)).find('.vc-badge__value'),
			mount(() => (<Badge value="NEW" color={color} />)).find('.vc-badge__value'),
			mount(() => (<Badge dot color={color} />)).find('.vc-badge__dot'),
			mount(() => (<Badge status="error" color={color} />)).find('.vc-badge__status-dot'),
			mount(() => (<Badge label="说明" color={color} />)).find('.vc-badge__status-dot')
		];

		cases.forEach((item, index) => {
			expect((item.element as HTMLElement).style.backgroundColor, String(index)).toBe(color);
		});
		expect((mount(() => (<Badge value={9} />)).find('.vc-badge__value').element as HTMLElement).getAttribute('style')).toBeNull();
	});

	it('offset: [水平, 垂直] 写为 margin, 数字表示两个方向相同', () => {
		const style = (offset: any) => {
			const el = indicator(mount(() => (<Badge value={9} offset={offset}><Box /></Badge>)))!;
			return [el.style.marginRight, el.style.marginTop];
		};

		expect(style([6, -2])).toEqual(['-6px', '-2px']);
		expect(style(4)).toEqual(['-4px', '4px']);
		expect(style([3])).toEqual(['-3px', '0px']);
		expect(style(undefined)).toEqual(['', '']);
		expect(style(0)).toEqual(['', '']);

		// 状态点不受 offset 影响
		const status = mount(() => (<Badge status="success" offset={[6, 6]} />));
		expect((status.find('.vc-badge__status-dot').element as HTMLElement).style.marginRight).toBe('');
	});

	it('dotClass / dotStyle: 作用于徽标元素, dotStyle 优先于 color 与 offset', () => {
		const targets = [
			mount(() => (<Badge value={9} dotClass="a" dotStyle={{ width: '30px' }} />)).find('.vc-badge__value'),
			mount(() => (<Badge dot dotClass={['a']} dotStyle="width: 30px;" />)).find('.vc-badge__dot'),
			mount(() => (
				<Badge dotClass={{ a: true }} dotStyle={{ width: '30px' }}>
					{{ dot: () => 'C' }}
				</Badge>
			)).find('.vc-badge__custom'),
			mount(() => (<Badge status="success" dotClass="a" dotStyle={{ width: '30px' }} />)).find('.vc-badge__status-dot')
		];

		targets.forEach((item, index) => {
			expect(item.classes('a'), String(index)).toBe(true);
			expect((item.element as HTMLElement).style.width, String(index)).toBe('30px');
		});

		const override = indicator(mount(() => (
			<Badge value={9} color="red" offset={[2, 2]} dotStyle={{ backgroundColor: 'blue', marginTop: '0px' }} />
		)))!;
		expect(override.style.backgroundColor).toBe('blue');
		expect(override.style.marginTop).toBe('0px');
		expect(override.style.marginRight).toBe('-2px');
	});

	it('class / style: 透传到根节点', () => {
		const wrapper = mount(() => (<Badge value={9} class="root" style={{ marginRight: '24px' }} />));

		expect(wrapper.classes()).toEqual(['vc-badge', 'is-standalone', 'root']);
		expect((wrapper.element as HTMLElement).style.marginRight).toBe('24px');
		expect(wrapper.find('.vc-badge__value').classes()).toEqual(['vc-badge__value']);
	});

	it('is-changed: 前后都可见时数字变化才播放缩放, 内层文字重新挂载', async () => {
		const value = ref(5);
		const wrapper = mount(() => (<Badge value={value.value} max={10} />));
		const content = () => wrapper.find('.vc-badge__content');

		expect(content().classes('is-changed')).toBe(false);
		const first = content().element;

		value.value = 6;
		await nextTick();
		expect(content().text()).toBe('6');
		expect(content().classes('is-changed')).toBe(true);
		expect(content().element).not.toBe(first);

		// 显示文字不变时不重新挂载
		const second = content().element;
		value.value = 11;
		await nextTick();
		value.value = 12;
		await nextTick();
		expect(content().text()).toBe('10+');
		const capped = content().element;
		expect(capped).not.toBe(second);
		value.value = 13;
		await nextTick();
		expect(content().element).toBe(capped);

		value.value = 0;
		await nextTick();
		expect(content().exists()).toBe(false);

		// 从无到有只走外层的进场
		value.value = 3;
		await nextTick();
		expect(content().text()).toBe('3');
		expect(content().classes('is-changed')).toBe(false);
	});

	it('形态切换: 角标包在 vc-badge__zoom 过渡中, 首次出现也有过渡', async () => {
		const props = ref<Record<string, any>>({ value: 9 });
		const wrapper = mount(() => (<Badge {...props.value}><Box /></Badge>));
		const transition = wrapper.find('transition-stub');

		expect(transition.attributes('name')).toBe('vc-badge__zoom');
		expect(transition.attributes('appear')).toBe('true');
		expect(transition.element.parentElement).toBe(wrapper.element);
		expect(kind(wrapper)).toBe('value');

		props.value = { dot: true };
		await nextTick();
		expect(kind(wrapper)).toBe('dot');

		props.value = { value: 'NEW' };
		await nextTick();
		expect(kind(wrapper)).toBe('value');
		expect(text(wrapper)).toBe('NEW');

		props.value = {};
		await nextTick();
		expect(indicator(wrapper)).toBeNull();

		// 状态点不使用过渡
		props.value = { status: 'success' };
		await nextTick();
		expect(kind(wrapper)).toBe('status');
		expect(wrapper.find('transition-stub').exists()).toBe(false);
	});
});
