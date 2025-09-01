import { Portal } from '../..';
import Wrapper from './wrapper.vue';

export const Alive = new Portal(Wrapper, {
	alive: true
});
