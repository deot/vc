import { MSteps } from './mobile/steps.ts';
import { Step } from './step.tsx';
import './style.scss';
import './mobile/style.scss';

// Step 两端相同：尺寸由 Steps 根节点上的局部变量决定
export const MStep = Step;

export {
	MSteps
};
