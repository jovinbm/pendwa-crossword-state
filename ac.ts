import { CrosswordPuzzleNS } from '@app-api/app/lib/mysql/models/crosswordPuzzle/@types';
import { decryptCrosswordPuzzleData } from '@app-api/app/lib/mysql/models/crosswordPuzzle/utils';
import { CrosswordSolutionNS } from '@app-api/app/lib/mysql/models/crosswordSolution/@types';
import { appDatabase } from '@app-frontend/lib/appStore/dexie';
import { logger } from '@app-frontend/lib/logger';
import { TThunkResult } from '@app-frontend/lib/redux-store';
import {
  IReduxStateCrosswordDataPublisher,
  IReduxStateCrosswordDataSolver,
} from '@app-frontend/models/crossword/@types/redux';
import { Cell } from '@app-frontend/models/crossword/Cell';
import { CrosswordEntry } from '@app-frontend/models/crossword/CrosswordEntry';
import { EntryClue } from '@app-frontend/models/crossword/EntryClue';
import { EntryID } from '@app-frontend/models/crossword/EntryID';
import { EntryValue } from '@app-frontend/models/crossword/EntryValue';
import { PositionValue } from '@app-frontend/models/crossword/PositionValue';
import { PositionValueMetadata } from '@app-frontend/models/crossword/PositionValueMetadata';
import moment from 'moment';
import { IActionData } from './@types';

export const actionPrefix = 'crossword/solver';
export const actions = {
  INITIALIZE: `${actionPrefix}/actions/initialize`,
  RE_INITIALIZE: `${actionPrefix}/actions/re-initialize`,
  ACTION_LEFT: `${actionPrefix}/actions/left`,
  ACTION_RIGHT: `${actionPrefix}/actions/right`,
  ACTION_UP: `${actionPrefix}/actions/up`,
  ACTION_DOWN: `${actionPrefix}/actions/down`,
  ACTION_CELL_CLICK: `${actionPrefix}/actions/cell-click`,
  ACTION_CHARACTER: `${actionPrefix}/actions/character`,
  ACTION_DELETE: `${actionPrefix}/actions/delete`,
  ENTRY_NEXT: `${actionPrefix}/actions/entry/next`,
  ENTRY_PREVIOUS: `${actionPrefix}/actions/entry/previous`,
  ENTRY_FOCUS: `${actionPrefix}/actions/entry/focus`,
  INTERSECTION_ENTRY_SWITCH: `${actionPrefix}/actions/entry/intersection/switch`,
  VALIDATE_ENTRY_NO_STREAK: `${actionPrefix}/actions/entry/validateEntryNoStreak`,
  VALIDATE_ALL_NO_STREAK: `${actionPrefix}/actions/entry/validateAllNoStreak`,
  REVEAL_ENTRY_NO_STREAK: `${actionPrefix}/actions/entry/revealEntryNoStreak`,
  REVEAL_ALL_NO_STREAK: `${actionPrefix}/actions/entry/revealAllNoStreak`,
  CLEAR_ENTRY: `${actionPrefix}/actions/entry/clearEntry`,
  CLEAR_ALL: `${actionPrefix}/actions/entry/clearAll`,
  KEY_F1: `${actionPrefix}/keys/f1`,
  KEY_F2: `${actionPrefix}/keys/f2`,
  KEY_ALT: `${actionPrefix}/keys/alt`,
};

export interface IArgsInitializeCrosswordSolution {
  re_initialize: boolean; // if crossword is already in motion, you may want to just re-initialize some values like player_values, has_revealed e.t.c
  uuid: string;
  strict_mode: boolean;
  height: number;
  width: number;
  has_revealed_any?: boolean;
  has_revealed_all?: boolean;
  player_values?: CrosswordSolutionNS.IData['player_values'];
  player_values_metadata?: CrosswordSolutionNS.IData['player_values_metadata'];
  player_actions?: CrosswordSolutionNS.IData['player_actions'];
  values: CrosswordPuzzleNS.IData['values'];
  entries: CrosswordPuzzleNS.IData['entries'];
  clues: CrosswordPuzzleNS.IData['clues'];
}

