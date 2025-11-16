/**
 * IPC通信のZodスキーマ定義
 * 実行時バリデーション用
 */

import { z } from 'zod';
import { ErrorCode } from './ipc';

// ============================================================================
// 共通スキーマ
// ============================================================================

export const IPCErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const IPCSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const IPCFailureSchema = z.object({
  success: z.literal(false),
  error: IPCErrorSchema,
});

// ============================================================================
// モデル管理スキーマ
// ============================================================================

export const ModelInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.enum(['ollama', 'lmstudio', 'llamacpp']),
  contextWindow: z.number().int().positive().optional(),
});

export const ModelsListRequestSchema = z.object({
  refresh: z.boolean().optional(),
});

export const ModelsListResponseSchema = z.union([
  IPCSuccessSchema(
    z.object({
      models: z.array(ModelInfoSchema),
      defaultModel: z.string().optional(),
    })
  ),
  IPCFailureSchema,
]);

export const ModelsAddRequestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.enum(['ollama', 'lmstudio', 'llamacpp']),
  baseUrl: z.string().url().optional(),
});

export const ModelsRemoveRequestSchema = z.object({
  id: z.string().min(1),
});

// ============================================================================
// LLM操作スキーマ
// ============================================================================

export const FormatOptionsSchema = z.object({
  removeFillers: z.boolean().optional(),
  inferParagraphs: z.boolean().optional(),
  makeBulletPoints: z.boolean().optional(),
  customInstruction: z.string().max(500).optional(),
});

export const LLMFormatRequestSchema = z.object({
  text: z.string().min(1).max(20000),
  modelId: z.string().min(1),
  options: FormatOptionsSchema.optional(),
});

export const LLMFormatResponseSchema = z.union([
  IPCSuccessSchema(
    z.object({
      formattedText: z.string(),
      modelUsed: z.string(),
      timestamp: z.number(),
    })
  ),
  IPCFailureSchema,
]);

// ============================================================================
// クリップボードスキーマ
// ============================================================================

export const ClipboardCopyRequestSchema = z.object({
  text: z.string().min(1),
});

export const ClipboardCopyResponseSchema = z.union([
  IPCSuccessSchema(z.object({ copied: z.boolean() })),
  IPCFailureSchema,
]);

// ============================================================================
// 永続化スキーマ
// ============================================================================

export const StoreKeySchema = z.enum([
  'selectedModel',
  'defaultModel',
  'maxHistoryItems',
  'formatOptions',
  'llmBaseUrl',
  'llmApiKey',
]);

export const StoreGetRequestSchema = z.object({
  key: StoreKeySchema,
});

export const StoreSetRequestSchema = z.object({
  key: StoreKeySchema,
  value: z.unknown(),
});

export const HistoryItemSchema = z.object({
  id: z.string().min(1),
  originalText: z.string(),
  formattedText: z.string(),
  modelUsed: z.string(),
  timestamp: z.number(),
  options: FormatOptionsSchema.optional(),
});

export const StoreSaveHistoryRequestSchema = z.object({
  item: HistoryItemSchema,
});

// ============================================================================
// 型ガード関数
// ============================================================================

export function isIPCSuccess<T>(
  response: unknown
): response is { success: true; data: T } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true &&
    'data' in response
  );
}

export function isIPCFailure(
  response: unknown
): response is { success: false; error: { code: string; message: string; details?: unknown } } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}

