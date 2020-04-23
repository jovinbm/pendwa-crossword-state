import { Cell } from '@app-frontend/models/crossword/Cell';

interface ISerializePositionID {
  serialized: number;
  x: number;
  y: number;
  value: string;
}

export class PositionID {
  public static deSerialize(value: ISerializePositionID): PositionID {
    return new PositionID({
      cell: new Cell({
        x: value.x,
        y: value.y,
      }),
    });
  }

  public static fromValue(value: string): PositionID {
    const [x, y] = value
      .split(',')
      .filter(d => !!d)
      .map(d => Number(d));
    if (isNaN(x)) {
      throw new Error(`invalid x in position id value ${value}`);
    }
    if (isNaN(y)) {
      throw new Error(`invalid y in position id value ${value}`);
    }
    return new PositionID({
      cell: new Cell({
        x,
        y,
      }),
    });
  }

  public readonly x: number;
  public readonly y: number;
  public readonly value: string; // x,y
  constructor(params: { cell: Cell }) {
    this.x = params.cell.x;
    this.y = params.cell.y;
    this.value = `${params.cell.x},${params.cell.y}`;
  }

  public serialize(): ISerializePositionID {
    return {
      serialized: 1,
      x: this.x,
      y: this.y,
      value: this.value,
    };
  }

  public getCell(): Cell {
    return new Cell({ x: this.x, y: this.y });
  }

  public equals(positionId: PositionID): boolean {
    return positionId.value === this.value;
  }
}
