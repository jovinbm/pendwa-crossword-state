import { persistPlayerValues } from '@app-frontend/components/Form/InputCrosswordSolver/state/persist';
import { logger } from '@app-frontend/lib/logger';
import { IReduxStateCrosswordDataSolver } from '@app-frontend/models/crossword/@types/redux';
import { Cell } from '@app-frontend/models/crossword/Cell';
import { CrosswordEntry } from '@app-frontend/models/crossword/CrosswordEntry';
import { EntryClue } from '@app-frontend/models/crossword/EntryClue';
import { EntryID } from '@app-frontend/models/crossword/EntryID';
import { EntryMetadata } from '@app-frontend/models/crossword/EntryMetadata';
import { EntryValue } from '@app-frontend/models/crossword/EntryValue';
import { PositionID } from '@app-frontend/models/crossword/PositionID';
import { PositionValue } from '@app-frontend/models/crossword/PositionValue';
import { PositionValueMetadata } from '@app-frontend/models/crossword/PositionValueMetadata';
import { getCrosswordDataModelFromSolverState } from '@app-frontend/models/crossword/utils/helpers';
import { ValueMetadata } from '@app-frontend/models/crossword/ValueMetadata';
import { VError } from '@app-root/app/lib/utils/Verror';
import arrayIntersect from 'intersect';
import { Reducer } from 'redux';
import { IActionData } from './@types';
import * as ac from './ac';
import * as fns from './fns';
import * as selectors from './selectors';

const crosswordDataStateReducer: Reducer<
  Readonly<IReduxStateCrosswordDataSolver>,
  IActionData
