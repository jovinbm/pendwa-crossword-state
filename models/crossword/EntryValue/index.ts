import { PositionValue } from '@app-frontend/models/crossword/PositionValue';

interface ISerializeEntryValue {
  serialized: number;
  value: ReturnType<PositionValue['serialize']>[];
}

export class EntryValue {
  public static deSerialize(value: ISerializeEntryValue): EntryValue {
    return new EntryValue({
      value: value.value.map(v => PositionValue.deSerialize(v)),
    });
  }

  public readonly value: PositionValue[];

  constructor(params: { value: PositionValue[] }) {
    this.value = params.value;
  }

  public equals(value: EntryValue): boolean {
    if (this.value.length !== value.value.length) {
      return false;
    }

    let is_equal: boolean = true;

    for (let i = 0; i < this.value.length; i++) {
      if (!this.value[i].equals(value.value[i])) {
        is_equal = false;
        break;
      }
    }

    return is_equal;
  }

  public serialize(): ISerializeEntryValue {
    return {
      serialized: 1,
      value: this.value.map(v => v.serialize()),
    };
  }
}
