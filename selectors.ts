import {
  ICrosswordSolverDataModel,
  TCrosswordDirection,
} from '@app-frontend/models/crossword/@types';
import { IReduxStateCrosswordDataSolver } from '@app-frontend/models/crossword/@types/redux';
import { Cell } from '@app-frontend/models/crossword/Cell';
import { CrosswordEntry } from '@app-frontend/models/crossword/CrosswordEntry';
import { EntryClue } from '@app-frontend/models/crossword/EntryClue';
import { EntryID } from '@app-frontend/models/crossword/EntryID';
import { EntryValue } from '@app-frontend/models/crossword/EntryValue';
import { PositionID } from '@app-frontend/models/crossword/PositionID';
import { PositionValue } from '@app-frontend/models/crossword/PositionValue';
import * as helpers from '@app-frontend/models/crossword/utils/helpers';

export const cellHasPublishedValue = (
  crosswordDataModel: ICrosswordSolverDataModel,
  cell: Cell
): boolean => {
  return helpers.cellHasPublishedValue(crosswordDataModel, cell);
};

export const cellPlayerValue = (
  crosswordDataModel: ICrosswordSolverDataModel,
  cell: Cell
): PositionValue => {
  return (
    helpers.getCellPlayerValue(crosswordDataModel, cell) ||
    new PositionValue({ value: '' })
  );
};

export const cellHumanIndex = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  cell: Cell
): number | undefined => {
  let human_index: number | undefined;
  const all_crossword_entries = crosswordDataState.entries.across.concat(
    crosswordDataState.entries.down
  );
  for (const crossword_entry of all_crossword_entries) {
    const start = Cell.deSerialize(crossword_entry.start);
    if (start.equals(cell)) {
      human_index = crossword_entry.human_index;
      break;
    }
  }
  return human_index;
};

export const cellIsInEntry = (entry: CrosswordEntry, cell: Cell): boolean => {
  const in_row =
    cell.y === entry.start.y &&
    entry.start.x <= cell.x &&
    entry.end.x >= cell.x;
  const in_column =
    cell.x === entry.start.x &&
    entry.start.y <= cell.y &&
    entry.end.y >= cell.y;
  return entry.direction === 'across' ? in_row : in_column;
};

export const cellEntries = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  cell: Cell
): CrosswordEntry[] => {
  return crosswordDataState.entries.across
    .concat(crosswordDataState.entries.down)
    .filter(crossword_entry => {
      const crosswordEntry = CrosswordEntry.deSerialize(crossword_entry);
      return cellIsInEntry(crosswordEntry, cell);
    })
    .map(e => CrosswordEntry.deSerialize(e));
};

export const entryCells = (crosswordEntry: CrosswordEntry): Cell[] => {
  const cells: Cell[] = [];
  if (crosswordEntry.direction === 'across') {
    for (let i = crosswordEntry.start.x; i <= crosswordEntry.end.x; i++) {
      cells.push(
        new Cell({
          x: i,
          y: crosswordEntry.start.y,
        })
      );
    }
  }
  if (crosswordEntry.direction === 'down') {
    for (let i = crosswordEntry.start.y; i <= crosswordEntry.end.y; i++) {
      cells.push(
        new Cell({
          x: crosswordEntry.start.x,
          y: i,
        })
      );
    }
  }
  return cells;
};

export const getCrosswordEntry = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID
): CrosswordEntry => {
  const entry = crosswordDataState.entries.across
    .concat(crosswordDataState.entries.down)
    .find(crossword_entry => crossword_entry.id.value === entryId.value);
  if (!entry) {
    throw new Error(`could not find entry ${entryId.value}`);
  }

  return CrosswordEntry.deSerialize(entry);
};

export const entryClue = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID
): EntryClue => {
  const clue = crosswordDataState.clues[entryId.value];
  return new EntryClue({
    value: clue ? clue.value : '',
  });
};

export const entryValue = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID
): EntryValue => {
  const entry = crosswordDataState.entries.across
    .concat(crosswordDataState.entries.down)
    .filter(entry => entry.id.value === entryId.value)[0];
  if (!entry) {
    throw new Error(`could not find entry ${entryId.value}`);
  }
  return CrosswordEntry.deSerialize(entry).value;
};