export interface IDataInitializeCrosswordSolution extends IActionData {
  payload: {
    height: number;
    width: number;
    strict_mode: boolean;
    hasRevealedAny: IReduxStateCrosswordDataSolver['hasRevealedAny'];
    hasRevealedAll: IReduxStateCrosswordDataSolver['hasRevealedAll'];
    playerValues: IReduxStateCrosswordDataSolver['playerValues'];
    playerValuesMetadata: IReduxStateCrosswordDataSolver['playerValuesMetadata'];
    playerActions: IReduxStateCrosswordDataSolver['playerActions'];
    values: IReduxStateCrosswordDataSolver['values'];
    entries: IReduxStateCrosswordDataSolver['entries'];
    clues: IReduxStateCrosswordDataSolver['clues'];
  };
}

export const initializeCrosswordAC = (
  args: IArgsInitializeCrosswordSolution
): TThunkResult<Promise<IDataInitializeCrosswordSolution>> => {
  return async (dispatch, getState) => {
    const {
      re_initialize,
      uuid,
      strict_mode,
      height,
      width,
      has_revealed_any,
      has_revealed_all,
    } = args;

    const default_empty_player_actions: CrosswordSolutionNS.IData['player_actions'] = {
      cell_checks: [],
      cell_reveals: [],
      entry_checks: [],
      entry_reveals: [],
    };

    const server_player_values = args.player_values || {};
    const server_player_values_metadata = args.player_values_metadata || {};
    const server_player_actions =
      args.player_actions || default_empty_player_actions;

    const state = getState();
    const crosswordDataState = state.crosswordSolving[uuid];

    const {
      player_values: client_player_values,
      player_values_metadata: client_player_values_metadata,
      player_actions: client_player_actions,
    } = crosswordDataState
      ? {
          player_values: crosswordDataState.playerValues || {},
          player_values_metadata: crosswordDataState.playerValuesMetadata || {},
          player_actions:
            crosswordDataState.playerActions || default_empty_player_actions,
        }
      : await appDatabase
          .getAppData(appDatabase.crosswordSolvingPlayerValues, uuid)
          .catch(logger.error)
          .then(d => {
            return d
              ? {
                  player_values: d.player_values || {},
                  player_values_metadata: d.player_values_metadata || {},
                  player_actions:
                    d.player_actions || default_empty_player_actions,
                }
              : {
                  player_values: {} as IReduxStateCrosswordDataSolver['playerValues'],
                  player_values_metadata: {} as IReduxStateCrosswordDataSolver['playerValuesMetadata'],
                  player_actions: default_empty_player_actions,
                };
          });

    const { values, entries, clues } = decryptCrosswordPuzzleData({
      uuid,
      data: {
        dimensions: {
          width,
          height,
        },
        values: args.values,
        entries: args.entries,
        clues: args.clues,
      },
    });

    const newPlayerValues: IReduxStateCrosswordDataSolver['playerValues'] = {};
    const newPlayerValuesMetadata: IReduxStateCrosswordDataSolver['playerValuesMetadata'] = {};
    const newPlayerActions: IReduxStateCrosswordDataSolver['playerActions'] = default_empty_player_actions;

    /**
     * Attempt to merge player values on the client and on the server. The user might have made progress on some
     * other device and synced that progress to the server. We merge that with what we have on this browser.
     */
    Object.keys(server_player_values)
      .concat(Object.keys(client_player_values))
      .map(raw_position_id => {
        const client_player_value: string | undefined =
          client_player_values[raw_position_id]?.value;
        const client_player_value_time: number | undefined =
          client_player_values_metadata[raw_position_id]?.time || undefined;
        const server_player_value: string | undefined =
          server_player_values[raw_position_id];
        const server_player_value_time: number | undefined =
          server_player_values_metadata[raw_position_id]?.time || undefined;

        let final_player_value: string | undefined;
        let final_player_value_time: number | undefined;

        if (
          client_player_value !== undefined &&
          server_player_value !== undefined
        ) {
          if (client_player_value_time && server_player_value_time) {
            final_player_value =
              client_player_value_time > server_player_value_time
                ? client_player_value
                : server_player_value;
            final_player_value_time =
              client_player_value_time > server_player_value_time
                ? client_player_value_time
                : server_player_value_time;
          } else if (client_player_value_time) {
            final_player_value = client_player_value;
            final_player_value_time = client_player_value_time;
          } else if (server_player_value_time) {
            final_player_value = server_player_value;
            final_player_value_time = server_player_value_time;
          } else {
            // client value takes priority
            final_player_value = client_player_value;
            final_player_value_time = client_player_value_time;
          }
        } else if (client_player_value !== undefined) {
          // client value takes priority
          final_player_value = client_player_value;
          final_player_value_time = client_player_value_time;
        } else if (server_player_value !== undefined) {
          final_player_value = server_player_value;
          final_player_value_time = server_player_value_time;
        }

        if (final_player_value !== undefined) {
          newPlayerValues[raw_position_id] = new PositionValue({
            value: final_player_value,
          }).serialize();

          newPlayerValuesMetadata[raw_position_id] = new PositionValueMetadata({
            time:
              final_player_value_time ||
              moment()
                .subtract(1, 'year')
                .valueOf(),
          }).serialize();
        }
      });

    // merge all cells that have been checked
    newPlayerActions.cell_checks = Array.from(
      new Set([
        ...(client_player_actions.cell_checks || []),
        ...(server_player_actions.cell_checks || []),
      ])
    );

    // merge all cells that have been revealed
    newPlayerActions.cell_reveals = Array.from(
      new Set([
        ...(client_player_actions.cell_reveals || []),
        ...(server_player_actions.cell_reveals || []),
      ])
    );

    // merge all entries that have been checked
    newPlayerActions.entry_checks = Array.from(
      new Set([
        ...(client_player_actions.entry_checks || []),
        ...(server_player_actions.entry_checks || []),
      ])
    );

    // merge all entries that have been revealed
    newPlayerActions.entry_reveals = Array.from(
      new Set([
        ...(client_player_actions.entry_reveals || []),
        ...(server_player_actions.entry_reveals || []),
      ])
    );

    return dispatch({
      type: re_initialize ? actions.RE_INITIALIZE : actions.INITIALIZE,
      uuid,
      payload: {
        strict_mode,
        height,
        width,
        hasRevealedAny: has_revealed_any || false,
        hasRevealedAll: has_revealed_all || false,
        playerValues: newPlayerValues,
        playerValuesMetadata: newPlayerValuesMetadata,
        playerActions: newPlayerActions,
        values: Object.keys(values).reduce<
          IReduxStateCrosswordDataPublisher['values']
        >((prev, raw_position_id) => {
          const value = values[raw_position_id];
          if (value) {
            prev[raw_position_id] = new PositionValue({
              value,
            }).serialize();
          }
          return prev;
        }, {}),
        entries: {
          across: entries.across.map(e =>
            new CrosswordEntry({
              id: EntryID.fromValue(e.id),
              start: new Cell(e.start),
              end: new Cell(e.end),
              value: new EntryValue({
                value: e.value
                  .split('')
                  .map(char => new PositionValue({ value: char })),
              }),
              length: e.length,
              direction: e.direction,
              human_index: e.human_index,
            }).serialize()
          ),
          down: entries.down.map(e =>
            new CrosswordEntry({
              id: EntryID.fromValue(e.id),
              start: new Cell(e.start),
              end: new Cell(e.end),
              value: new EntryValue({
                value: e.value
                  .split('')
                  .map(char => new PositionValue({ value: char })),
              }),
              length: e.length,
              direction: e.direction,
              human_index: e.human_index,
            }).serialize()
          ),
        },
        clues: Object.keys(clues).reduce<
          IReduxStateCrosswordDataPublisher['clues']
        >((prev, raw_entry_id) => {
          prev[raw_entry_id] = clues[raw_entry_id]
            ? new EntryClue({ value: clues[raw_entry_id] }).serialize()
            : new EntryClue({ value: '' }).serialize();
          return prev;
        }, {}),
      },
    });
  };
};

