import { appDatabase } from '@app-frontend/lib/appStore/dexie';
import { logger } from '@app-frontend/lib/logger';
import { IReduxStateCrosswordDataSolver } from '@app-frontend/models/crossword/@types/redux';
import throttle from 'lodash.throttle';

export interface IDBCrosswordSolvingPlayerValues {
  uuid: string;
  player_values: IReduxStateCrosswordDataSolver['playerValues'];
  player_values_metadata?: IReduxStateCrosswordDataSolver['playerValuesMetadata'];
  player_actions?: IReduxStateCrosswordDataSolver['playerActions'];
}

const throttledPersistPlayerValues = throttle(
  (params: IDBCrosswordSolvingPlayerValues) => {
    appDatabase
      .setAppData(appDatabase.crosswordSolvingPlayerValues, params)
      .catch(logger.error);
  },
  5000
);

/**
 * Persists important player values and metadata in index db so they can survive refreshes/offline
 */
export const persistPlayerValues = (params: IDBCrosswordSolvingPlayerValues) =>
  throttledPersistPlayerValues(params);
