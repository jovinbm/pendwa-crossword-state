interface ISerializeEntryClue {
  serialized: number;
  value: string;
}

export class EntryClue {
  public static deSerialize(value: ISerializeEntryClue): EntryClue {
    return new EntryClue(value);
  }

  public readonly value: string;

  constructor(params: { value: string }) {
    this.value = params.value;
  }

  public equals(value: EntryClue): boolean {
    return this.value === value.value;
  }

  public serialize(): ISerializeEntryClue {
    return {
      serialized: 1,
      value: this.value,
    };
  }
}
