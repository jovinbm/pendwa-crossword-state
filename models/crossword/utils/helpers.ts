import {
  ICrosswordPublisherDataModel,
  ICrosswordPuzzleDataEntries,
} from '@app-frontend/models/crossword/@types';
import {
  IReduxStateCrosswordDataPublisher,
  IReduxStateCrosswordDataSolver,
} from '@app-frontend/models/crossword/@types/redux';
import { Cell } from '@app-frontend/models/crossword/Cell';
import { CrosswordEntry } from '@app-frontend/models/crossword/CrosswordEntry';
import { EntryClue } from '@app-frontend/models/crossword/EntryClue';
import { EntryID } from '@app-frontend/models/crossword/EntryID';
import { EntryValue } from '@app-frontend/models/crossword/EntryValue';
import { PositionID } from '@app-frontend/models/crossword/PositionID';
import { PositionValue } from '@app-frontend/models/crossword/PositionValue';
import { PositionValueMetadata } from '@app-frontend/models/crossword/PositionValueMetadata';

/**
 * Checks if two given coordinates are valid and within bounds of our crossword
 */
export const checkCoordinatesAndThrowIfOutOfBounds = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): boolean => {
  const {
    dimensions: { width, height },
  } = crosswordDataModel;

  if (cell.x < 0 || cell.x > width - 1) {
    throw new Error(`x ${cell.x} is out of bounds`);
  }

  if (cell.y < 0 || cell.y > height - 1) {
    throw new Error(`y ${cell.y} is out of bounds`);
  }

  return true;
};

export const getCellPublishedValue = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): PositionValue | undefined => {
  const { values } = crosswordDataModel;
  checkCoordinatesAndThrowIfOutOfBounds(crosswordDataModel, cell);
  const positionId = new PositionID({ cell });
  return values[positionId.value];
};

export const getCellPlayerValue = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): PositionValue | undefined => {
  const { playerValues } = crosswordDataModel;
  checkCoordinatesAndThrowIfOutOfBounds(crosswordDataModel, cell);
  const positionId = new PositionID({ cell });
  return playerValues[positionId.value];
};

export const cellHasPublishedValue = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): boolean => {
  const positionValue = getCellPublishedValue(crosswordDataModel, cell);
  return !!positionValue && positionValue.value.length > 0;
};

export const cellHasPlayerValue = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): boolean => {
  const positionValue = getCellPlayerValue(crosswordDataModel, cell);
  return !!positionValue && positionValue.value.length > 0;
};

/**
 * Gets a cell value at a given position
 */
export const getCellNeighbours = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): {
  north:
    | {
        id: PositionID;
        value: PositionValue | undefined;
        playerValue: PositionValue | undefined;
      }
    | undefined;
  east:
    | {
        id: PositionID;
        value: PositionValue | undefined;
        playerValue: PositionValue | undefined;
      }
    | undefined;
  south:
    | {
        id: PositionID;
        value: PositionValue | undefined;
        playerValue: PositionValue | undefined;
      }
    | undefined;
  west:
    | {
        id: PositionID;
        value: PositionValue | undefined;
        playerValue: PositionValue | undefined;
      }
    | undefined;
} => {
  return {
    north:
      cell.y > 0
        ? {
            id: new PositionID({
              cell: new Cell({
                x: cell.x,
                y: cell.y - 1,
              }),
            }),
            value: getCellPublishedValue(
              crosswordDataModel,
              new Cell({
                x: cell.x,
                y: cell.y - 1,
              })
            ),
            playerValue: getCellPlayerValue(
              crosswordDataModel,
              new Cell({
                x: cell.x,
                y: cell.y - 1,
              })
            ),
          }
        : void 0,
    east:
      cell.x < crosswordDataModel.dimensions.width - 1
        ? {
            id: new PositionID({
              cell: new Cell({
                x: cell.x + 1,
                y: cell.y,
              }),
            }),
            value: getCellPublishedValue(
              crosswordDataModel,
              new Cell({
                x: cell.x + 1,
                y: cell.y,
              })
            ),
            playerValue: getCellPlayerValue(
              crosswordDataModel,
              new Cell({
                x: cell.x + 1,
                y: cell.y,
              })
            ),
          }
        : void 0,
    south:
      cell.y < crosswordDataModel.dimensions.height - 1
        ? {
            id: new PositionID({
              cell: new Cell({
                x: cell.x,
                y: cell.y + 1,
              }),
            }),
            value: getCellPublishedValue(
              crosswordDataModel,
              new Cell({
                x: cell.x,
                y: cell.y + 1,
              })
            ),
            playerValue: getCellPlayerValue(
              crosswordDataModel,
              new Cell({
                x: cell.x,
                y: cell.y + 1,
              })
            ),
          }
        : void 0,
    west:
      cell.x > 0
        ? {
            id: new PositionID({
              cell: new Cell({
                x: cell.x - 1,
                y: cell.y,
              }),
            }),
            value: getCellPublishedValue(
              crosswordDataModel,
              new Cell({
                x: cell.x - 1,
                y: cell.y,
              })
            ),
            playerValue: getCellPlayerValue(
              crosswordDataModel,
              new Cell({
                x: cell.x - 1,
                y: cell.y,
              })
            ),
          }
        : void 0,
  };
};