> = (rawCrosswordDataState, action): IReduxStateCrosswordDataSolver => {
  /**
   * The Crossword State
   */
  const crosswordDataState: IReduxStateCrosswordDataSolver = rawCrosswordDataState || {
    // some of these values are placeholder values until crossword state is initialized by the initialize option
    initialized: false,
    uuid: '',
    mode: 'solve',
    editing_mode: 'overwrite',
    is_complete: false,
    is_at_intersection: false,
    strict_mode: true,
    dimensions: {
      width: 1,
      height: 1,
    },
    hasRevealedAny: false,
    hasRevealedAll: false,
    playerValues: {},
    playerValuesMetadata: {},
    playerActions: {
      cell_checks: [],
      cell_reveals: [],
      entry_checks: [],
      entry_reveals: [],
    },
    values: {},
    valuesMetadata: {},
    entries: {
      across: [],
      down: [],
    },
    entriesMetadata: {},
    clues: {},
    focusedCell: new Cell({ x: 0, y: 0 }).serialize(),
    focusedEntry: new CrosswordEntry({
      id: EntryID.fromValue('1-across'),
      start: new Cell({ x: 0, y: 0 }),
      end: new Cell({ x: 0, y: 0 }),
      value: new EntryValue({ value: [new PositionValue({ value: '' })] }),
      length: 1,
      direction: 'across',
      human_index: 1,
    }).serialize(),
    previousEntry: new CrosswordEntry({
      id: EntryID.fromValue('1-across'),
      start: new Cell({ x: 0, y: 0 }),
      end: new Cell({ x: 0, y: 0 }),
      value: new EntryValue({ value: [new PositionValue({ value: '' })] }),
      length: 1,
      direction: 'across',
      human_index: 1,
    }).serialize(),
    nextEntry: new CrosswordEntry({
      id: EntryID.fromValue('1-across'),
      start: new Cell({ x: 0, y: 0 }),
      end: new Cell({ x: 0, y: 0 }),
      value: new EntryValue({ value: [new PositionValue({ value: '' })] }),
      length: 1,
      direction: 'across',
      human_index: 1,
    }).serialize(),
    model: getCrosswordDataModelFromSolverState({
      uuid: '',
      dimensions: {
        width: 1,
        height: 1,
      },
      playerValues: {},
      playerValuesMetadata: {},
      values: {},
      entries: {
        across: [],
        down: [],
      },
      clues: {},
    }),
  };

  switch (action.type) {
    case ac.actions.INITIALIZE: {
      const {
        strict_mode,
        height,
        width,
        hasRevealedAny,
        hasRevealedAll,
        playerValues,
        playerValuesMetadata,
        playerActions,
        values,
        entries,
        clues,
      } = action.payload as ac.IDataInitializeCrosswordSolution['payload'];

      return {
        ...crosswordDataState,
        initialized: true,
        uuid: action.uuid,
        mode: 'solve',
        editing_mode: 'overwrite',
        is_complete: false,
        strict_mode,
        // movement direction is the direction of the first entry
        dimensions: {
          width,
          height,
        },
        hasRevealedAny,
        hasRevealedAll,
        playerValues,
        playerValuesMetadata,
        playerActions,
        values,
        valuesMetadata: Object.keys(values).reduce<
          IReduxStateCrosswordDataSolver['valuesMetadata']
        >((prev, position_id) => {
          const published_value = values[position_id];

          if (!published_value) {
            throw new Error(
              `there should be a published value at ${position_id}`
            );
          }

          const player_value = playerValues[position_id];

          prev[position_id] = new ValueMetadata({
            cell: PositionID.fromValue(position_id).getCell(),
            cell_focus: false,
            cell_error: false,
            entry_focus: false,
            entry_across_error: false,
            entry_down_error: false,
            human_index:
              selectors.cellHumanIndex(
                crosswordDataState,
                PositionID.fromValue(position_id).getCell()
              ) || null,
            value_published: PositionValue.deSerialize(published_value),
            value_player: player_value
              ? PositionValue.deSerialize(player_value)
              : new PositionValue({ value: '' }),
            $show_cell_value: false,
            $show_cell_success: false,
            $show_cell_error: false,
            $show_cell_value_because_entry: false,
            $show_cell_success_because_entry: false,
            $show_cell_error_because_entry: false,
          }).serialize();
          return prev;
        }, {}),
        entries,
        entriesMetadata: entries.across
          .concat(entries.down)
          .reduce<IReduxStateCrosswordDataSolver['entriesMetadata']>(
            (prev, serialized_entry) => {
              const entry = CrosswordEntry.deSerialize(serialized_entry);
              const entry_id = entry.id.value;

              prev[entry_id] = new EntryMetadata({
                entry,
                entry_focus: false,
                entry_error: false,
                all_cells_have_player_values: false,
                is_complete: false,
                entryClue: new EntryClue({ value: '' }), // placeholder only
                entryValue: new EntryValue({ value: [] }), // placeholder only
              }).serialize();

              return prev;
            },
            {}
          ),
        clues,
        // focus on the first cell of the first entry
        focusedCell: entries.across.concat(entries.down)[0].start,
        // focus on the first entry
        focusedEntry: entries.across.concat(entries.down)[0],
      };
    }

    case ac.actions.RE_INITIALIZE: {
      const {
        strict_mode,
        hasRevealedAny,
        hasRevealedAll,
        playerValues,
        playerValuesMetadata,
        playerActions,
        values,
        entries,
        clues,
      } = action.payload as ac.IDataInitializeCrosswordSolution['payload'];
      return {
        ...crosswordDataState,
        initialized: true,
        uuid: action.uuid,
        strict_mode,
        hasRevealedAny,
        hasRevealedAll,
        playerValues,
        playerValuesMetadata,
        playerActions,
        values,
        entries,
        clues,
      } as IReduxStateCrosswordDataSolver;
    }

    case ac.actions.ACTION_UP:
    case ac.actions.ACTION_LEFT: {
      const {
        is_user_action,
        allow_same_line_jump,
      } = action.payload as ac.IDataActionLeft['payload'];
      let newCrosswordDataState: IReduxStateCrosswordDataSolver = {
        ...crosswordDataState,
        ...(is_user_action
          ? {
              editing_mode: 'overwrite',
            }
          : {}),
      };
      const direction_change: boolean =
        (newCrosswordDataState.focusedEntry.direction === 'across' &&
          action.type === ac.actions.ACTION_UP) ||
        (newCrosswordDataState.focusedEntry.direction === 'down' &&
          action.type === ac.actions.ACTION_LEFT);

      // if direction is different compared to focused entry, switch entries
      if (direction_change) {
        newCrosswordDataState = crosswordSolvingReducer(
          newCrosswordDataState,
          ac.intersectionEntrySwitchAC({
            uuid: newCrosswordDataState.uuid,
          })
        );
      }

      const focusedCell = Cell.deSerialize(newCrosswordDataState.focusedCell);
      const focusedEntry = CrosswordEntry.deSerialize(
        newCrosswordDataState.focusedEntry
      );

      const jump_line =
        focusedEntry.start.equals(focusedCell) || direction_change;

      if (allow_same_line_jump && jump_line) {
        if (
          action.type === ac.actions.ACTION_UP &&
          newCrosswordDataState.northCellInSameLine
        ) {
          newCrosswordDataState = {
            ...newCrosswordDataState,
            ...fns.focusOnCell(
              newCrosswordDataState,
              Cell.deSerialize(newCrosswordDataState.northCellInSameLine)
            ),
          };
        } else if (
          action.type === ac.actions.ACTION_LEFT &&
          newCrosswordDataState.westCellInSameLine
        ) {
          newCrosswordDataState = {
            ...newCrosswordDataState,
            ...fns.focusOnCell(
              newCrosswordDataState,
              Cell.deSerialize(newCrosswordDataState.westCellInSameLine)
            ),
          };
        }
      } else if (
        newCrosswordDataState.editing_mode === 'empty' &&
        newCrosswordDataState.previousEmptyCellInEntry
      ) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnCell(
            newCrosswordDataState,
            Cell.deSerialize(newCrosswordDataState.previousEmptyCellInEntry)
          ),
        };
      } else if (newCrosswordDataState.previousCellInEntry) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnCell(
            newCrosswordDataState,
            Cell.deSerialize(newCrosswordDataState.previousCellInEntry)
          ),
        };
      } else {
        // exhausted all options, stay where you are
      }

      return newCrosswordDataState;
    }

    case ac.actions.ACTION_DOWN:
    case ac.actions.ACTION_RIGHT: {
      const {
        is_user_action,
        allow_same_line_jump,
      } = action.payload as ac.IDataActionRight['payload'];
      let newCrosswordDataState: IReduxStateCrosswordDataSolver = {
        ...crosswordDataState,
        ...(is_user_action
          ? {
              editing_mode: 'overwrite',
            }
          : {}),
      };
      const direction_change: boolean =
        (newCrosswordDataState.focusedEntry.direction === 'across' &&
          action.type === ac.actions.ACTION_DOWN) ||
        (newCrosswordDataState.focusedEntry.direction === 'down' &&
          action.type === ac.actions.ACTION_RIGHT);

      // if direction is different compared to focused entry, switch entries
      if (direction_change) {
        newCrosswordDataState = crosswordSolvingReducer(
          newCrosswordDataState,
          ac.intersectionEntrySwitchAC({
            uuid: newCrosswordDataState.uuid,
          })
        );
      }

      const focusedCell = Cell.deSerialize(newCrosswordDataState.focusedCell);
      const focusedEntry = CrosswordEntry.deSerialize(
        newCrosswordDataState.focusedEntry
      );

      const jump_line =
        focusedEntry.end.equals(focusedCell) || direction_change;

      if (allow_same_line_jump && jump_line) {
        if (
          action.type === ac.actions.ACTION_DOWN &&
          newCrosswordDataState.southCellInSameLine
        ) {
          newCrosswordDataState = {
            ...newCrosswordDataState,
            ...fns.focusOnCell(
              newCrosswordDataState,
              Cell.deSerialize(newCrosswordDataState.southCellInSameLine)
            ),
          };
        } else if (
          action.type === ac.actions.ACTION_RIGHT &&
          newCrosswordDataState.eastCellInSameLine
        ) {
          newCrosswordDataState = {
            ...newCrosswordDataState,
            ...fns.focusOnCell(
              newCrosswordDataState,
              Cell.deSerialize(newCrosswordDataState.eastCellInSameLine)
            ),
          };
        }
      } else if (
        newCrosswordDataState.editing_mode === 'empty' &&
        newCrosswordDataState.nextEmptyCellInEntry
      ) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnCell(
            newCrosswordDataState,
            Cell.deSerialize(newCrosswordDataState.nextEmptyCellInEntry)
          ),
        };
      } else if (newCrosswordDataState.nextCellInEntry) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnCell(
            newCrosswordDataState,
            Cell.deSerialize(newCrosswordDataState.nextCellInEntry)
          ),
        };
      } else {
        // exhausted all options, stay where you are
      }

      return newCrosswordDataState;
    }

    case ac.actions.ACTION_CELL_CLICK: {
      const { cell } = action.payload as ac.IDataActionCellClick['payload'];
      let newCrosswordDataState: IReduxStateCrosswordDataSolver = {
        ...crosswordDataState,
        editing_mode: 'overwrite',
      };

      const focusedCell = Cell.deSerialize(newCrosswordDataState.focusedCell);

      if (!focusedCell.equals(cell)) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnCell(newCrosswordDataState, cell),
        };
      } else {
        // switch direction
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...crosswordSolvingReducer(
            newCrosswordDataState,
            ac.intersectionEntrySwitchAC({
              uuid: newCrosswordDataState.uuid,
            })
          ),
        };
      }

      return newCrosswordDataState;
    }

    case ac.actions.ACTION_CHARACTER: {
      const {
        positionValue,
      } = action.payload as ac.IDataActionCharacter['payload'];
      let newCrosswordDataState = crosswordDataState;
      const focusedCell = Cell.deSerialize(newCrosswordDataState.focusedCell);
      const focusedEntry = CrosswordEntry.deSerialize(
        newCrosswordDataState.focusedEntry
      );

      // first change focus to the next cell
      if (
        newCrosswordDataState.editing_mode === 'empty' &&
        newCrosswordDataState.nextEmptyCellInEntry
      ) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnCell(
            newCrosswordDataState,
            Cell.deSerialize(newCrosswordDataState.nextEmptyCellInEntry)
          ),
        };
      } else if (newCrosswordDataState.nextCellInEntry) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnCell(
            newCrosswordDataState,
            Cell.deSerialize(newCrosswordDataState.nextCellInEntry)
          ),
        };
      } else {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...crosswordSolvingReducer(
            newCrosswordDataState,
            (focusedEntry.direction === 'across'
              ? ac.actionRightAC
              : ac.actionDownAC)({
              uuid: newCrosswordDataState.uuid,
              is_user_action: false,
              allow_same_line_jump: false,
            })
          ),
        };
      }

      // if we did not move, then go to the next entry
      if (
        focusedCell.equals(Cell.deSerialize(newCrosswordDataState.focusedCell))
      ) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...crosswordSolvingReducer(
            newCrosswordDataState,
            ac.entryNextAC({
              uuid: newCrosswordDataState.uuid,
              incomplete_entries_only: false,
            })
          ),
        };
      }

      // update player value
      const positionID = new PositionID({ cell: focusedCell });

      newCrosswordDataState = {
        ...newCrosswordDataState,
        playerValues: {
          ...newCrosswordDataState.playerValues,
          [positionID.value]: positionValue.serialize(),
        },
        playerValuesMetadata: {
          ...newCrosswordDataState.playerValuesMetadata,
          [positionID.value]: new PositionValueMetadata({
            time: new Date().getTime(),
          }).serialize(),
        },
      };

      return newCrosswordDataState;
    }

    case ac.actions.ACTION_DELETE: {
      let newCrosswordDataState = crosswordDataState;
      const focusedCell = Cell.deSerialize(newCrosswordDataState.focusedCell);
      const focusedEntry = CrosswordEntry.deSerialize(
        newCrosswordDataState.focusedEntry
      );

      // first change focus to the previous cell
      newCrosswordDataState = {
        ...newCrosswordDataState,
        ...crosswordSolvingReducer(
          newCrosswordDataState,
          (focusedEntry.direction === 'across'
            ? ac.actionLeftAC
            : ac.actionUpAC)({
            uuid: newCrosswordDataState.uuid,
            is_user_action: true, // treat delete as user action
            allow_same_line_jump: false,
          })
        ),
      };

      // if we did not move, then go to the next entry
      if (
        focusedCell.equals(Cell.deSerialize(newCrosswordDataState.focusedCell))
      ) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...crosswordSolvingReducer(
            newCrosswordDataState,
            ac.entryPreviousAC({
              uuid: newCrosswordDataState.uuid,
              incomplete_entries_only: false,
              precedence: 'end',
            })
          ),
        };
      }

      // update player value
      const positionID = new PositionID({ cell: focusedCell });

      newCrosswordDataState = {
        ...newCrosswordDataState,
        playerValues: {
          ...newCrosswordDataState.playerValues,
          // note that we actually care for the fact that there is an empty string so that we can be able to
          // merge even at points where values are deleted
          [positionID.value]: new PositionValue({ value: '' }).serialize(),
        },
        playerValuesMetadata: {
          ...newCrosswordDataState.playerValuesMetadata,
          [positionID.value]: new PositionValueMetadata({
            time: new Date().getTime(),
          }).serialize(),
        },
      };

      return newCrosswordDataState;
    }

    case ac.actions.ENTRY_NEXT: {
      const {
        incomplete_entries_only,
      } = action.payload as ac.IDataEntryNext['payload'];
      let newCrosswordDataState: IReduxStateCrosswordDataSolver = {
        ...crosswordDataState,
        editing_mode: 'empty',
      };

      if (newCrosswordDataState.nextIncompleteEntry) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnEntry(
            newCrosswordDataState,
            EntryID.deSerialize(newCrosswordDataState.nextIncompleteEntry.id),
            true,
            'start'
          ),
        };
      } else if (!incomplete_entries_only) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnEntry(
            newCrosswordDataState,
            EntryID.deSerialize(newCrosswordDataState.nextEntry.id),
            true,
            'start'
          ),
        };
      }

      return newCrosswordDataState;
    }

    case ac.actions.ENTRY_PREVIOUS: {
      const {
        incomplete_entries_only,
        precedence,
      } = action.payload as ac.IDataEntryPrevious['payload'];
      let newCrosswordDataState: IReduxStateCrosswordDataSolver = {
        ...crosswordDataState,
        editing_mode: 'empty',
      };

      if (newCrosswordDataState.previousIncompleteEntry) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnEntry(
            newCrosswordDataState,
            EntryID.deSerialize(
              newCrosswordDataState.previousIncompleteEntry.id
            ),
            true,
            precedence
          ),
        };
      } else if (!incomplete_entries_only) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          ...fns.focusOnEntry(
            newCrosswordDataState,
            EntryID.deSerialize(newCrosswordDataState.previousEntry.id),
            true,
            precedence
          ),
        };
      }

      return newCrosswordDataState;
    }

    case ac.actions.ENTRY_FOCUS: {
      const { entryId } = action.payload as ac.IDataEntryFocus['payload'];

      // change editing mode to empty
      let newCrosswordDataState: IReduxStateCrosswordDataSolver = {
        ...crosswordDataState,
        editing_mode: 'empty',
      };
      newCrosswordDataState = {
        ...newCrosswordDataState,
        ...fns.focusOnEntry(newCrosswordDataState, entryId, true, 'start'),
      };

      return newCrosswordDataState;
    }

    case ac.actions.INTERSECTION_ENTRY_SWITCH: {
      let newCrosswordDataState = crosswordDataState;

      const focusedEntry = CrosswordEntry.deSerialize(
        newCrosswordDataState.focusedEntry
      );

      let eligibleEntries: CrosswordEntry[] = [];

      if (focusedEntry.direction === 'across') {
        eligibleEntries = newCrosswordDataState.entries.down
          .map(entry => CrosswordEntry.deSerialize(entry))
          .filter(entry =>
            selectors.cellIsInEntry(
              entry,
              Cell.deSerialize(newCrosswordDataState.focusedCell)
            )
          );
      } else {
        eligibleEntries = newCrosswordDataState.entries.across
          .map(entry => CrosswordEntry.deSerialize(entry))
          .filter(entry =>
            selectors.cellIsInEntry(
              entry,
              Cell.deSerialize(newCrosswordDataState.focusedCell)
            )
          );
      }

      if (eligibleEntries.length > 0) {
        newCrosswordDataState = {
          ...newCrosswordDataState,
          focusedEntry: eligibleEntries[0].serialize(),
        };
      }

      return newCrosswordDataState;
    }

    // use this if you are performing action on the frontend only (not synced to server)
    // marks has_revealed_any/has_revealed_all
    case ac.actions.VALIDATE_ENTRY_NO_STREAK: {
      let newCrosswordDataState = crosswordDataState;

      if (newCrosswordDataState.strict_mode) {
        return newCrosswordDataState;
      }

      const focusedEntry = CrosswordEntry.deSerialize(
        newCrosswordDataState.focusedEntry
      );

      newCrosswordDataState = {
        ...newCrosswordDataState,
        hasRevealedAny: true,
        playerActions: {
          ...newCrosswordDataState.playerActions,
          entry_checks: Array.from(
            new Set([
              ...newCrosswordDataState.playerActions.entry_checks,
              focusedEntry.id.value,
            ])
          ),
        },
      };

      return newCrosswordDataState;
    }

    // use this if you are performing action on the frontend only (not synced to server)
    // marks has_revealed_any/has_revealed_all
    case ac.actions.VALIDATE_ALL_NO_STREAK: {
      let newCrosswordDataState = crosswordDataState;

      if (newCrosswordDataState.strict_mode) {
        return newCrosswordDataState;
      }

      newCrosswordDataState = {
        ...newCrosswordDataState,
        hasRevealedAll: true,
        playerActions: {
          ...newCrosswordDataState.playerActions,
          entry_checks: Array.from(
            new Set([
              ...newCrosswordDataState.playerActions.entry_checks,
              ...newCrosswordDataState.entries.across
                .concat(newCrosswordDataState.entries.down)
                .map(entry => entry.id.value),
            ])
          ),
        },
      };

      return newCrosswordDataState;
    }

    // use this if you are performing action on the frontend only (not synced to server)
    // marks has_revealed_any/has_revealed_all
    case ac.actions.REVEAL_ENTRY_NO_STREAK: {
      let newCrosswordDataState = crosswordDataState;

      if (newCrosswordDataState.strict_mode) {
        return newCrosswordDataState;
      }

      const focusedEntry = CrosswordEntry.deSerialize(
        newCrosswordDataState.focusedEntry
      );

      newCrosswordDataState = {
        ...newCrosswordDataState,
        hasRevealedAny: true,
        playerActions: {
          ...newCrosswordDataState.playerActions,
          entry_reveals: Array.from(
            new Set([
              ...newCrosswordDataState.playerActions.entry_reveals,
              focusedEntry.id.value,
            ])
          ),
        },
      };

      return newCrosswordDataState;
    }

    // use this if you are performing action on the frontend only (not synced to server)
    // marks has_revealed_any/has_revealed_all
    case ac.actions.REVEAL_ALL_NO_STREAK: {
      let newCrosswordDataState = crosswordDataState;

      if (newCrosswordDataState.strict_mode) {
        return newCrosswordDataState;
      }

      newCrosswordDataState = {
        ...newCrosswordDataState,
        hasRevealedAll: true,
        playerActions: {
          ...newCrosswordDataState.playerActions,
          entry_reveals: Array.from(
            new Set([
              ...newCrosswordDataState.playerActions.entry_reveals,
              ...newCrosswordDataState.entries.across
                .concat(newCrosswordDataState.entries.down)
                .map(entry => entry.id.value),
            ])
          ),
        },
      };

      return newCrosswordDataState;
    }

    case ac.actions.CLEAR_ENTRY: {
      let newCrosswordDataState = crosswordDataState;

      const cells = selectors.entryCells(
        CrosswordEntry.deSerialize(newCrosswordDataState.focusedEntry)
      );

      newCrosswordDataState = {
        ...newCrosswordDataState,
        ...fns.clearPlayerCells(newCrosswordDataState, cells),
      };

      return newCrosswordDataState;
    }

    case ac.actions.CLEAR_ALL: {
      let newCrosswordDataState = crosswordDataState;

      const entryIds = newCrosswordDataState.entries.across
        .concat(newCrosswordDataState.entries.down)
        .map(entry => EntryID.deSerialize(entry.id));

      const cells = entryIds.reduce<Cell[]>((prev, entryId) => {
        const crosswordEntry = selectors.getCrosswordEntry(
          newCrosswordDataState,
          entryId
        );
        return prev.concat(selectors.entryCells(crosswordEntry));
      }, []);

      newCrosswordDataState = {
        ...newCrosswordDataState,
        ...fns.clearPlayerCells(newCrosswordDataState, cells),
      };

      return newCrosswordDataState;
    }

    default:
      return crosswordDataState;
  }
};