export const crosswordIsComplete = (
  crosswordDataState: IReduxStateCrosswordDataSolver
): boolean => {
  const values = crosswordDataState.values;
  const player_values = crosswordDataState.playerValues;
  let is_complete = true;
  const len = Object.keys(crosswordDataState.values).length;

  for (let i = 0; i < len; i++) {
    const positionId = PositionID.fromValue(
      Object.keys(crosswordDataState.values)[i]
    );
    const correct_position_value = values[positionId.value];
    const player_position_value = player_values[positionId.value];
    const correctPositionValue = correct_position_value
      ? PositionValue.deSerialize(correct_position_value)
      : new PositionValue({ value: '' });
    const playerPositionValue = player_position_value
      ? PositionValue.deSerialize(player_position_value)
      : new PositionValue({ value: '' });
    if (!correctPositionValue.equals(playerPositionValue)) {
      is_complete = false;
      break;
    }
  }
  return is_complete;
};

export const entryIsComplete = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID
): boolean => {
  const cells = entryCells(getCrosswordEntry(crosswordDataState, entryId));
  let is_complete = true;

  for (const cell of cells) {
    const positionId = new PositionID({ cell });

    const correct_position_value = crosswordDataState.values[positionId.value];
    const player_position_value =
      crosswordDataState.playerValues[positionId.value];
    const correctPositionValue = correct_position_value
      ? PositionValue.deSerialize(correct_position_value)
      : new PositionValue({ value: '' });
    const playerPositionValue = player_position_value
      ? PositionValue.deSerialize(player_position_value)
      : new PositionValue({ value: '' });
    if (!correctPositionValue.equals(playerPositionValue)) {
      is_complete = false;
      break;
    }
  }
  return is_complete;
};

export const allCellsInEntryHavePlayerValues = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  crosswordEntry: CrosswordEntry
): boolean => {
  const cells = entryCells(crosswordEntry);
  const playerValues = cells
    .map(cell => cellPlayerValue(crosswordDataState.model, cell))
    .filter(v => !!v.value);

  return playerValues.length === cells.length;
};

export const getCrosswordEntryPreviousCell = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID,
  currentCell: Cell
): Cell | undefined => {
  const raw_entry = crosswordDataState.entries.across
    .concat(crosswordDataState.entries.down)
    .find(crossword_entry => crossword_entry.id.value === entryId.value);

  if (!raw_entry) {
    throw new Error(`could not find entry ${entryId.value}`);
  }

  const entry = CrosswordEntry.deSerialize(raw_entry);

  if (!cellIsInEntry(entry, currentCell)) {
    throw new Error(
      `cell x: ${currentCell.x}, y:${currentCell.y} is not in entry ${entryId.value}`
    );
  }

  if (currentCell.equals(entry.start)) {
    return undefined;
  }

  return entry.direction === 'across'
    ? new Cell({
        x: currentCell.x - 1,
        y: currentCell.y,
      })
    : new Cell({
        x: currentCell.x,
        y: currentCell.y - 1,
      });
};

export const getCrosswordEntryNextCell = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID,
  currentCell: Cell
): Cell | undefined => {
  const raw_entry = crosswordDataState.entries.across
    .concat(crosswordDataState.entries.down)
    .find(crossword_entry => crossword_entry.id.value === entryId.value);

  if (!raw_entry) {
    throw new Error(`could not find entry ${entryId.value}`);
  }

  const entry = CrosswordEntry.deSerialize(raw_entry);

  if (!cellIsInEntry(entry, currentCell)) {
    throw new Error(
      `cell x: ${currentCell.x}, y:${currentCell.y} is not in entry ${entryId.value}`
    );
  }

  if (currentCell.equals(entry.end)) {
    return undefined;
  }

  return entry.direction === 'across'
    ? new Cell({
        x: currentCell.x + 1,
        y: currentCell.y,
      })
    : new Cell({
        x: currentCell.x,
        y: currentCell.y + 1,
      });
};