export interface IArgsActionLeft {
  uuid: string;
  is_user_action: boolean;
  allow_same_line_jump: boolean;
}

export interface IDataActionLeft extends IActionData {
  payload: {
    is_user_action: boolean;
    allow_same_line_jump: boolean;
  };
}

export const actionLeftAC = (args: IArgsActionLeft): IDataActionLeft => {
  const { uuid, allow_same_line_jump, is_user_action } = args;
  return {
    type: actions.ACTION_LEFT,
    uuid,
    payload: {
      is_user_action,
      allow_same_line_jump,
    },
  };
};

export interface IArgsActionRight {
  uuid: string;
  is_user_action: boolean;
  allow_same_line_jump: boolean;
}

export interface IDataActionRight extends IActionData {
  payload: {
    is_user_action: boolean;
    allow_same_line_jump: boolean;
  };
}

export const actionRightAC = (args: IArgsActionRight): IDataActionRight => {
  const { uuid, allow_same_line_jump, is_user_action } = args;
  return {
    type: actions.ACTION_RIGHT,
    uuid,
    payload: {
      is_user_action,
      allow_same_line_jump,
    },
  };
};

export interface IArgsActionUp {
  uuid: string;
  is_user_action: boolean;
  allow_same_line_jump: boolean;
}

export interface IDataActionUp extends IActionData {
  payload: {
    is_user_action: boolean;
    allow_same_line_jump: boolean;
  };
}