/**
 * Gets the first x coordinate that has been filled at a given height given x,y, or undefined if no value
 */
export const getAcrossFirstX = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): number | void => {
  if (!cellHasPublishedValue(crosswordDataModel, cell)) {
    return void 0;
  }
  let first_x = cell.x;

  for (let i = cell.x; i >= 0; i--) {
    if (
      !cellHasPublishedValue(crosswordDataModel, new Cell({ x: i, y: cell.y }))
    ) {
      break;
    } else {
      first_x = i;
    }
  }
  return first_x;
};

/**
 * Gets the last x coordinate that has been filled at a given row given x,y, or undefined if no value
 */
export const getAcrossLastX = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): number | void => {
  const {
    dimensions: { width },
  } = crosswordDataModel;

  if (!cellHasPublishedValue(crosswordDataModel, cell)) {
    return void 0;
  }

  let last_x = cell.x;

  for (let i = cell.x; i < width; i++) {
    if (
      !cellHasPublishedValue(crosswordDataModel, new Cell({ x: i, y: cell.y }))
    ) {
      break;
    } else {
      last_x = i;
    }
  }
  return last_x;
};

/**
 * Gets the first y coordinate that has been filled at a given column given x,y, or undefined if no value
 */
export const getDownFirstY = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): number | void => {
  if (!cellHasPublishedValue(crosswordDataModel, cell)) {
    return void 0;
  }

  let first_y = cell.y;

  for (let i = cell.y; i >= 0; i--) {
    if (
      !cellHasPublishedValue(crosswordDataModel, new Cell({ x: cell.x, y: i }))
    ) {
      break;
    } else {
      first_y = i;
    }
  }
  return first_y;
};

/**
 * Gets the last y coordinate that has been filled at a given column given x,y, or undefined if no value
 */
export const getDownLastY = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): number | undefined => {
  const {
    dimensions: { height },
  } = crosswordDataModel;

  if (!cellHasPublishedValue(crosswordDataModel, cell)) {
    return void 0;
  }

  let last_y = cell.y;

  for (let i = cell.y; i < height; i++) {
    if (
      !cellHasPublishedValue(crosswordDataModel, new Cell({ x: cell.x, y: i }))
    ) {
      break;
    } else {
      last_y = i;
    }
  }

  return last_y;
};

/**
 * Gets the value at a row given an x and y coordinate, or undefined if no value
 */
export const getAcrossEntry = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): EntryValue | void => {
  const first_x = getAcrossFirstX(crosswordDataModel, cell);
  const last_x = getAcrossLastX(crosswordDataModel, cell);

  if (first_x === void 0 || last_x === void 0) {
    return void 0;
  }

  const entry: PositionValue[] = [];

  for (let i = first_x; i <= last_x; i++) {
    const cell_value = getCellPublishedValue(
      crosswordDataModel,
      new Cell({ x: i, y: cell.y })
    );
    if (cell_value === undefined) {
      throw new Error('semantic error: no cel value');
    }
    entry.push(cell_value);
  }

  return new EntryValue({ value: entry });
};

/**
 * Gets the value at a row given an x and y coordinate, or undefined if no value
 */
export const getDownEntry = (
  crosswordDataModel: ICrosswordPublisherDataModel,
  cell: Cell
): EntryValue | void => {
  const first_y = getDownFirstY(crosswordDataModel, cell);
  const last_y = getDownLastY(crosswordDataModel, cell);

  if (first_y === void 0 || last_y === void 0) {
    return void 0;
  }

  const entry: PositionValue[] = [];

  for (let i = first_y; i <= last_y; i++) {
    const cell_value = getCellPublishedValue(
      crosswordDataModel,
      new Cell({ x: cell.x, y: i })
    );
    if (cell_value === undefined) {
      throw new Error('semantic error: no cel value');
    }
    entry.push(cell_value);
  }

  return new EntryValue({ value: entry });
};

