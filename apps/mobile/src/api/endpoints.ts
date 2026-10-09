import {
  type AuthResponse,
  authResponseSchema,
  type CheckResult,
  checkResultSchema,
  type CreateItemRequest,
  type Item,
  itemSchema,
  type ItemType,
  type LoginRequest,
  type MeResponse,
  meResponseSchema,
  type RegisterRequest,
} from '@nextjourney/contracts';
import { z } from 'zod';

import { http } from './client';

// Toda resposta é validada com o schema do contrato: não confiamos no que chega pela rede.

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await http.post<unknown>('/auth/login', body);
  return authResponseSchema.parse(data);
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const { data } = await http.post<unknown>('/auth/register', body);
  return authResponseSchema.parse(data);
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post('/auth/logout', { refreshToken });
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await http.get<unknown>('/me');
  return meResponseSchema.parse(data);
}

export async function fetchItems(type: ItemType): Promise<Item[]> {
  const { data } = await http.get<unknown>('/items', { params: { type } });
  return z.array(itemSchema).parse(data);
}

export async function createItem(body: CreateItemRequest): Promise<Item> {
  const { data } = await http.post<unknown>('/items', body);
  return itemSchema.parse(data);
}

export async function checkItem(itemId: string, checkId: string): Promise<CheckResult> {
  const { data } = await http.post<unknown>(`/items/${itemId}/checks`, { checkId });
  return checkResultSchema.parse(data);
}

export async function undoCheck(itemId: string, checkId: string): Promise<CheckResult> {
  const { data } = await http.delete<unknown>(`/items/${itemId}/checks/${checkId}`);
  return checkResultSchema.parse(data);
}