export const sortEntries = (
  entries: ReturnType<CrosswordEntry['serialize']>[]
): ReturnType<CrosswordEntry['serialize']>[] => {
  return entries.sort((entryIdA, entryIdB) => {
    if (entryIdA.direction === 'across' && entryIdB.direction === 'down') {
      return -1;
    }
    if (entryIdB.direction === 'across' && entryIdA.direction === 'down') {
      return 1;
    }
    const a = parseInt(entryIdA.id.value.split('-')[0], 10);
    const b = parseInt(entryIdB.id.value.split('-')[0], 10);
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  });
};

export const getPreviousCrosswordEntry = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  crosswordEntry: CrosswordEntry
): CrosswordEntry => {
  let eligible_crossword_entries = sortEntries(
    crosswordDataState.entries.across.concat(crosswordDataState.entries.down)
  );

  if (eligible_crossword_entries.length === 1) {
    // 1 because we included the current focused entry
    eligible_crossword_entries = sortEntries(
      crosswordDataState.entries.across.concat(crosswordDataState.entries.down)
    );
  }

  const entryIndex = eligible_crossword_entries.findIndex(
    entry => entry.id.value === crosswordEntry.id.value
  );
  if (entryIndex === -1) {
    throw new Error(`entry ${crosswordEntry.id.value} not in entries`);
  }
  if (entryIndex === 0) {
    return CrosswordEntry.deSerialize(
      eligible_crossword_entries[eligible_crossword_entries.length - 1]
    );
  }
  return CrosswordEntry.deSerialize(eligible_crossword_entries[entryIndex - 1]);
};

export const getNextCrosswordEntry = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  crosswordEntry: CrosswordEntry
): CrosswordEntry => {
  let eligible_crossword_entries = sortEntries(
    crosswordDataState.entries.across.concat(crosswordDataState.entries.down)
  );

  if (eligible_crossword_entries.length === 1) {
    // 1 because we included the current focused entry
    eligible_crossword_entries = sortEntries(
      crosswordDataState.entries.across.concat(crosswordDataState.entries.down)
    );
  }

  const entryIndex = eligible_crossword_entries.findIndex(
    entry => entry.id.value === crosswordEntry.id.value
  );
  if (entryIndex === -1) {
    throw new Error(`entry ${crosswordEntry.id.value} not in entries`);
  }
  if (entryIndex === eligible_crossword_entries.length - 1) {
    return CrosswordEntry.deSerialize(eligible_crossword_entries[0]);
  }
  return CrosswordEntry.deSerialize(eligible_crossword_entries[entryIndex + 1]);
};

export const getPreviousCrosswordEntryWithAnEmptyCell = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  crosswordEntry: CrosswordEntry
): CrosswordEntry | undefined => {
  const eligible_crossword_entries = sortEntries(
    crosswordDataState.entries.across
      .concat(crosswordDataState.entries.down)
      .filter(entry => {
        if (entry.id.value === crosswordEntry.id.value) {
          return true; // include the entry itself so we can get it's index below
        }

        return !allCellsInEntryHavePlayerValues(
          crosswordDataState,
          CrosswordEntry.deSerialize(entry)
        );
      })
  );

  if (eligible_crossword_entries.length === 1) {
    // 1 because we included the current focused entry
    return undefined;
  }

  const entryIndex = eligible_crossword_entries.findIndex(
    entry => entry.id.value === crosswordEntry.id.value
  );
  if (entryIndex === -1) {
    throw new Error(`entry ${crosswordEntry.id.value} not in entries`);
  }
  if (entryIndex === 0) {
    return CrosswordEntry.deSerialize(
      eligible_crossword_entries[eligible_crossword_entries.length - 1]
    );
  }
  return CrosswordEntry.deSerialize(eligible_crossword_entries[entryIndex - 1]);
};

