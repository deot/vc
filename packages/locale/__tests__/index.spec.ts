import { enUS, zhCN } from '@deot/vc-locale';

describe('locale', () => {
	it('exports side-effect free language data', () => {
		expect(zhCN).toEqual({
			name: 'zh-CN',
			vc: {}
		});
		expect(enUS).toEqual({
			name: 'en-US',
			vc: {}
		});
	});
});
