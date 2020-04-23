import {
  ICrosswordPublisherDataModel,
  ICrosswordPuzzleDataDimensions,
  ICrosswordSolverDataModel,
  TCrosswordPuzzleEditingMode,
  TCrosswordPuzzleMode,
} from '@app-frontend/models/crossword/@types/index';
import { Cell } from '@app-frontend/models/crossword/Cell';
import { CrosswordEntry } from '@app-frontend/models/crossword/CrosswordEntry';
import { EntryClue } from '@app-frontend/models/crossword/EntryClue';
import { EntryMetadata } from '@app-frontend/models/crossword/EntryMetadata';
import { PositionValue } from '@app-frontend/models/crossword/PositionValue';
import { PositionValueMetadata } from '@app-frontend/models/crossword/PositionValueMetadata';
import { ValueMetadata } from '@app-frontend/models/crossword/ValueMetadata';

export interface IReduxStateCrosswordDataPublisher {
  mode: TCrosswordPuzzleMode;
  uuid: string;
  dimensions: ICrosswordPuzzleDataDimensions;
  values: {
    [PositionIDValue: string]:
      | ReturnType<PositionValue['serialize']>
      | undefined;
  };
  entries: {
    across: ReturnType<CrosswordEntry['serialize']>[];
    down: ReturnType<CrosswordEntry['serialize']>[];
  };
  clues: {
    [EntryIDValue: string]: ReturnType<EntryClue['serialize']> | undefined;
  };
  lastPosition: ReturnType<Cell['serialize']>;
  focus: {
    [PositionIDValue: string]: boolean | undefined;
  };
  model: ICrosswordPublisherDataModel;
}

export interface IReduxStateCrosswordDataSolver {
  initialized: boolean;
  uuid: string;
  mode: TCrosswordPuzzleMode;
  editing_mode: TCrosswordPuzzleEditingMode;
  is_complete: boolean;
  is_at_intersection: boolean;
  strict_mode: boolean;
  dimensions: ICrosswordPuzzleDataDimensions;
  hasRevealedAny: boolean;
  hasRevealedAll: boolean;
  playerValues: {
    [PositionIDValue: string]:
      | ReturnType<PositionValue['serialize']>
      | undefined;
  };
  playerValuesMetadata: {
    [PositionIDValue: string]:
      | ReturnType<PositionValueMetadata['serialize']>
      | undefined;
  };
  playerActions: {
    cell_checks: string[]; // e.g. [0,0 , 0,1]
    cell_reveals: string[]; // e.g. [0,0 , 0,1]
    entry_checks: string[]; // e.g. [1-across , 2-across]
    entry_reveals: string[]; // e.g. [1-across , 2-across]
  };
  values: {
    [PositionIDValue: string]:
      | ReturnType<PositionValue['serialize']>
      | undefined;
  };
  valuesMetadata: {
    [PositionIDValue: string]:
      | ReturnType<ValueMetadata['serialize']>
      | undefined;
  };
  entries: {
    across: ReturnType<CrosswordEntry['serialize']>[];
    down: ReturnType<CrosswordEntry['serialize']>[];
  };
  entriesMetadata: {
    [EntryIDValue: string]: ReturnType<EntryMetadata['serialize']> | undefined;
  };
  clues: {
    [EntryIDValue: string]: ReturnType<EntryClue['serialize']> | undefined;
  };
  focusedCell: ReturnType<Cell['serialize']>;
  previousCellInEntry?: ReturnType<Cell['serialize']>;
  nextCellInEntry?: ReturnType<Cell['serialize']>;
  previousEmptyCellInEntry?: ReturnType<Cell['serialize']>;
  nextEmptyCellInEntry?: ReturnType<Cell['serialize']>;
  northCellInSameLine?: ReturnType<Cell['serialize']>;
  southCellInSameLine?: ReturnType<Cell['serialize']>;
  eastCellInSameLine?: ReturnType<Cell['serialize']>;
  westCellInSameLine?: ReturnType<Cell['serialize']>;
  focusedEntry: ReturnType<CrosswordEntry['serialize']>;
  previousEntry: ReturnType<CrosswordEntry['serialize']>;
  nextEntry: ReturnType<CrosswordEntry['serialize']>;
  previousIncompleteEntry?: ReturnType<CrosswordEntry['serialize']>;
  nextIncompleteEntry?: ReturnType<CrosswordEntry['serialize']>;
  model: ICrosswordSolverDataModel;
}
