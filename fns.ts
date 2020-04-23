import { IReduxStateCrosswordDataSolver } from '@app-frontend/models/crossword/@types/redux';
import { Cell } from '@app-frontend/models/crossword/Cell';
import { CrosswordEntry } from '@app-frontend/models/crossword/CrosswordEntry';
import { EntryID } from '@app-frontend/models/crossword/EntryID';
import { PositionID } from '@app-frontend/models/crossword/PositionID';
import { PositionValue } from '@app-frontend/models/crossword/PositionValue';
import { PositionValueMetadata } from '@app-frontend/models/crossword/PositionValueMetadata';
import * as helpers from '@app-frontend/models/crossword/utils/helpers';
import * as selectors from './selectors';

export const focusOnCell = (
  crosswordDataState: Readonly<IReduxStateCrosswordDataSolver>,
  cell: Cell,
  entryId?: EntryID // provide entryId if you want the focused entry to be in a specific direction
): IReduxStateCrosswordDataSolver => {
  helpers.checkCoordinatesAndThrowIfOutOfBounds(crosswordDataState.model, cell);

  // only move to cells that have published values
  if (!helpers.cellHasPublishedValue(crosswordDataState.model, cell)) {
    throw new Error(
      `Cannot focus on cell without published value: cell requested = x: ${cell.x}, y: ${cell.y}`
    );
  }

  // skip revealed cells
  const positionId = new PositionID({ cell });
  const valueMetadata = crosswordDataState.valuesMetadata[positionId.value];
  if (valueMetadata) {
    if (
      valueMetadata.$show_cell_value ||
      valueMetadata.$show_cell_value_because_entry
    ) {
      return crosswordDataState;
    }
  }

  let newFocusEntry: CrosswordEntry | undefined;
  const cellEntries = selectors.cellEntries(crosswordDataState, cell);
  if (cellEntries.length === 0) {
    throw new Error(`could not get entries for x:${cell.x}, y:${cell.y};`);
  }

  if (entryId) {
    newFocusEntry = cellEntries.filter(
      entry => entry.direction === entryId.direction
    )[0];
  } else {
    const cellEntryInFocusedDirection: CrosswordEntry = cellEntries.filter(
      entry => entry.direction === crosswordDataState.focusedEntry.direction
    )[0];

    newFocusEntry = cellEntryInFocusedDirection || cellEntries[0];
  }

  if (!newFocusEntry) {
    throw new Error(
      `could not get entry for x:${cell.x}, y:${cell.y}; entryId = ${entryId?.value}`
    );
  }

  return {
    ...crosswordDataState,
    focusedCell: cell.serialize(),
    focusedEntry: newFocusEntry.serialize(),
  };
};

export const focusOnEntry = (
  crosswordDataState: Readonly<IReduxStateCrosswordDataSolver>,
  entryId: EntryID,
  focus_on_first_cell_if_no_empty: boolean,
  precedence: 'start' | 'end' // what empty cell to give precedence on in case editing_mode is empty
): IReduxStateCrosswordDataSolver => {
  let newCrosswordDataState = crosswordDataState;

  // entry must be valid
  const entry: CrosswordEntry = selectors.getCrosswordEntry(
    newCrosswordDataState,
    entryId
  );

  if (newCrosswordDataState.editing_mode === 'empty') {
    const cellWithoutPlayerValue: Cell | undefined =
      precedence === 'start'
        ? selectors.getCrosswordEntryFirstCellWithoutPlayerValues(
            newCrosswordDataState,
            entryId
          )
        : selectors.getCrosswordEntryLastCellWithPlayerValues(
            newCrosswordDataState,
            entryId
          );

    if (cellWithoutPlayerValue) {
      newCrosswordDataState = {
        ...newCrosswordDataState,
        ...focusOnCell(newCrosswordDataState, cellWithoutPlayerValue, entryId),
      };
    } else if (focus_on_first_cell_if_no_empty) {
      newCrosswordDataState = {
        ...newCrosswordDataState,
        ...focusOnCell(newCrosswordDataState, entry.start, entryId),
      };
    }
  } else {
    newCrosswordDataState = {
      ...newCrosswordDataState,
      ...focusOnCell(newCrosswordDataState, entry.start, entryId),
    };
  }

  return newCrosswordDataState;
};

export const fillPlayerCellsWithCorrectValues = (
  crosswordDataState: Readonly<IReduxStateCrosswordDataSolver>,
  cells: Cell[]
): IReduxStateCrosswordDataSolver => {
  const newCrosswordState = {
    ...crosswordDataState,
  };

  cells.map(cell => {
    // only if this cell has a published value
    if (helpers.cellHasPublishedValue(crosswordDataState.model, cell)) {
      const positionId = new PositionID({ cell });
      const value = helpers.getCellPublishedValue(
        newCrosswordState.model,
        cell
      ) as PositionValue;
      newCrosswordState.playerValues = {
        ...newCrosswordState.playerValues,
        [positionId.value]: value.serialize(),
      };

      newCrosswordState.playerValuesMetadata = {
        ...newCrosswordState.playerValuesMetadata,
        [positionId.value]: new PositionValueMetadata({
          time: new Date().getTime(),
        }).serialize(),
      };
    }
  });
  return newCrosswordState;
};

export const clearPlayerCells = (
  crosswordDataState: Readonly<IReduxStateCrosswordDataSolver>,
  cells: Cell[]
): IReduxStateCrosswordDataSolver => {
  const newCrosswordState = {
    ...crosswordDataState,
  };

  cells
    .filter(cell => {
      // skip revealed cells
      const positionId = new PositionID({ cell });
      const valueMetadata = crosswordDataState.valuesMetadata[positionId.value];
      if (valueMetadata) {
        if (
          valueMetadata.$show_cell_value ||
          valueMetadata.$show_cell_value_because_entry
        ) {
          return false;
        }
      }

      return true;
    })
    .map(cell => {
      // only if this cell has a published value
      if (helpers.cellHasPublishedValue(crosswordDataState.model, cell)) {
        const positionId = new PositionID({ cell });
        newCrosswordState.playerValues = {
          ...newCrosswordState.playerValues,
          [positionId.value]: new PositionValue({ value: '' }).serialize(),
        };

        newCrosswordState.playerValuesMetadata = {
          ...newCrosswordState.playerValuesMetadata,
          [positionId.value]: new PositionValueMetadata({
            time: new Date().getTime(),
          }).serialize(),
        };
      }
    });
  return newCrosswordState;
};
