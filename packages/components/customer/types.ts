import type { SetupContext, PropType } from 'vue';

export type Render = PropType<(props: Record<string, unknown>, context: SetupContext) => any>;
