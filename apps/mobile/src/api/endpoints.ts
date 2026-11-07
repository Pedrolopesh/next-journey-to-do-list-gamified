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
  type DataExport,
  type DeleteAccountRequest,
  type EmailConfirmRequest,
  type EmailStartRequest,
  type HistoryResponse,
  historyResponseSchema,
  type HomeResponse,
  homeResponseSchema,
  type Item,
  itemSchema,
  type ItemType,
  type MeResponse,
  meResponseSchema,
  type PatchMeRequest,
  type Session,
  sessionsResponseSchema,
  type SocialLoginRequest,
  type StorySummary,
  storySummarySchema,
  type Timeline,
  timelineSchema,
  type UpdateCategoryRequest,
  type UpdateItemRequest,
} from '@nextjourney/contracts';
import { z } from 'zod';

import { http } from './client';

// Every response is validated with the contract schema: we do not trust what comes over the network.

// --- auth
/** Passwordless entry: asks for the 6-digit code (always 202, whether or not the account exists). */
export async function emailStart(body: EmailStartRequest): Promise<void> {
  await http.post('/auth/email/start', body);
}

export async function emailConfirm(body: EmailConfirmRequest): Promise<AuthResponse> {
  const { data } = await http.post<unknown>('/auth/email/confirm', body);
  return authResponseSchema.parse(data);
}

export async function socialLogin(
  provider: 'google' | 'apple',
  body: SocialLoginRequest,
): Promise<AuthResponse> {
  const { data } = await http.post<unknown>(`/auth/${provider}`, body);
  return authResponseSchema.parse(data);
}

// --- account sessions (devices)
export async function fetchSessions(): Promise<Session[]> {
  const { data } = await http.get<unknown>('/me/sessions');
  return sessionsResponseSchema.parse(data).sessions;
}

export async function revokeSession(id: string): Promise<void> {
  await http.delete(`/me/sessions/${id}`);
}

export async function revokeAllSessions(): Promise<void> {
  await http.delete('/me/sessions');
}

/** Export of the account's own data (LGPD). */
export async function fetchDataExport(): Promise<DataExport> {
  // Not validated on the client: the app only passes the file along, and a new API field must not block the export
  const { data } = await http.get<DataExport>('/me/export');
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post('/auth/logout', { refreshToken });
}

// --- profile and onboarding
export async function fetchMe(): Promise<MeResponse> {
  const { data } = await http.get<unknown>('/me');
  return meResponseSchema.parse(data);
}

/** Deletes the account (anonymizes now, erases for good after the retention period). */
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

/** Confirms that the notice (modal) for these achievements was shown. */
export async function ackAchievements(slugs: string[]): Promise<void> {
  await http.post('/achievements/ack', { slugs });
}

/** Reports a fact about the device that the server does not observe (e.g. daily reminder turned on). */
export async function sendAppEvent(type: AppEvent['type']): Promise<void> {
  await http.post('/me/events', { type });
}

export async function fetchCosmetics(): Promise<string[]> {
  const { data } = await http.get<unknown>('/me/cosmetics');
  return z.object({ cosmetics: z.array(z.string()) }).parse(data).cosmetics;
}

// --- stories
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

// --- items
export async function fetchItems(type: ItemType): Promise<Item[]> {
  const { data } = await http.get<unknown>('/items', { params: { type } });
  return z.array(itemSchema).parse(data);
}

/** Completed tasks (profile history), most recent first, paged. */
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

// --- categories
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

// --- home and achievements
export async function fetchHome(): Promise<HomeResponse> {
  const { data } = await http.get<unknown>('/home');
  return homeResponseSchema.parse(data);
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const { data } = await http.get<unknown>('/achievements');
  return z.array(achievementSchema).parse(data);
}
