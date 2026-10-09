import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type ApiError, ERROR_CODES } from '@nextjourney/contracts';
import type { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

import { AppError } from './app-error.js';

const STATUS_TO_CODE: Record<number, string> = {
  400: ERROR_CODES.VALIDATION_ERROR,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  429: ERROR_CODES.RATE_LIMITED,
};

type RequestWithId = Request & { id?: string | number };

/** Padroniza toda resposta de erro em { code, message, requestId }. 5xx nunca vaza detalhes. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<RequestWithId>();
    const requestId = request.id === undefined ? undefined : String(request.id);

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiError = {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Erro interno',
      ...(requestId ? { requestId } : {}),
    };

    if (exception instanceof AppError) {
      status = exception.getStatus();
      body = {
        code: exception.code,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
        ...(requestId ? { requestId } : {}),
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = {
        code: STATUS_TO_CODE[status] ?? ERROR_CODES.INTERNAL_ERROR,
        message: status >= 500 ? 'Erro interno' : exception.message,
        ...(requestId ? { requestId } : {}),
      };
    } else {
      // Erro inesperado: registra com stack (sem corpo da requisição) e responde genérico
      this.logger.error({ err: exception, requestId }, 'Erro não tratado');
    }

    response.status(status).json(body);
  }
}