const crosswordSolvingReducer: Reducer<
  Readonly<IReduxStateCrosswordDataSolver>,
  IActionData
> = (crosswordDataState, action): IReduxStateCrosswordDataSolver => {
  let newCrosswordDataState: IReduxStateCrosswordDataSolver = crosswordDataStateReducer(
    crosswordDataState,
    action
  );

  newCrosswordDataState = {
    ...newCrosswordDataState,
    model: getCrosswordDataModelFromSolverState({
      ...newCrosswordDataState,
    }),
  };

  if (newCrosswordDataState.initialized) {
    const focusedCell = Cell.deSerialize(newCrosswordDataState.focusedCell);
    const focusedEntry = CrosswordEntry.deSerialize(
      newCrosswordDataState.focusedEntry
    );
    const cell_focus_change = crosswordDataState
      ? !Cell.deSerialize(crosswordDataState.focusedCell).equals(focusedCell)
      : true;

    const entry_focus_change = crosswordDataState
      ? crosswordDataState.focusedEntry.id !==
        newCrosswordDataState.focusedEntry.id
      : true;

    const entries_with_errors: CrosswordEntry[] = newCrosswordDataState.entries.across
      .concat(newCrosswordDataState.entries.down)
      .map(entry => CrosswordEntry.deSerialize(entry))
      .map(entry => {
        return {
          entry,
          is_complete: selectors.entryIsComplete(
            newCrosswordDataState,
            entry.id
          ),
        };
      })
      .filter(d => !d.is_complete)
      .map(d => d.entry);

    newCrosswordDataState = {
      ...newCrosswordDataState,
      // reveal player values
      // it is done in this block since we need to use the new state in computing valuesMetadata in next block
      ...fns.fillPlayerCellsWithCorrectValues(
        newCrosswordDataState,
        Object.keys(newCrosswordDataState.values)
          .filter(position_id => {
            const positionID = PositionID.fromValue(position_id);
            const cell = positionID.getCell();
            const cellEntries = selectors.cellEntries(
              newCrosswordDataState,
              cell
            );

            if (
              newCrosswordDataState.playerActions.cell_reveals.includes(
                position_id
              )
            ) {
              return true;
            } else if (
              arrayIntersect(
                newCrosswordDataState.playerActions.entry_reveals,
                cellEntries.map(entry => entry.id.value)
              ).length > 0
            ) {
              return true;
            }

            return false;
          })
          .map(position_id => PositionID.fromValue(position_id).getCell())
      ),
    };

    newCrosswordDataState = {
      ...newCrosswordDataState,
      is_complete: selectors.crosswordIsComplete(newCrosswordDataState),
      is_at_intersection:
        selectors.cellEntries(newCrosswordDataState, focusedCell).length > 1,
      valuesMetadata: Object.keys(newCrosswordDataState.valuesMetadata).reduce<
        IReduxStateCrosswordDataSolver['valuesMetadata']
      >((prev, position_id) => {
        const metadata = newCrosswordDataState.valuesMetadata[position_id];
        if (!metadata) {
          throw new Error(`no valueMetadata for ${position_id}`);
        }

        const published_value = newCrosswordDataState.values[position_id];
        const positionID = PositionID.fromValue(position_id);
        const cell = positionID.getCell();
        const cellEntries = selectors.cellEntries(newCrosswordDataState, cell);

        if (!published_value) {
          throw new Error(
            `there should be a published value at ${position_id}`
          );
        }

        const player_value = newCrosswordDataState.playerValues[position_id];
        let entry_across_error: boolean = entries_with_errors
          .filter(entry => entry.direction === 'across')
          .reduce<boolean>((prev, entry) => {
            return prev || selectors.cellIsInEntry(entry, cell);
          }, false);
        let entry_down_error: boolean = entries_with_errors
          .filter(entry => entry.direction === 'down')
          .reduce<boolean>((prev, entry) => {
            return prev || selectors.cellIsInEntry(entry, cell);
          }, false);

        // normalize entry errors
        if (entry_across_error !== entry_down_error) {
          if (cellEntries.length === 2) {
            // this is a cell at an intersection. Set error to false (one of them is false)
            entry_across_error = false;
            entry_down_error = false;
          } else if (cellEntries.length === 1) {
            // this is a cell that is on one entry only. Set error to true (one of them is true)
            entry_across_error = true;
            entry_down_error = true;
          }
        }

        prev[position_id] = {
          ...metadata,
          cell: cell.serialize(),
          cell_focus: cell.equals(focusedCell),
          cell_error: player_value
            ? !PositionValue.deSerialize(published_value).equals(
                PositionValue.deSerialize(player_value)
              )
            : true,
          entry_focus: selectors.cellIsInEntry(focusedEntry, cell),
          entry_across_error,
          entry_down_error,
          human_index:
            selectors.cellHumanIndex(newCrosswordDataState, cell) || null,
          value_published: PositionValue.deSerialize(published_value),
          value_player: player_value
            ? PositionValue.deSerialize(player_value)
            : new PositionValue({ value: '' }),
          $show_cell_value:
            prev[position_id]?.$show_cell_value ||
            newCrosswordDataState.playerActions.cell_reveals.includes(
              position_id
            ),
          $show_cell_success:
            prev[position_id]?.$show_cell_success ||
            newCrosswordDataState.playerActions.cell_checks.includes(
              position_id
            ),
          $show_cell_error:
            prev[position_id]?.$show_cell_error ||
            newCrosswordDataState.playerActions.cell_checks.includes(
              position_id
            ),
          $show_cell_value_because_entry:
            prev[position_id]?.$show_cell_value_because_entry ||
            arrayIntersect(
              newCrosswordDataState.playerActions.entry_reveals,
              cellEntries.map(entry => entry.id.value)
            ).length > 0,
          $show_cell_success_because_entry:
            prev[position_id]?.$show_cell_success_because_entry ||
            arrayIntersect(
              newCrosswordDataState.playerActions.entry_checks,
              cellEntries.map(entry => entry.id.value)
            ).length > 0,
          $show_cell_error_because_entry:
            prev[position_id]?.$show_cell_error_because_entry ||
            arrayIntersect(
              newCrosswordDataState.playerActions.entry_checks,
              cellEntries.map(entry => entry.id.value)
            ).length > 0,
        };

        return prev;
      }, {}),
      entriesMetadata: newCrosswordDataState.entries.across
        .concat(newCrosswordDataState.entries.down)
        .reduce<IReduxStateCrosswordDataSolver['entriesMetadata']>(
          (prev, serialized_entry) => {
            const entry = CrosswordEntry.deSerialize(serialized_entry);
            const entry_id = entry.id.value;

            prev[entry_id] = new EntryMetadata({
              entry,
              entry_focus: focusedEntry.equals(entry),
              entry_error: !selectors.entryIsComplete(
                newCrosswordDataState,
                entry.id
              ),
              all_cells_have_player_values: selectors.allCellsInEntryHavePlayerValues(
                newCrosswordDataState,
                entry
              ),
              is_complete: selectors.entryIsComplete(
                newCrosswordDataState,
                entry.id
              ),
              entryClue: selectors.entryClue(newCrosswordDataState, entry.id),
              entryValue: selectors.entryValue(newCrosswordDataState, entry.id),
            }).serialize();

            return prev;
          },
          {}
        ),
      previousCellInEntry:
        cell_focus_change || entry_focus_change
          ? selectors
              .getCrosswordEntryPreviousCell(
                newCrosswordDataState,
                focusedEntry.id,
                focusedCell
              )
              ?.serialize()
          : crosswordDataState?.previousCellInEntry,
      nextCellInEntry:
        cell_focus_change || entry_focus_change
          ? selectors
              .getCrosswordEntryNextCell(
                newCrosswordDataState,
                focusedEntry.id,
                focusedCell
              )
              ?.serialize()
          : crosswordDataState?.nextCellInEntry,
      previousEmptyCellInEntry:
        cell_focus_change || entry_focus_change
          ? selectors
              .getCrosswordEntryPreviousCellWithoutPlayerValues(
                newCrosswordDataState,
                focusedEntry.id,
                focusedCell
              )
              ?.serialize()
          : crosswordDataState?.previousEmptyCellInEntry,
      nextEmptyCellInEntry:
        cell_focus_change || entry_focus_change
          ? selectors
              .getCrosswordEntryNextCellWithoutPlayerValues(
                newCrosswordDataState,
                focusedEntry.id,
                focusedCell
              )
              ?.serialize()
          : crosswordDataState?.nextEmptyCellInEntry,
      northCellInSameLine:
        cell_focus_change || entry_focus_change
          ? selectors
              .getPreviousCellInSameLine(
                newCrosswordDataState,
                focusedCell,
                'down'
              )
              ?.serialize()
          : crosswordDataState?.northCellInSameLine,
      southCellInSameLine:
        cell_focus_change || entry_focus_change
          ? selectors
              .getNextCellInSameLine(newCrosswordDataState, focusedCell, 'down')
              ?.serialize()
          : crosswordDataState?.southCellInSameLine,
      westCellInSameLine:
        cell_focus_change || entry_focus_change
          ? selectors
              .getPreviousCellInSameLine(
                newCrosswordDataState,
                focusedCell,
                'across'
              )
              ?.serialize()
          : crosswordDataState?.westCellInSameLine,
      eastCellInSameLine:
        cell_focus_change || entry_focus_change
          ? selectors
              .getNextCellInSameLine(
                newCrosswordDataState,
                focusedCell,
                'across'
              )
              ?.serialize()
          : crosswordDataState?.eastCellInSameLine,
      previousEntry: selectors
        .getPreviousCrosswordEntry(newCrosswordDataState, focusedEntry)
        .serialize(),
      nextEntry: selectors
        .getNextCrosswordEntry(newCrosswordDataState, focusedEntry)
        .serialize(),
      previousIncompleteEntry: selectors
        .getPreviousCrosswordEntryWithAnEmptyCell(
          newCrosswordDataState,
          focusedEntry
        )
        ?.serialize(),
      nextIncompleteEntry: selectors
        .getNextCrosswordEntryWithAnEmptyCell(
          newCrosswordDataState,
          focusedEntry
        )
        ?.serialize(),
    };

    persistPlayerValues({
      uuid: newCrosswordDataState.uuid,
      player_values: newCrosswordDataState.playerValues,
      player_values_metadata: newCrosswordDataState.playerValuesMetadata,
      player_actions: newCrosswordDataState.playerActions,
    });
  }

  return newCrosswordDataState;
};

export interface IReduxStateCrosswordDataSolving {
  [uuid: string]: IReduxStateCrosswordDataSolver | undefined;
}

export const reducer: Reducer<
  Readonly<IReduxStateCrosswordDataSolving>,
  IActionData
> = (
  currentCrosswordSolvingState = {},
  action
): IReduxStateCrosswordDataSolving => {
  if (action.type.indexOf(ac.actionPrefix) > -1) {
    try {
      return {
        ...currentCrosswordSolvingState,
        [action.uuid]: {
          ...currentCrosswordSolvingState[action.uuid],
          ...crosswordSolvingReducer(
            currentCrosswordSolvingState[action.uuid],
            action
          ),
        },
      };
    } catch (error) {
      logger.error(
        new VError(
          {
            cause: error,
            info: {
              action,
            },
          },
          error.message
        )
      );
    }
  }

  return currentCrosswordSolvingState;
};
