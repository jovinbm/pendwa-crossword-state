interface ISerializePositionValue {
  serialized: number;
  value: string;
}

export class PositionValue {
  public static deSerialize(value: ISerializePositionValue): PositionValue {
    return new PositionValue(value);
  }

  public readonly value: string; // a single letter at that cell
  constructor(params: { value: string }) {
    if (params.value.length > 1) {
      throw new Error(
        `value must be a single letter or empty, got ${params.value}`
      );
    }
    this.value = params.value.toUpperCase();
  }

  public equals(value: PositionValue): boolean {
    return this.value === value.value;
  }

  public serialize(): ISerializePositionValue {
    return {
      serialized: 1,
      value: this.value,
    };
  }
}
