import { Utils } from '@deot/dev-test';
import { VcInstance } from '../../instance';

/**
 * 真实点击 target，之后在同一个任务里打开弹层即从它展开。先等到下一个任务并用掉之前的点击记录，各步互不影响
 * @param target 点击的目标；null 表示这次没有点击
 */
export const clickOn = async (target: EventTarget | null) => {
	await Utils.sleep(0);
	VcInstance.getTriggerElement();
	target?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};
