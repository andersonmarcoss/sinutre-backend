import { CreateFoodDTO } from '../dto/foodDTO';
import { HttpError } from '../middlewares/error.middleware';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateRange(
  raw: Record<string, unknown>,
  key: keyof Omit<CreateFoodDTO, 'name'>,
  label: string,
  max: number,
  fields: Record<string, string>,
): number | null {
  const value = raw[key];

  if (value === undefined || value === null || value === '') {
    fields[key] = `${label} é obrigatório.`;
    return null;
  }

  if (!isFiniteNumber(value)) {
    fields[key] = `${label} deve ser um número válido.`;
    return null;
  }

  if (value < 0 || value > max) {
    fields[key] = `${label} deve estar entre 0 e ${max}.`;
    return null;
  }

  return value;
}

export function validateFood(body: unknown): CreateFoodDTO {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Dados inválidos.');
  }

  const raw = body as Record<string, unknown>;
  const fields: Record<string, string> = {};

  let trimmedName = '';
  if (typeof raw.name !== 'string' || !raw.name.trim()) {
    fields.name = 'Nome do alimento é obrigatório.';
  } else {
    trimmedName = raw.name.trim();
    if (trimmedName.length > 100) {
      fields.name = 'Nome deve ter no máximo 100 caracteres.';
    }
  }

  const caloriesPer100g = validateRange(
    raw,
    'caloriesPer100g',
    'Calorias por 100g',
    900,
    fields,
  );
  const carbsPer100g = validateRange(
    raw,
    'carbsPer100g',
    'Carboidratos por 100g',
    100,
    fields,
  );
  const proteinPer100g = validateRange(
    raw,
    'proteinPer100g',
    'Proteínas por 100g',
    100,
    fields,
  );
  const fatPer100g = validateRange(
    raw,
    'fatPer100g',
    'Gorduras por 100g',
    100,
    fields,
  );

  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, 'Dados inválidos.', fields);
  }

  const macrosSum = carbsPer100g! + proteinPer100g! + fatPer100g!;
  if (macrosSum > 100) {
    throw new HttpError(
      400,
      'A soma de carboidratos, proteínas e gorduras não pode ultrapassar 100 g por 100 g.',
    );
  }

  return {
    name: trimmedName,
    caloriesPer100g: caloriesPer100g!,
    carbsPer100g: carbsPer100g!,
    proteinPer100g: proteinPer100g!,
    fatPer100g: fatPer100g!,
  };
}