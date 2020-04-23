interface ISerializePositionValueMetadata {
  serialized: number;
  time: number;
}

export class PositionValueMetadata {
  public static deSerialize(
    value: ISerializePositionValueMetadata
  ): PositionValueMetadata {
    return new PositionValueMetadata(value);
  }

  public readonly time: number;
  constructor(params: { time: number }) {
    if (!params.time) {
      throw new Error(`time must be number, got ${params.time}`);
    }
    this.time = params.time;
  }

  public serialize(): ISerializePositionValueMetadata {
    return {
      serialized: 1,
      time: this.time,
    };
  }
}