export const getNextCrosswordEntryWithAnEmptyCell = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  crosswordEntry: CrosswordEntry
): CrosswordEntry | undefined => {
  const eligible_crossword_entries = sortEntries(
    crosswordDataState.entries.across
      .concat(crosswordDataState.entries.down)
      .filter(entry => {
        if (entry.id.value === crosswordEntry.id.value) {
          return true; // include the entry itself so we can get it's index below
        }

        return !allCellsInEntryHavePlayerValues(
          crosswordDataState,
          CrosswordEntry.deSerialize(entry)
        );
      })
  );

  if (eligible_crossword_entries.length === 1) {
    // 1 because we included the current focused entry
    return undefined;
  }

  const entryIndex = eligible_crossword_entries.findIndex(
    entry => entry.id.value === crosswordEntry.id.value
  );
  if (entryIndex === -1) {
    throw new Error(`entry ${crosswordEntry.id.value} not in entries`);
  }
  if (entryIndex === eligible_crossword_entries.length - 1) {
    return CrosswordEntry.deSerialize(eligible_crossword_entries[0]);
  }
  return CrosswordEntry.deSerialize(eligible_crossword_entries[entryIndex + 1]);
};

export const getCrosswordEntryFirstCellWithoutPlayerValues = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID,
  excludedCell?: Cell
): Cell | undefined => {
  const entry = (entryId.direction === 'across'
    ? crosswordDataState.entries.across
    : []
  )
    .concat(entryId.direction === 'down' ? crosswordDataState.entries.down : [])
    .find(crossword_entry => crossword_entry.id.value === entryId.value);

  if (!entry) {
    throw new Error(`could not find entry ${entryId.value}`);
  }

  const cellsWithoutPlayerValues = entryCells(CrosswordEntry.deSerialize(entry))
    // we are also filtering out excludedCell
    .filter(cell => {
      return (
        !helpers.cellHasPlayerValue(crosswordDataState.model, cell) &&
        (excludedCell ? !cell.equals(excludedCell) : true)
      );
    })
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
    });

  return cellsWithoutPlayerValues.length > 0
    ? cellsWithoutPlayerValues[0]
    : undefined;
};

export const getCrosswordEntryLastCellWithPlayerValues = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID,
  excludedCell?: Cell
): Cell | undefined => {
  const entry = (entryId.direction === 'across'
    ? crosswordDataState.entries.across
    : []
  )
    .concat(entryId.direction === 'down' ? crosswordDataState.entries.down : [])
    .find(crossword_entry => crossword_entry.id.value === entryId.value);

  if (!entry) {
    throw new Error(`could not find entry ${entryId.value}`);
  }

  const cellsWithoutPlayerValues = entryCells(CrosswordEntry.deSerialize(entry))
    // we are also filtering out excludedCell
    .filter(cell => {
      return (
        helpers.cellHasPlayerValue(crosswordDataState.model, cell) &&
        (excludedCell ? !cell.equals(excludedCell) : true)
      );
    })
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
    });

  return cellsWithoutPlayerValues.length > 0
    ? cellsWithoutPlayerValues[cellsWithoutPlayerValues.length - 1]
    : undefined;
};

export const getCrosswordEntryPreviousCellWithoutPlayerValues = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID,
  currentCell: Cell
): Cell | undefined => {
  const entry = (entryId.direction === 'across'
    ? crosswordDataState.entries.across
    : []
  )
    .concat(entryId.direction === 'down' ? crosswordDataState.entries.down : [])
    .find(crossword_entry => crossword_entry.id.value === entryId.value);

  if (!entry) {
    throw new Error(`could not find entry ${entryId.value}`);
  }

  const cellsWithoutPlayerValues = entryCells(CrosswordEntry.deSerialize(entry))
    .filter(cell => {
      return entryId.direction === 'across'
        ? cell.x < currentCell.x
        : cell.y < currentCell.y;
    })
    .filter(cell => {
      return !helpers.cellHasPlayerValue(crosswordDataState.model, cell);
    });

  return cellsWithoutPlayerValues.length > 0
    ? cellsWithoutPlayerValues[cellsWithoutPlayerValues.length - 1]
    : undefined;
};

export const getCrosswordEntryNextCellWithoutPlayerValues = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  entryId: EntryID,
  currentCell: Cell
): Cell | undefined => {
  const entry = (entryId.direction === 'across'
    ? crosswordDataState.entries.across
    : []
  )
    .concat(entryId.direction === 'down' ? crosswordDataState.entries.down : [])
    .find(crossword_entry => crossword_entry.id.value === entryId.value);

  if (!entry) {
    throw new Error(`could not find entry ${entryId.value}`);
  }

  const cellsWithoutPlayerValues = entryCells(CrosswordEntry.deSerialize(entry))
    .filter(cell => {
      return entryId.direction === 'across'
        ? cell.x > currentCell.x
        : cell.y > currentCell.y;
    })
    .filter(cell => {
      return !helpers.cellHasPlayerValue(crosswordDataState.model, cell);
    });

  return cellsWithoutPlayerValues.length > 0
    ? cellsWithoutPlayerValues[0]
    : undefined;
};

