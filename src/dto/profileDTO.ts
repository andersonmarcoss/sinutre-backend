import { LevelChoice } from '../constants/enums';

export interface SaveProfileDTO {
  targetDietDaily: number;
  height: number;
  weight: number;
  levelActivity: LevelChoice;
}