export const actionUpAC = (args: IArgsActionUp): IDataActionUp => {
  const { uuid, allow_same_line_jump, is_user_action } = args;
  return {
    type: actions.ACTION_UP,
    uuid,
    payload: {
      is_user_action,
      allow_same_line_jump,
    },
  };
};

export interface IArgsActionDown {
  uuid: string;
  is_user_action: boolean;
  allow_same_line_jump: boolean;
}

export interface IDataActionDown extends IActionData {
  payload: {
    is_user_action: boolean;
    allow_same_line_jump: boolean;
  };
}

export const actionDownAC = (args: IArgsActionDown): IDataActionDown => {
  const { uuid, allow_same_line_jump, is_user_action } = args;
  return {
    type: actions.ACTION_DOWN,
    uuid,
    payload: {
      is_user_action,
      allow_same_line_jump,
    },
  };
};

export interface IArgsActionCellClick {
  uuid: string;
  cell: Cell;
}

export interface IDataActionCellClick extends IActionData {
  payload: {
    cell: Cell;
  };
}

export const actionCellClickAC = (
  args: IArgsActionCellClick
): IDataActionCellClick => {
  const { uuid, cell } = args;
  return {
    type: actions.ACTION_CELL_CLICK,
    uuid,
    payload: {
      cell,
    },
  };
};

export interface IArgsActionCharacter {
  uuid: string;
  positionValue: PositionValue;
}

export interface IDataActionCharacter extends IActionData {
  payload: {
    positionValue: PositionValue;
  };
}

export const actionCharacterAC = (
  args: IArgsActionCharacter
): IDataActionCharacter => {
  const { uuid, positionValue } = args;
  return {
    type: actions.ACTION_CHARACTER,
    uuid,
    payload: {
      positionValue,
    },
  };
};

export interface IArgsActionDelete {
  uuid: string;
}

export interface IDataActionDelete extends IActionData {
  payload: {};
}

export const actionDeleteAC = (args: IArgsActionDelete): IDataActionDelete => {
  const { uuid } = args;
  return {
    type: actions.ACTION_DELETE,
    uuid,
    payload: {},
  };
};

export interface IArgsEntryNext {
  uuid: string;
  incomplete_entries_only: boolean;
}

export interface IDataEntryNext extends IActionData {
  payload: {
    incomplete_entries_only: boolean;
  };
}

export const entryNextAC = (args: IArgsEntryNext): IDataEntryNext => {
  const { uuid, incomplete_entries_only } = args;
  return {
    type: actions.ENTRY_NEXT,
    uuid,
    payload: {
      incomplete_entries_only,
    },
  };
};

export interface IArgsEntryPrevious {
  uuid: string;
  incomplete_entries_only: boolean;
  precedence: 'start' | 'end';
}

export interface IDataEntryPrevious extends IActionData {
  payload: {
    incomplete_entries_only: boolean;
    precedence: 'start' | 'end';
  };
}

export const entryPreviousAC = (
  args: IArgsEntryPrevious
): IDataEntryPrevious => {
  const { uuid, incomplete_entries_only, precedence } = args;
  return {
    type: actions.ENTRY_PREVIOUS,
    uuid,
    payload: {
      incomplete_entries_only,
      precedence,
    },
  };
};

