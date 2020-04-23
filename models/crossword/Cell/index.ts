interface ISerializeCell {
  serialized: number;
  x: number;
  y: number;
}

export class Cell {
  public static deSerialize(value: ISerializeCell): Cell {
    return new Cell(value);
  }

  public readonly x: number;
  public readonly y: number;

  constructor(params: { x: number; y: number }) {
    this.x = params.x;
    this.y = params.y;
  }

  public equals(cell: Cell): boolean {
    return this.x === cell.x && this.y === cell.y;
  }

  public serialize(): ISerializeCell {
    return {
      serialized: 1,
      x: this.x,
      y: this.y,
    };
  }
}