export const getAllEntriesAcross = (
  crosswordDataModel: ICrosswordPublisherDataModel
): {
  start: Cell;
  end: Cell;
  value: EntryValue;
  length: number;
  direction: 'across';
}[] => {
  const {
    dimensions: { width, height },
  } = crosswordDataModel;
  const all_across: {
    start: Cell;
    end: Cell;
    value: EntryValue;
    length: number;
    direction: 'across';
  }[] = [];
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const value = getAcrossEntry(crosswordDataModel, new Cell({ x, y }));
      // we only allow values of length > 1
      if (value && value.value.length > 1) {
        const item = {
          start: new Cell({
            x,
            y,
          }),
          end: new Cell({
            x: getAcrossLastX(crosswordDataModel, new Cell({ x, y })) as number,
            y,
          }),
          value,
          length: value.value.length,
          direction: 'across' as 'across',
        };
        all_across.push(item);
        // skip to x with no value since we read the whole value
        x += item.end.x - item.start.x + 1;
      } else {
        x++;
      }
    }
  }
  return all_across;
};

export const getAllEntriesDown = (
  crosswordDataModel: ICrosswordPublisherDataModel
): {
  start: Cell;
  end: Cell;
  value: EntryValue;
  length: number;
  direction: 'down';
}[] => {
  const {
    dimensions: { width, height },
  } = crosswordDataModel;
  const all_down: {
    start: Cell;
    end: Cell;
    value: EntryValue;
    length: number;
    direction: 'down';
  }[] = [];

  for (let x = 0; x < width; x++) {
    let y = 0;
    while (y < height) {
      const value = getDownEntry(crosswordDataModel, new Cell({ x, y }));
      // we only allow values of length > 1
      if (value && value.value.length > 1) {
        const item = {
          start: new Cell({
            x,
            y,
          }),
          end: new Cell({
            x,
            y: getDownLastY(crosswordDataModel, new Cell({ x, y })) as number,
          }),
          value,
          length: value.value.length,
          direction: 'down' as 'down',
        };
        all_down.push(item);
        // skip to y with no value since we read the whole value
        y += item.end.y - item.start.y + 1;
      } else {
        y++;
      }
    }
  }
  return all_down;
};

export const getAllAcrossStartCoordinates = (
  crosswordDataModel: ICrosswordPublisherDataModel
): Cell[] => {
  return getAllEntriesAcross(crosswordDataModel).map(raw_entry => {
    return new Cell({
      x: raw_entry.start.x,
      y: raw_entry.start.y,
    });
  });
};

export const getAllDownStartCoordinates = (
  crosswordDataModel: ICrosswordPublisherDataModel
) => {
  return getAllEntriesDown(crosswordDataModel).map(raw_entry => {
    return new Cell({
      x: raw_entry.start.x,
      y: raw_entry.start.y,
    });
  });
};

/**
 * Gets all human indexes in the crossword
 */
export const getCellHumanIndexes = (
  crosswordDataModel: ICrosswordPublisherDataModel
): { [PositionIDValue: string]: number } => {
  // keep in mind that if an across and a down start at the same box, they should have the
  // same index
  const across_start_coordinates = getAllAcrossStartCoordinates(
    crosswordDataModel
  );
  const down_start_coordinates = getAllDownStartCoordinates(crosswordDataModel);
  const all_start_coordinates = across_start_coordinates
    .concat(
      down_start_coordinates.filter(({ x, y }) => {
        // we don't include duplicates already in the across_start_coordinates
        return !across_start_coordinates.some(
          cood => cood.x === x && cood.y === y
        );
      })
    )
    .sort((a, b) => {
      // we want the top most to have human indexes closer to 0, increasing as you move down
      if (a.y < b.y) {
        return -1;
      } else if (b.y < a.y) {
        return 1;
      } else if (a.x < b.x) {
        return -1;
      } else if (b.x < a.x) {
        return 1;
      } else {
        // a && b are equal, we are not supposed to arrive at this state since we have filtered
        // duplicates above
        throw new Error(
          `arrived at an inconsistent state where a ${a} is same as b ${b}`
        );
      }
    });

  return all_start_coordinates.reduce<{ [PositionIDValue: string]: number }>(
    (prev, cood, i) => {
      const { x, y } = cood;
      prev[new PositionID({ cell: new Cell({ x, y }) }).value] = i + 1; // starts at zero
      return prev;
    },
    {}
  );
};