export interface IArgsEntryFocus {
  uuid: string;
  entryId: EntryID;
}

export interface IDataEntryFocus extends IActionData {
  payload: {
    entryId: EntryID;
  };
}

export const entryFocusAC = (args: IArgsEntryFocus): IDataEntryFocus => {
  const { uuid, entryId } = args;
  return {
    type: actions.ENTRY_FOCUS,
    uuid,
    payload: {
      entryId,
    },
  };
};

export interface IArgsIntersectionEntrySwitch {
  uuid: string;
}

export interface IDataIntersectionEntrySwitch extends IActionData {
  payload: {};
}

export const intersectionEntrySwitchAC = (
  args: IArgsIntersectionEntrySwitch
): IDataIntersectionEntrySwitch => {
  const { uuid } = args;
  return {
    type: actions.INTERSECTION_ENTRY_SWITCH,
    uuid,
    payload: {},
  };
};

export interface IArgsValidateEntryNoStreak {
  uuid: string;
}

export interface IDataValidateEntryNoStreak extends IActionData {
  payload: {};
}

export const validateEntryNoStreakAC = (
  args: IArgsValidateEntryNoStreak
): IDataValidateEntryNoStreak => {
  const { uuid } = args;
  return {
    type: actions.VALIDATE_ENTRY_NO_STREAK,
    uuid,
    payload: {},
  };
};

export interface IArgsValidateAllNoStreak {
  uuid: string;
}

export interface IDataValidateAllNoStreak extends IActionData {
  payload: {};
}

export const validateAllNoStreakAC = (
  args: IArgsValidateAllNoStreak
): IDataValidateAllNoStreak => {
  const { uuid } = args;
  return {
    type: actions.VALIDATE_ALL_NO_STREAK,
    uuid,
    payload: {},
  };
};

export interface IArgsRevealEntryNoStreak {
  uuid: string;
}

export interface IDataRevealEntryNoStreak extends IActionData {
  payload: {};
}

export const revealEntryNoStreakAC = (
  args: IArgsRevealEntryNoStreak
): IDataRevealEntryNoStreak => {
  const { uuid } = args;
  return {
    type: actions.REVEAL_ENTRY_NO_STREAK,
    uuid,
    payload: {},
  };
};

export interface IArgsRevealAllNoStreak {
  uuid: string;
}

export interface IDataRevealAllNoStreak extends IActionData {
  payload: {};
}

export const revealAllNoStreakAC = (
  args: IArgsRevealAllNoStreak
): IDataRevealAllNoStreak => {
  const { uuid } = args;
  return {
    type: actions.REVEAL_ALL_NO_STREAK,
    uuid,
    payload: {},
  };
};

export interface IArgsClearEntry {
  uuid: string;
}

export interface IDataClearEntry extends IActionData {
  payload: {};
}

export const clearEntryAC = (args: IArgsClearEntry): IDataClearEntry => {
  const { uuid } = args;
  return {
    type: actions.CLEAR_ENTRY,
    uuid,
    payload: {},
  };
};

export interface IArgsClearAll {
  uuid: string;
}

export interface IDataClearAll extends IActionData {
  payload: {};
}

export const clearAllAC = (args: IArgsClearAll): IDataClearAll => {
  const { uuid } = args;
  return {
    type: actions.CLEAR_ALL,
    uuid,
    payload: {},
  };
};

export const keysF1AC = (args: IArgsEntryPrevious): IDataEntryPrevious => {
  const { uuid, incomplete_entries_only } = args;
  return {
    type: actions.ENTRY_PREVIOUS,
    uuid,
    payload: {
      incomplete_entries_only,
      precedence: 'start',
    },
  };
};

export const keysF2AC = (args: IArgsEntryNext): IDataEntryNext => {
  const { uuid, incomplete_entries_only } = args;
  return {
    type: actions.ENTRY_NEXT,
    uuid,
    payload: {
      incomplete_entries_only,
    },
  };
};

export const keysALTAC = (
  args: IArgsIntersectionEntrySwitch
): IDataIntersectionEntrySwitch => {
  const { uuid } = args;
  return {
    type: actions.INTERSECTION_ENTRY_SWITCH,
    uuid,
    payload: {},
  };
};
