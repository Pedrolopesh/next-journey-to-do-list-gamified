import { beach } from './beach';
import { cabin } from './cabin';
import { castle } from './castle';
import { hell } from './hell';
import { paradise } from './paradise';
import { rooftop } from './rooftop';
import type { SceneDef } from './types';
import { zombie } from './zombie';

/** HQ scenes available in the lab. */
export const SCENES: SceneDef[] = [cabin, beach, rooftop, zombie, castle, paradise, hell];