export const getAllEntries = (
  crosswordDataModel: ICrosswordPublisherDataModel
): ICrosswordPuzzleDataEntries => {
  const cell_human_indexes = getCellHumanIndexes(crosswordDataModel);
  const across = getAllEntriesAcross(crosswordDataModel).map(raw_entry => {
    const { x, y } = raw_entry.start;
    const positionId = new PositionID({ cell: new Cell({ x, y }) });
    if (!cell_human_indexes[positionId.value]) {
      throw new Error(
        `expected human index at cell_human_indexes[${positionId.value}], got ${
          cell_human_indexes[positionId.value]
        }`
      );
    }

    return new CrosswordEntry({
      ...raw_entry,
      human_index: cell_human_indexes[positionId.value],
      id: new EntryID({
        human_index: cell_human_indexes[positionId.value],
        direction: raw_entry.direction,
      }),
    });
  });

  const down = getAllEntriesDown(crosswordDataModel).map(raw_entry => {
    const { x, y } = raw_entry.start;
    const positionId = new PositionID({ cell: new Cell({ x, y }) });
    if (!cell_human_indexes[positionId.value]) {
      throw new Error(
        `expected human index at cell_human_indexes[${positionId.value}], got ${
          cell_human_indexes[positionId.value]
        }`
      );
    }

    return new CrosswordEntry({
      ...raw_entry,
      human_index: cell_human_indexes[positionId.value],
      id: new EntryID({
        human_index: cell_human_indexes[positionId.value],
        direction: raw_entry.direction,
      }),
    });
  });

  return {
    across,
    down,
  };
};

export const getCrosswordDataModelFromPublisherState = (crosswordDataState: {
  uuid: IReduxStateCrosswordDataPublisher['uuid'];
  dimensions: IReduxStateCrosswordDataPublisher['dimensions'];
  values: IReduxStateCrosswordDataPublisher['values'];
  entries: IReduxStateCrosswordDataPublisher['entries'];
  clues: IReduxStateCrosswordDataPublisher['clues'];
}): ICrosswordPublisherDataModel => {
  const { uuid, dimensions, values, entries, clues } = crosswordDataState;

  return {
    uuid,
    dimensions,
    values: Object.keys(values).reduce<ICrosswordPublisherDataModel['values']>(
      (prev, raw_position_id) => {
        const value = values[raw_position_id];
        if (value) {
          prev[raw_position_id] = PositionValue.deSerialize(value);
        }
        return prev;
      },
      {}
    ),
    entries: {
      across: entries.across.map(e => CrosswordEntry.deSerialize(e)),
      down: entries.down.map(e => CrosswordEntry.deSerialize(e)),
    },
    clues: Object.keys(clues).reduce<ICrosswordPublisherDataModel['clues']>(
      (prev, raw_entry_id) => {
        const clue = clues[raw_entry_id];
        prev[raw_entry_id] = clue
          ? EntryClue.deSerialize(clue)
          : new EntryClue({ value: '' });
        return prev;
      },
      {}
    ),
    playerValues: {},
    playerValuesMetadata: {},
  };
};

export const getCrosswordDataModelFromSolverState = (crosswordDataState: {
  uuid: IReduxStateCrosswordDataPublisher['uuid'];
  dimensions: IReduxStateCrosswordDataPublisher['dimensions'];
  values: IReduxStateCrosswordDataPublisher['values'];
  entries: IReduxStateCrosswordDataPublisher['entries'];
  clues: IReduxStateCrosswordDataPublisher['clues'];
  playerValues: IReduxStateCrosswordDataSolver['playerValues'];
  playerValuesMetadata: IReduxStateCrosswordDataSolver['playerValuesMetadata'];
}): ICrosswordPublisherDataModel => {
  const { playerValues, playerValuesMetadata } = crosswordDataState;
  return {
    ...getCrosswordDataModelFromPublisherState(crosswordDataState),
    playerValues: Object.keys(playerValues).reduce<
      ICrosswordPublisherDataModel['playerValues']
    >((prev, raw_position_id) => {
      const value = playerValues[raw_position_id];
      if (value) {
        prev[raw_position_id] = PositionValue.deSerialize(value);
      }
      return prev;
    }, {}),
    playerValuesMetadata: Object.keys(playerValuesMetadata).reduce<
      ICrosswordPublisherDataModel['playerValuesMetadata']
    >((prev, raw_position_id) => {
      const value = playerValuesMetadata[raw_position_id];
      if (value) {
        prev[raw_position_id] = PositionValueMetadata.deSerialize(value);
      }
      return prev;
    }, {}),
  };
};
