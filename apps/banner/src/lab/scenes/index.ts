import { beach } from './beach';
import { cabin } from './cabin';
import { castle } from './castle';
import { hell } from './hell';
import { paradise } from './paradise';
import { rooftop } from './rooftop';
import type { SceneDef } from './types';
import { zombie } from './zombie';

/** Cenários do QG disponíveis no laboratório. */
export const SCENES: SceneDef[] = [cabin, beach, rooftop, zombie, castle, paradise, hell];
