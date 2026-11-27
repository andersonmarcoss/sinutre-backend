import { LEVEL_CHOICES, LevelChoice } from '../constants/enums';
import { SaveProfileDTO } from '../dto/profileDTO';
import { HttpError } from '../middlewares/error.middleware';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateProfile(body: unknown): SaveProfileDTO {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Dados inválidos.');
  }

  const raw = body as Record<string, unknown>;
  const fields: Record<string, string> = {};

  // 1. Meta calórica (Int no banco)
  if (raw.targetDietDaily === undefined || raw.targetDietDaily === null || raw.targetDietDaily === '') {
    fields.targetDietDaily = 'Meta calórica é obrigatória.';
  } else if (!isFiniteNumber(raw.targetDietDaily) || !Number.isInteger(raw.targetDietDaily)) {
    fields.targetDietDaily = 'Meta calórica deve ser um número inteiro.';
  } else if (raw.targetDietDaily < 500 || raw.targetDietDaily > 10000) {
    fields.targetDietDaily = 'Meta calórica deve estar entre 500 e 10.000 kcal.';
  }

  // 2. Altura em cm (Float no banco)
  if (raw.height === undefined || raw.height === null || raw.height === '') {
    fields.height = 'Altura é obrigatória.';
  } else if (!isFiniteNumber(raw.height)) {
    fields.height = 'Altura deve ser um número válido.';
  } else if (raw.height < 50 || raw.height > 272) {
    fields.height = 'Altura deve estar entre 50 e 272 cm.';
  }

  // 3. Peso em kg (Float no banco)
  if (raw.weight === undefined || raw.weight === null || raw.weight === '') {
    fields.weight = 'Peso é obrigatório.';
  } else if (!isFiniteNumber(raw.weight)) {
    fields.weight = 'Peso deve ser um número válido.';
  } else if (raw.weight < 20 || raw.weight > 500) {
    fields.weight = 'Peso deve estar entre 20 e 500 kg.';
  }

  // 4. Nível de atividade física (obrigatório na tabela HealthData)
  const levelActivity = raw.levelActivity ?? 'SEDENTARIO';
  if (
    typeof levelActivity !== 'string' ||
    !LEVEL_CHOICES.includes(levelActivity as LevelChoice)
  ) {
    fields.levelActivity = 'Nível de atividade inválido.';
  }

  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, 'Dados inválidos.', fields);
  }

  return {
    targetDietDaily: raw.targetDietDaily as number,
    height: raw.height as number,
    weight: raw.weight as number,
    levelActivity: levelActivity as LevelChoice,
  };
}