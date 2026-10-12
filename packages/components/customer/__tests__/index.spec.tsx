// @vitest-environment jsdom

import { Customer, MCustomer, VcInstance } from '@deot/vc-components';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { vi } from 'vitest';

// 注入载荷：按 HTML 解析时会生成 img 元素
const PAYLOAD = '<img src="x" onerror="alert(1)">';

describe('customer.tsx', () => {
	// 挂载着的组件会响应全局配置的变化，逐个用例卸载
	enableAutoUnmount(afterEach);

	afterEach(() => {
		VcInstance.configure({ Customer: {}, sanitize: void 0 });
	});

	it('basic', () => {
		expect(typeof Customer).toBe('object');
		expect(MCustomer).toBe(Customer);

		const wrapper = mount(Customer, {});
		expect(wrapper.html()).toBe('');
	});

	describe('字符串与数字', () => {
		it('按文本渲染，标签不生成元素', () => {
			const wrapper = mount(() => (<Customer render={PAYLOAD} />));

			expect(wrapper.element.tagName).toBe('DIV');
			expect(wrapper.find('img').exists()).toBe(false);
			expect(wrapper.text()).toBe(PAYLOAD);
		});

		it('没有让字符串变成 HTML 的开关：html 只是一个普通参数', () => {
			const wrapper = mount(() => (<Customer html render={PAYLOAD} />));
			expect(wrapper.find('img').exists()).toBe(false);
			expect(wrapper.html()).toBe(`<div>${PAYLOAD.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`);

			const render = vi.fn(() => 'text');
			mount(() => (<Customer html render={render} />));
			expect((render.mock.calls[0] as any)[0]).toEqual({ html: true });
		});

		it('数字是文本，0 正常输出', () => {
			const wrapper = mount(() => (<Customer tag="span" render={0} />));

			expect(wrapper.html()).toBe('<span>0</span>');
		});
	});

	describe('{ type, value }', () => {
		it('html 按 HTML 渲染', () => {
			const wrapper = mount(() => (<Customer render={{ type: 'html', value: '<i>text</i>' }} />));

			expect(wrapper.find('i').exists()).toBe(true);
		});

		it('text 按文本渲染', () => {
			const wrapper = mount(() => (<Customer render={{ type: 'text', value: PAYLOAD }} />));

			expect(wrapper.find('img').exists()).toBe(false);
			expect(wrapper.text()).toBe(PAYLOAD);
		});

		it('未知类型按文本渲染', () => {
			const wrapper = mount(() => (<Customer render={{ type: 'HTML', value: PAYLOAD }} />));

			expect(wrapper.find('img').exists()).toBe(false);
			expect(wrapper.text()).toBe(PAYLOAD);
		});

		it('html 的值不是字符串时转成字符串', () => {
			const wrapper = mount(() => (<Customer render={{ type: 'html', value: 1 }} />));

			expect(wrapper.html()).toBe('<div>1</div>');
		});

		it('html 的内容不含 < 和 & 时按文本写入，含实体时仍按 HTML 解析', () => {
			const setHTML = vi.spyOn(Element.prototype, 'innerHTML', 'set');
			const written = () => setHTML.mock.calls.map(i => i[0]);

			const plain = mount(() => (<Customer render={{ type: 'html', value: '纯文本 > "引号"' }} />));
			expect(plain.text()).toBe('纯文本 > "引号"');
			expect(written()).not.toContain('纯文本 > "引号"');

			const entity = mount(() => (<Customer render={{ type: 'html', value: 'a &amp; b' }} />));
			expect(entity.text()).toBe('a & b');
			expect(written()).toContain('a &amp; b');

			const markup = mount(() => (<Customer render={{ type: 'html', value: '<i>text</i>' }} />));
			expect(markup.find('i').exists()).toBe(true);
			expect(written()).toContain('<i>text</i>');
			setHTML.mockRestore();
		});
	});

	describe('空值', () => {
		const VALUES = [void 0, null, '', true, false, {}, { type: 'html' }, { value: PAYLOAD }, [PAYLOAD], { type: 'html', value: '' }];

		it('不输出内容', () => {
			VALUES.forEach((value: any) => {
				const wrapper = mount(() => (<Customer render={value} />));
				expect(wrapper.html()).toBe('');
			});
		});

		it('wrap 时仍输出包裹元素', () => {
			VALUES.forEach((value: any) => {
				const wrapper = mount(() => (<Customer wrap class="wrapper" render={value} />));
				expect(wrapper.html()).toBe('<div class="wrapper"></div>');
			});
		});
	});

	describe('渲染函数', () => {
		it('收到除 class / style / 事件以外的 attrs 与 context，不包裹', () => {
			const render = vi.fn((attrs: any) => (<p class="child">{ attrs.index }</p>));
			const row = { name: 'a' };
			const wrapper = mount(() => (
				<Customer class="wrapper" style="color: red" onClick={() => {}} render={render} row={row} index={1} />
			));

			expect(wrapper.html()).toBe('<p class="child">1</p>');
			expect(render).toHaveBeenCalledTimes(1);
			expect(render.mock.calls[0][0]).toEqual({ row, index: 1 });
			expect((render.mock.calls[0] as any)[0].row).toBe(row);
			expect(typeof (render.mock.calls[0] as any)[1].emit).toBe('function');
		});

		it('没有其它 attrs 时参数为空对象', () => {
			const render = vi.fn(() => 'text');
			mount(() => (<Customer render={render} />));

			expect((render.mock.calls[0] as any)[0]).toEqual({});
		});

		it('返回字符串时是文本', () => {
			const wrapper = mount(() => (<Customer render={() => PAYLOAD} />));

			expect(wrapper.find('img').exists()).toBe(false);
			expect(wrapper.text()).toBe(PAYLOAD);
		});

		it('插槽也是函数：与属性二选一后作为 render 传入', () => {
			const Host = defineComponent({
				props: { label: String },
				setup(props, { slots }) {
					return () => (<Customer tag="span" render={slots.label || props.label} index={2} />);
				}
			});

			// 字符串：其余 attrs 不会落到包裹元素上
			const prop = mount(() => (<Host label="prop" />));
			expect(prop.html()).toBe('<span>prop</span>');

			const slot = vi.fn((scope: any) => (<p class="slot">{ scope.index }</p>));
			const both = mount(() => (<Host label="prop" v-slots={{ label: slot }} />));
			expect(both.html()).toBe('<p class="slot">2</p>');
			expect(slot.mock.calls[0][0]).toEqual({ index: 2 });
		});

		it('wrap 时放进包裹元素，class / style / 事件落在它上面', async () => {
			const onClick = vi.fn();
			const wrapper = mount(() => (
				<Customer wrap tag="label" class="wrapper" render={() => (<i>render</i>)} index={1} onClick={onClick} />
			));

			expect(wrapper.html()).toBe('<label class="wrapper"><i>render</i></label>');
			await wrapper.trigger('click');
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it('context 可调用写在组件里的插槽并用 emit 触发事件；class 与事件不透传到函数的根节点', async () => {
			const onClick = vi.fn();
			const onCustomerClick = vi.fn();
			const wrapper = mount(Customer, {
				props: {
					current: 0,
					render: (args: any, { attrs, slots, emit }: any) => {
						return (
							<ul class="child" onClick={(e: MouseEvent) => emit('customer-click', e)}>
								<li class="attrs">{ attrs.current }</li>
								<li class="args">{ args.current }</li>
								<li class="default">{ slots.default?.() }</li>
								<li class="content">{ slots.content?.({ current: args.current + 1 }) }</li>
							</ul>
						);
					}
				} as any,
				attrs: {
					class: 'parent',
					onClick,
					onCustomerClick
				},
				slots: {
					default: () => 'default-slot',
					content: (scoped: any) => `content-slot-${scoped.current}`
				}
			});

			expect(wrapper.classes()).toEqual(['child']);
			expect(wrapper.find('.attrs').text()).toBe('0');
			expect(wrapper.find('.args').text()).toBe('0');
			expect(wrapper.find('.default').text()).toBe('default-slot');
			expect(wrapper.find('.content').text()).toBe('content-slot-1');

			await wrapper.setProps({ current: 1 } as any);

			expect(wrapper.find('.attrs').text()).toBe('1');
			expect(wrapper.find('.args').text()).toBe('1');
			expect(wrapper.find('.content').text()).toBe('content-slot-2');

			await wrapper.trigger('click');

			expect(onClick).not.toHaveBeenCalled();
			expect(onCustomerClick).toHaveBeenCalledTimes(1);
		});

		it('列表新增一项时，只有新增的那项执行渲染函数', async () => {
			const renderItem = vi.fn((args: any) => (<div class="item">{ args.index }</div>));
			const renderList = vi.fn((args: any) => {
				return (
					<div class="list">
						{
							Array.from({ length: args.length }, (_, i) => i + 1).map(item => (
								<Customer key={item} render={renderItem} index={item} />
							))
						}
					</div>
				);
			});

			const wrapper = mount(Customer, { props: { length: 100, render: renderList } as any });

			expect(renderList).toHaveBeenCalledTimes(1);
			expect(renderItem).toHaveBeenCalledTimes(100);
			expect(wrapper.findAll('.item').length).toBe(100);

			await wrapper.setProps({ length: 101 } as any);

			expect(renderList).toHaveBeenCalledTimes(2);
			expect(renderItem).toHaveBeenCalledTimes(101);
			expect(wrapper.findAll('.item').length).toBe(101);
		});

		it('父级重渲染时参数不变则不更新，某个参数变化后重新执行', async () => {
			const render = vi.fn(({ row, index }: any) => (<p>{ `${row.name}:${index}` }</p>));
			const row = { name: 'a' };
			const count = ref(0);
			const index = ref(0);
			const wrapper = mount(() => (
				<div data-count={count.value}>
					<Customer render={render} row={row} index={index.value} />
				</div>
			));
			expect(render).toHaveBeenCalledTimes(1);

			count.value++;
			await nextTick();
			expect(wrapper.attributes('data-count')).toBe('1');
			expect(render).toHaveBeenCalledTimes(1);

			index.value++;
			await nextTick();
			expect(render).toHaveBeenCalledTimes(2);
			expect(wrapper.find('p').text()).toBe('a:1');
		});

		it('函数内读取的响应式数据变化、或函数本身变化时重新执行', async () => {
			const text = ref('a');
			const render = vi.fn(() => (<p>{ text.value }</p>));
			const value = ref<any>(render);
			const wrapper = mount(() => (<Customer render={value.value} index={0} />));
			expect(wrapper.find('p').text()).toBe('a');

			text.value = 'b';
			await nextTick();
			expect(render).toHaveBeenCalledTimes(2);
			expect(wrapper.find('p').text()).toBe('b');

			value.value = () => (<p>c</p>);
			await nextTick();
			expect(wrapper.find('p').text()).toBe('c');
			expect(render).toHaveBeenCalledTimes(2);
		});
	});

	describe('包裹元素', () => {
		it('class / style / 事件落在包裹元素上，其余 attrs 不出现在 DOM 上', async () => {
			const onClick = vi.fn();
			const wrapper = mount(() => (
				<Customer
					tag="span"
					class="wrapper"
					style={{ color: 'red' }}
					data-id="1"
					row={{ name: 'a' }}
					render="text"
					onClick={onClick}
				/>
			));

			expect(wrapper.html()).toBe('<span class="wrapper" style="color: red;">text</span>');

			await wrapper.trigger('click');
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it('tag 可以是组件', () => {
			const Tag = defineComponent({
				setup(_, { slots }) {
					return () => (<section>{ slots.default?.() }</section>);
				}
			});
			const wrapper = mount(() => (<Customer tag={Tag} class="wrapper" render="text" />));
			expect(wrapper.html()).toBe('<section class="wrapper">text</section>');

			const wrapper$ = mount(() => (<Customer tag={Tag} render={{ type: 'html', value: '<i>text</i>' }} />));
			expect(wrapper$.html()).toBe('<section><i>text</i></section>');
		});

		it('内容变化时更新', async () => {
			const value = ref<any>({ type: 'html', value: '<i>a</i>' });
			const wrapper = mount(() => (<Customer render={value.value} />));
			expect(wrapper.html()).toBe('<div><i>a</i></div>');

			value.value = { type: 'html', value: '<i>b</i>' };
			await nextTick();
			expect(wrapper.html()).toBe('<div><i>b</i></div>');

			// html → 无标记的 html：从 innerHTML 换成文本
			value.value = { type: 'html', value: 'plain' };
			await nextTick();
			expect(wrapper.html()).toBe('<div>plain</div>');

			value.value = { type: 'text', value: '<i>c</i>' };
			await nextTick();
			expect(wrapper.find('i').exists()).toBe(false);
			expect(wrapper.text()).toBe('<i>c</i>');

			value.value = () => (<b>d</b>);
			await nextTick();
			expect(wrapper.html()).toBe('<b>d</b>');

			value.value = '';
			await nextTick();
			expect(wrapper.html()).toBe('');
		});

		it('tag / wrap 按约定从 attrs 读取：不进函数的参数，也不出现在 DOM 上', () => {
			const render = vi.fn(() => (<i>render</i>));
			const fn = mount(() => (<Customer wrap tag="section" class="wrapper" render={render} index={1} />));

			expect(fn.html()).toBe('<section class="wrapper"><i>render</i></section>');
			expect((render.mock.calls[0] as any)[0]).toEqual({ index: 1 });

			const text = mount(() => (<Customer tag="span" class="wrapper" render="a" />));
			expect(text.html()).toBe('<span class="wrapper">a</span>');
		});

		it('模板里的裸属性（空字符串）视为开启，false 与不传视为关闭', () => {
			// <Customer wrap /> 写在模板里时，传进来的是空字符串
			const on = mount(Customer, { attrs: { wrap: '', class: 'wrapper' } });
			expect(on.html()).toBe('<div class="wrapper"></div>');

			expect(mount(() => (<Customer wrap={false} class="wrapper" />)).html()).toBe('');
			expect(mount(() => (<Customer class="wrapper" />)).html()).toBe('');
		});

		it('tag 为空时用 div', () => {
			expect(mount(() => (<Customer tag="" render="a" />)).html()).toBe('<div>a</div>');
			expect(mount(() => (<Customer tag={void 0} render="a" />)).html()).toBe('<div>a</div>');
		});

		it('tag / wrap 变化时更新', async () => {
			const tag = ref('span');
			const wrap = ref(false);
			const content = ref<any>('a');
			const wrapper = mount(() => (
				<Customer tag={tag.value} wrap={wrap.value} class="wrapper" render={content.value} />
			));
			expect(wrapper.html()).toBe('<span class="wrapper">a</span>');

			tag.value = 'p';
			await nextTick();
			expect(wrapper.html()).toBe('<p class="wrapper">a</p>');

			content.value = '';
			await nextTick();
			expect(wrapper.html()).toBe('');

			wrap.value = true;
			await nextTick();
			expect(wrapper.html()).toBe('<p class="wrapper"></p>');
		});
	});

	describe('formatter', () => {
		it('{ type, value } 都会经过，可取到所属组件；自定义类型转换后按文本渲染', () => {
			const formatter = vi.fn(({ type, value }) => {
				if (type === 'number') return `<b>${value.toFixed(2)}</b>`;
				return value;
			});
			VcInstance.configure({ Customer: { formatter } });

			const Owner = defineComponent({
				name: 'vc-owner',
				setup() {
					return () => (<Customer render={{ type: 'number', value: 1 }} />);
				}
			});
			const wrapper = mount(Owner);
			expect(wrapper.find('b').exists()).toBe(false);
			expect(wrapper.text()).toBe('<b>1.00</b>');
			expect(formatter.mock.calls[0]).toHaveLength(1);
			expect(formatter.mock.calls[0][0].instance.parent.type.name).toBe('vc-owner');

			mount(() => (<Customer render={{ type: 'text', value: 'text' }} />));
			mount(() => (<Customer render={{ type: 'html', value: '<i>text</i>' }} />));
			expect(formatter.mock.calls.map(i => i[0].type)).toEqual(['number', 'text', 'html']);
		});

		it('字符串、数字、渲染函数、空值不经过', () => {
			const formatter = vi.fn(({ value }) => value);
			VcInstance.configure({ Customer: { formatter } });

			mount(() => (<Customer render="text" />));
			mount(() => (<Customer render="<i>text</i>" />));
			mount(() => (<Customer render={1} />));
			mount(() => (<Customer render={() => 'text'} />));
			mount(() => (<Customer render="" />));
			mount(() => (<Customer render={{ type: 'html', value: '' }} />));

			expect(formatter).not.toHaveBeenCalled();
		});

		it('返回空值时不输出', () => {
			VcInstance.configure({ Customer: { formatter: () => '' } });
			const wrapper = mount(() => (<Customer render={{ type: 'html', value: '<i>text</i>' }} />));

			expect(wrapper.html()).toBe('');
		});

		it('内联的 { type, value } 内容不变时不重复调用', async () => {
			const formatter = vi.fn(({ value }) => value);
			VcInstance.configure({ Customer: { formatter } });

			const count = ref(0);
			const html = ref('<i>a</i>');
			const wrapper = mount(() => (
				<div data-count={count.value}>
					<Customer render={{ type: 'html', value: html.value }} />
				</div>
			));
			expect(formatter).toHaveBeenCalledTimes(1);

			count.value++;
			await nextTick();
			expect(wrapper.attributes('data-count')).toBe('1');
			expect(formatter).toHaveBeenCalledTimes(1);

			html.value = '<i>b</i>';
			await nextTick();
			expect(wrapper.find('i').text()).toBe('b');
			expect(formatter).toHaveBeenCalledTimes(2);
		});

		it('没配置时直接输出；之后配置、再移除都即时生效', async () => {
			const wrapper = mount(() => (<Customer render={{ type: 'html', value: '<i>text</i>' }} />));
			expect(wrapper.html()).toBe('<div><i>text</i></div>');

			const formatter = vi.fn(({ value }) => value.replace('text', 'formatted'));
			VcInstance.configure({ Customer: { formatter } });
			await nextTick();
			expect(wrapper.text()).toBe('formatted');
			expect(formatter).toHaveBeenCalledTimes(1);

			VcInstance.configure({ Customer: {} });
			await nextTick();
			expect(wrapper.html()).toBe('<div><i>text</i></div>');
			expect(formatter).toHaveBeenCalledTimes(1);
		});

		it('没配置时，{ type, value } 按类型直接输出，自定义类型按文本', () => {
			expect(mount(() => (<Customer render={{ type: 'html', value: 0 }} />)).html()).toBe('<div>0</div>');
			expect(mount(() => (<Customer render={{ type: 'amount', value: 12.5 }} />)).html()).toBe('<div>12.5</div>');
			expect(mount(() => (<Customer render={{ type: 'text', value: PAYLOAD }} />)).find('img').exists()).toBe(false);
		});

		it('依赖的响应式数据或 formatter 本身变化时重新计算', async () => {
			const suffix = ref('a');
			VcInstance.configure({ Customer: { formatter: ({ value }) => `${value}${suffix.value}` } });

			const wrapper = mount(() => (<Customer render={{ type: 'html', value: '<i>text</i>' }} />));
			expect(wrapper.text()).toBe('texta');

			suffix.value = 'b';
			await nextTick();
			expect(wrapper.text()).toBe('textb');

			VcInstance.configure({ Customer: { formatter: ({ value }) => `${value}c` } });
			await nextTick();
			expect(wrapper.text()).toBe('textc');
		});
	});

	describe('sanitize', () => {
		// 仅作演示：去掉 img
		const clean = (value: string) => value.replace(/<img[^>]*>/g, '');

		it('html 类型在写入前经过，参数是 { value, instance }，可取到所属组件', () => {
			const sanitize = vi.fn(({ value }) => clean(value));
			VcInstance.configure({ sanitize });

			const Owner = defineComponent({
				name: 'vc-owner',
				setup() {
					return () => (<Customer render={{ type: 'html', value: `<b>text</b>${PAYLOAD}` }} />);
				}
			});
			const wrapper = mount(Owner);

			expect(wrapper.html()).toBe('<div><b>text</b></div>');
			expect(sanitize).toHaveBeenCalledTimes(1);
			expect(sanitize.mock.calls[0]).toHaveLength(1);
			expect(Object.keys(sanitize.mock.calls[0][0]).sort()).toEqual(['instance', 'value']);
			expect(sanitize.mock.calls[0][0].value).toBe(`<b>text</b>${PAYLOAD}`);
			expect(sanitize.mock.calls[0][0].instance.parent.type.name).toBe('vc-owner');
		});

		it('字符串、text、自定义类型、渲染函数不经过', () => {
			const sanitize = vi.fn(({ value }) => clean(value));
			VcInstance.configure({ sanitize });

			expect(mount(() => (<Customer render={PAYLOAD} />)).text()).toBe(PAYLOAD);
			expect(mount(() => (<Customer render={{ type: 'text', value: PAYLOAD }} />)).text()).toBe(PAYLOAD);
			expect(mount(() => (<Customer render={{ type: 'amount', value: PAYLOAD }} />)).text()).toBe(PAYLOAD);
			mount(() => (<Customer render={() => PAYLOAD} />));

			expect(sanitize).not.toHaveBeenCalled();
		});

		it('不含 < 和 & 的内容没有可清洗的东西，不调用；含实体时调用', () => {
			const sanitize = vi.fn(({ value }) => value);
			VcInstance.configure({ sanitize });

			mount(() => (<Customer render={{ type: 'html', value: 'plain text' }} />));
			mount(() => (<Customer render={{ type: 'html', value: 0 }} />));
			expect(sanitize).not.toHaveBeenCalled();

			mount(() => (<Customer render={{ type: 'html', value: 'a &amp; b' }} />));
			expect(sanitize).toHaveBeenCalledTimes(1);
		});

		it('在 formatter 之后：收到的是 formatter 处理过的值', () => {
			const order: string[] = [];
			const formatter = vi.fn(({ value }) => (order.push('formatter'), `${value}${PAYLOAD}`));
			const sanitize = vi.fn(({ value }) => (order.push('sanitize'), clean(value)));
			VcInstance.configure({ Customer: { formatter }, sanitize });

			// 原始值没有标记，formatter 加上了标记，仍然会被清洗
			const wrapper = mount(() => (<Customer render={{ type: 'html', value: 'text' }} />));

			expect(order).toEqual(['formatter', 'sanitize']);
			expect(sanitize.mock.calls[0][0].value).toBe(`text${PAYLOAD}`);
			expect(wrapper.html()).toBe('<div>text</div>');
		});

		it('返回空值时不输出', () => {
			VcInstance.configure({ sanitize: () => '' });
			const wrapper = mount(() => (<Customer render={{ type: 'html', value: '<i>text</i>' }} />));

			expect(wrapper.html()).toBe('');
		});

		it('内容不变时不重复调用；运行时配置、移除都即时生效', async () => {
			const count = ref(0);
			const html = ref(`<i>a</i>${PAYLOAD}`);
			const wrapper = mount(() => (
				<div data-count={count.value}>
					<Customer render={{ type: 'html', value: html.value }} />
				</div>
			));
			expect(wrapper.find('img').exists()).toBe(true);

			const sanitize = vi.fn(({ value }) => clean(value));
			VcInstance.configure({ sanitize });
			await nextTick();
			expect(wrapper.find('img').exists()).toBe(false);
			expect(sanitize).toHaveBeenCalledTimes(1);

			// 父级重渲染：{ type, value } 是新对象，内容没变
			count.value++;
			await nextTick();
			expect(wrapper.attributes('data-count')).toBe('1');
			expect(sanitize).toHaveBeenCalledTimes(1);

			html.value = `<i>b</i>${PAYLOAD}`;
			await nextTick();
			expect(wrapper.find('i').text()).toBe('b');
			expect(sanitize).toHaveBeenCalledTimes(2);

			VcInstance.configure({ sanitize: void 0 });
			await nextTick();
			expect(wrapper.find('img').exists()).toBe(true);
			expect(sanitize).toHaveBeenCalledTimes(2);
		});

		it('依赖的响应式数据变化时重新清洗', async () => {
			const strict = ref(false);
			VcInstance.configure({ sanitize: ({ value }) => (strict.value ? clean(value) : value) });

			const wrapper = mount(() => (<Customer render={{ type: 'html', value: `<i>a</i>${PAYLOAD}` }} />));
			expect(wrapper.find('img').exists()).toBe(true);

			strict.value = true;
			await nextTick();
			expect(wrapper.find('img').exists()).toBe(false);
		});
	});
});
