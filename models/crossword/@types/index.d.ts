import { CrosswordEntry } from '@app-frontend/models/crossword/CrosswordEntry';
import { EntryClue } from '@app-frontend/models/crossword/EntryClue';
import { PositionValue } from '@app-frontend/models/crossword/PositionValue';
import { PositionValueMetadata } from '@app-frontend/models/crossword/PositionValueMetadata';

export type TCrosswordDirection = 'across' | 'down';
export type TCrosswordPuzzleMode = 'publish' | 'solve';
export type TCrosswordPuzzleEditingMode = 'overwrite' | 'empty';

export interface ICrosswordPuzzleDataDimensions {
  width: number;
  height: number;
}

export interface ICrosswordPuzzleDataClues {
  // e.g. 1-across: clue description
  [EntryIDValue: string]: EntryClue | undefined;
}

export interface ICrosswordPuzzleDataValues {
  // e.g. 0,0: "a"
  // 0,3: "b"
  [PositionIDValue: string]: PositionValue | undefined;
}

export interface ICrosswordPuzzleDataPlayerValues {
  // e.g. 0,0: "a"
  // 0,3: "b"
  [PositionIDValue: string]: PositionValue | undefined;
}

export interface ICrosswordPuzzleDataPlayerValuesMetadata {
  // e.g. 0,0: "a"
  // 0,3: "b"
  [PositionIDValue: string]: PositionValueMetadata | undefined;
}

export interface ICrosswordPuzzleDataEntries {
  across: CrosswordEntry[];
  down: CrosswordEntry[];
}

export interface ICrosswordPublisherDataModel {
  uuid: string;
  dimensions: ICrosswordPuzzleDataDimensions;
  values: ICrosswordPuzzleDataValues;
  playerValues: ICrosswordPuzzleDataPlayerValues;
  playerValuesMetadata: ICrosswordPuzzleDataPlayerValuesMetadata;
  entries: ICrosswordPuzzleDataEntries;
  clues: ICrosswordPuzzleDataClues;
}

export interface ICrosswordSolverDataModel {
  uuid: string;
  dimensions: ICrosswordPuzzleDataDimensions;
  values: ICrosswordPuzzleDataValues;
  playerValues: ICrosswordPuzzleDataPlayerValues;
  playerValuesMetadata: ICrosswordPuzzleDataPlayerValuesMetadata;
  entries: ICrosswordPuzzleDataEntries;
  clues: ICrosswordPuzzleDataClues;
}
