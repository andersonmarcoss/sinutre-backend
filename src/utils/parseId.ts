import { HttpError } from '../middlewares/error.middleware';

export function parsePositiveId(raw: string, label = 'ID'): number {
  const id = Number(raw);
  if (!raw.trim() || !Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${label} inválido.`);
  }
  return id;
}