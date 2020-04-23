import { TCrosswordDirection } from '@app-frontend/models/crossword/@types';

interface ISerializeEntryID {
  serialized: number;
  human_index: number;
  direction: TCrosswordDirection;
  value: string;
}

export class EntryID {
  public static deSerialize(value: ISerializeEntryID): EntryID {
    return new EntryID(value);
  }

  public static fromValue(value: string): EntryID {
    const [raw_human_index, direction] = value.split('-').filter(d => !!d);
    if (!/^[0-9]{1}/.test(raw_human_index)) {
      throw new Error(`invalid human_index in value ${value}`);
    }
    if (!['across', 'down'].includes(direction)) {
      throw new Error(`invalid direction in value ${value}`);
    }
    return new EntryID({
      human_index: parseInt(raw_human_index, 10),
      direction: direction as TCrosswordDirection,
    });
  }

  public readonly human_index: number;
  public readonly direction: TCrosswordDirection;
  public readonly value: string; // e.g. 1-across
  constructor(params: { human_index: number; direction: TCrosswordDirection }) {
    if (params.human_index < 1) {
      throw new Error(
        `human_index cannot be less than 1, got ${params.human_index}`
      );
    }
    this.human_index = params.human_index;
    this.direction = params.direction;
    this.value = `${params.human_index}-${params.direction}`;
  }

  public equals(entryId: EntryID): boolean {
    return this.value === entryId.value;
  }

  public serialize(): ISerializeEntryID {
    return {
      serialized: 1,
      human_index: this.human_index,
      direction: this.direction,
      value: this.value,
    };
  }
}