export const getPreviousCellInSameLine = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  currentCell: Cell,
  direction: TCrosswordDirection
): Cell | undefined => {
  let cell: Cell | undefined;

  if (direction === 'across') {
    const cells = new Array(crosswordDataState.dimensions.width)
      .fill(0)
      .map((_, index) => new Cell({ x: index, y: currentCell.y }))
      // filter for cells before current cell, and those with published values
      .filter(cell => {
        const is_before_current_cell = cell.x < currentCell.x;
        if (!is_before_current_cell) {
          return false;
        }

        // skip revealed cells
        const positionId = new PositionID({ cell });
        const valueMetadata =
          crosswordDataState.valuesMetadata[positionId.value];
        if (valueMetadata) {
          if (
            valueMetadata.$show_cell_value ||
            valueMetadata.$show_cell_value_because_entry
          ) {
            return false;
          }
        }

        return cellHasPublishedValue(crosswordDataState.model, cell);
      });
    if (cells.length > 0) {
      cell = cells[cells.length - 1];
    }
  } else {
    // is down
    const cells = new Array(crosswordDataState.dimensions.height)
      .fill(0)
      .map((_, index) => new Cell({ x: currentCell.x, y: index }))
      // filter for cells before current cell, and those with published values
      .filter(cell => {
        const is_after_current_cell = cell.y < currentCell.y;
        if (!is_after_current_cell) {
          return false;
        }

        // skip revealed cells
        const positionId = new PositionID({ cell });
        const valueMetadata =
          crosswordDataState.valuesMetadata[positionId.value];
        if (valueMetadata) {
          if (
            valueMetadata.$show_cell_value ||
            valueMetadata.$show_cell_value_because_entry
          ) {
            return false;
          }
        }

        return cellHasPublishedValue(crosswordDataState.model, cell);
      });
    if (cells.length > 0) {
      cell = cells[cells.length - 1];
    }
  }

  return cell;
};

export const getNextCellInSameLine = (
  crosswordDataState: IReduxStateCrosswordDataSolver,
  currentCell: Cell,
  direction: TCrosswordDirection
): Cell | undefined => {
  let cell: Cell | undefined;

  if (direction === 'across') {
    const cells = new Array(crosswordDataState.dimensions.width)
      .fill(0)
      .map((_, index) => new Cell({ x: index, y: currentCell.y }))
      // filter for cells after current cell, and those with published values
      .filter(cell => {
        const is_after_current_cell = cell.x > currentCell.x;
        if (!is_after_current_cell) {
          return false;
        }

        // skip revealed cells
        const positionId = new PositionID({ cell });
        const valueMetadata =
          crosswordDataState.valuesMetadata[positionId.value];
        if (valueMetadata) {
          if (
            valueMetadata.$show_cell_value ||
            valueMetadata.$show_cell_value_because_entry
          ) {
            return false;
          }
        }

        return cellHasPublishedValue(crosswordDataState.model, cell);
      });
    cell = cells[0];
  } else {
    // is down
    const cells = new Array(crosswordDataState.dimensions.height)
      .fill(0)
      .map((_, index) => new Cell({ x: currentCell.x, y: index }))
      // filter for cells after current cell, and those with published values
      .filter(cell => {
        const is_after_current_cell = cell.y > currentCell.y;
        if (!is_after_current_cell) {
          return false;
        }

        // skip revealed cells
        const positionId = new PositionID({ cell });
        const valueMetadata =
          crosswordDataState.valuesMetadata[positionId.value];
        if (valueMetadata) {
          if (
            valueMetadata.$show_cell_value ||
            valueMetadata.$show_cell_value_because_entry
          ) {
            return false;
          }
        }

        return cellHasPublishedValue(crosswordDataState.model, cell);
      });
    cell = cells[0];
  }

  return cell;
};
