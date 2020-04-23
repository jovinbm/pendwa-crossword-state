import { TCrosswordDirection } from '@app-frontend/models/crossword/@types';
import { Cell } from '@app-frontend/models/crossword/Cell';
import { EntryID } from '@app-frontend/models/crossword/EntryID';
import { EntryValue } from '@app-frontend/models/crossword/EntryValue';

interface ISerializeCrosswordEntry {
  serialized: number;
  id: ReturnType<EntryID['serialize']>;
  start: ReturnType<Cell['serialize']>;
  end: ReturnType<Cell['serialize']>;
  value: ReturnType<EntryValue['serialize']>;
  length: number;
  direction: TCrosswordDirection;
  human_index: number;
}

export class CrosswordEntry {
  public static deSerialize(value: ISerializeCrosswordEntry): CrosswordEntry {
    return new CrosswordEntry({
      id: EntryID.deSerialize(value.id),
      start: Cell.deSerialize(value.start),
      end: Cell.deSerialize(value.end),
      value: EntryValue.deSerialize(value.value),
      length: value.length,
      direction: value.direction,
      human_index: value.human_index,
    });
  }

  public readonly id: EntryID;
  public readonly start: Cell;
  public readonly end: Cell;
  public readonly value: EntryValue;
  public readonly length: number; // the total length of the value
  public readonly direction: TCrosswordDirection;
  public readonly human_index: number; // the final index of the cell
  constructor(params: {
    id: EntryID;
    start: Cell;
    end: Cell;
    value: EntryValue;
    length: number;
    direction: TCrosswordDirection;
    human_index: number;
  }) {
    this.id = params.id;
    this.start = params.start;
    this.end = params.end;
    this.value = params.value;
    this.length = params.length;
    this.direction = params.direction;
    this.human_index = params.human_index;
  }

  public equals(value: CrosswordEntry): boolean {
    return this.id.equals(value.id);
  }

  public serialize(): ISerializeCrosswordEntry {
    return {
      serialized: 1,
      id: this.id.serialize(),
      start: this.start.serialize(),
      end: this.end.serialize(),
      value: this.value.serialize(),
      length: this.length,
      direction: this.direction,
      human_index: this.human_index,
    };
  }
}
