import {
  type Achievement,
  achievementSchema,
  type AppEvent,
  type AuthResponse,
  authResponseSchema,
  type Category,
  categorySchema,
  type Character,
  type CheckResult,
  checkResultSchema,
  type CreateCategoryRequest,
  type CreateItemRequest,
  type DeleteAccountRequest,
  type ForgotPasswordRequest,
  type HistoryResponse,
  historyResponseSchema,
  type HomeResponse,
  homeResponseSchema,
  type Item,
  itemSchema,
  type ItemType,
  type LoginRequest,
  type MeResponse,
  meResponseSchema,
  type PatchMeRequest,
  type RegisterRequest,
  type RegisterResponse,
  registerResponseSchema,
  type ResendVerificationRequest,
  type ResetPasswordRequest,
  type SocialLoginRequest,
  type StorySummary,
  storySummarySchema,
  type Timeline,
  timelineSchema,
  type UpdateCategoryRequest,
  type UpdateItemRequest,
  type VerifyEmailRequest,
} from '@nextjourney/contracts';
import { z } from 'zod';

import { http } from './client';

// Toda resposta é validada com o schema do contrato: não confiamos no que chega pela rede.

// --- auth
export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await http.post<unknown>('/auth/login', body);
  return authResponseSchema.parse(data);
}

/** O cadastro não devolve sessão: a pessoa confirma o e-mail com o código e só então entra. */
export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await http.post<unknown>('/auth/register', body);
  return registerResponseSchema.parse(data);
}

export async function verifyEmail(body: VerifyEmailRequest): Promise<AuthResponse> {
  const { data } = await http.post<unknown>('/auth/verify-email', body);
  return authResponseSchema.parse(data);
}

export async function resendVerification(body: ResendVerificationRequest): Promise<void> {
  await http.post('/auth/resend-verification', body);
}

export async function socialLogin(
  provider: 'google' | 'apple',
  body: SocialLoginRequest,
): Promise<AuthResponse> {
  const { data } = await http.post<unknown>(`/auth/${provider}`, body);
  return authResponseSchema.parse(data);
}

export async function forgotPassword(body: ForgotPasswordRequest): Promise<void> {
  await http.post('/auth/forgot-password', body);
}

export async function resetPassword(body: ResetPasswordRequest): Promise<void> {
  await http.post('/auth/reset-password', body);
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post('/auth/logout', { refreshToken });
}

// --- perfil e onboarding
export async function fetchMe(): Promise<MeResponse> {
  const { data } = await http.get<unknown>('/me');
  return meResponseSchema.parse(data);
}

/** Exclui a conta (anonimiza agora, apaga de vez depois do prazo de retenção). */
export async function deleteAccount(proof: DeleteAccountRequest): Promise<void> {
  await http.delete('/me', { data: proof });
}

export async function patchMe(body: PatchMeRequest): Promise<MeResponse> {
  const { data } = await http.patch<unknown>('/me', body);
  return meResponseSchema.parse(data);
}

export async function putCharacter(body: Character): Promise<void> {
  await http.put('/me/character', body);
}

/** Confirma que o aviso (modal) destas conquistas foi mostrado. */
export async function ackAchievements(slugs: string[]): Promise<void> {
  await http.post('/achievements/ack', { slugs });
}

/** Informa um fato do aparelho que o servidor não observa (ex.: lembrete diário ativado). */
export async function sendAppEvent(type: AppEvent['type']): Promise<void> {
  await http.post('/me/events', { type });
}

export async function fetchCosmetics(): Promise<string[]> {
  const { data } = await http.get<unknown>('/me/cosmetics');
  return z.object({ cosmetics: z.array(z.string()) }).parse(data).cosmetics;
}

// --- histórias
export async function fetchStories(): Promise<StorySummary[]> {
  const { data } = await http.get<unknown>('/stories');
  return z.array(storySummarySchema).parse(data);
}

export async function chooseStory(slug: string): Promise<StorySummary> {
  const { data } = await http.put<unknown>('/me/story', { slug });
  return storySummarySchema.parse(data);
}

export async function fetchStoryTimeline(slug: string): Promise<Timeline> {
  const { data } = await http.get<unknown>(`/stories/${encodeURIComponent(slug)}/timeline`);
  return timelineSchema.parse(data);
}

export async function fetchTimeline(): Promise<Timeline> {
  const { data } = await http.get<unknown>('/me/story/timeline');
  return timelineSchema.parse(data);
}

// --- itens
export async function fetchItems(type: ItemType): Promise<Item[]> {
  const { data } = await http.get<unknown>('/items', { params: { type } });
  return z.array(itemSchema).parse(data);
}

/** Tarefas concluídas (histórico do perfil), da mais recente para a mais antiga, por página. */
export async function fetchHistory(before?: string): Promise<HistoryResponse> {
  const { data } = await http.get<unknown>('/items/history', {
    params: before ? { before } : {},
  });
  return historyResponseSchema.parse(data);
}

export async function createItem(body: CreateItemRequest): Promise<Item> {
  const { data } = await http.post<unknown>('/items', body);
  return itemSchema.parse(data);
}

export async function updateItem(id: string, body: UpdateItemRequest): Promise<Item> {
  const { data } = await http.patch<unknown>(`/items/${id}`, body);
  return itemSchema.parse(data);
}

export async function deleteItem(id: string): Promise<void> {
  await http.delete(`/items/${id}`);
}

export async function checkItem(itemId: string, checkId: string): Promise<CheckResult> {
  const { data } = await http.post<unknown>(`/items/${itemId}/checks`, { checkId });
  return checkResultSchema.parse(data);
}

export async function undoCheck(itemId: string, checkId: string): Promise<CheckResult> {
  const { data } = await http.delete<unknown>(`/items/${itemId}/checks/${checkId}`);
  return checkResultSchema.parse(data);
}

// --- categorias
export async function fetchCategories(): Promise<Category[]> {
  const { data } = await http.get<unknown>('/categories');
  return z.array(categorySchema).parse(data);
}

export async function createCategory(body: CreateCategoryRequest): Promise<Category> {
  const { data } = await http.post<unknown>('/categories', body);
  return categorySchema.parse(data);
}

export async function updateCategory(id: string, body: UpdateCategoryRequest): Promise<Category> {
  const { data } = await http.patch<unknown>(`/categories/${id}`, body);
  return categorySchema.parse(data);
}

export async function deleteCategory(id: string, moveTo?: string): Promise<void> {
  await http.delete(`/categories/${id}`, { params: moveTo ? { moveTo } : {} });
}

// --- home e conquistas
export async function fetchHome(): Promise<HomeResponse> {
  const { data } = await http.get<unknown>('/home');
  return homeResponseSchema.parse(data);
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const { data } = await http.get<unknown>('/achievements');
  return z.array(achievementSchema).parse(data);
}
