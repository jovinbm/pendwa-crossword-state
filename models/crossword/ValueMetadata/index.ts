import { Cell } from '@app-frontend/models/crossword/Cell';
import { PositionValue } from '@app-frontend/models/crossword/PositionValue';

interface ISerializeValueMetadata {
  serialized: number;
  cell: ReturnType<Cell['serialize']>;
  cell_focus: boolean;
  cell_error: boolean;
  entry_focus: boolean;
  entry_across_error: boolean;
  entry_down_error: boolean;
  human_index: number | null;
  value_published: PositionValue;
  value_player: PositionValue;
  $show_cell_value: boolean;
  $show_cell_success: boolean;
  $show_cell_error: boolean;
  $show_cell_value_because_entry: boolean;
  $show_cell_success_because_entry: boolean;
  $show_cell_error_because_entry: boolean;
}

export class ValueMetadata {
  public static deSerialize(value: ISerializeValueMetadata): ValueMetadata {
    return new ValueMetadata({
      ...value,
      cell: Cell.deSerialize(value.cell),
    });
  }

  public readonly cell: Cell;
  public readonly cell_focus: boolean;
  public readonly cell_error: boolean;
  public readonly entry_focus: boolean;
  public readonly entry_across_error: boolean;
  public readonly entry_down_error: boolean;
  public readonly human_index: number | null;
  public readonly value_published: PositionValue;
  public readonly value_player: PositionValue;
  public readonly $show_cell_value: boolean;
  public readonly $show_cell_success: boolean;
  public readonly $show_cell_error: boolean;
  public readonly $show_cell_value_because_entry: boolean;
  public readonly $show_cell_success_because_entry: boolean;
  public readonly $show_cell_error_because_entry: boolean;

  constructor(params: {
    cell: Cell;
    cell_focus: boolean;
    cell_error: boolean;
    entry_focus: boolean;
    entry_across_error: boolean;
    entry_down_error: boolean;
    human_index: number | null;
    value_published: PositionValue;
    value_player: PositionValue;
    $show_cell_value: boolean;
    $show_cell_success: boolean;
    $show_cell_error: boolean;
    $show_cell_value_because_entry: boolean;
    $show_cell_success_because_entry: boolean;
    $show_cell_error_because_entry: boolean;
  }) {
    this.cell = params.cell;
    this.cell_focus = params.cell_focus;
    this.cell_error = params.cell_error;
    this.entry_focus = params.entry_focus;
    this.entry_across_error = params.entry_across_error;
    this.entry_down_error = params.entry_down_error;
    this.human_index = params.human_index;
    this.value_published = params.value_published;
    this.value_player = params.value_player;
    this.$show_cell_value = params.$show_cell_value;
    this.$show_cell_success = params.$show_cell_success;
    this.$show_cell_error = params.$show_cell_error;
    this.$show_cell_value_because_entry = params.$show_cell_value_because_entry;
    this.$show_cell_success_because_entry =
      params.$show_cell_success_because_entry;
    this.$show_cell_error_because_entry = params.$show_cell_error_because_entry;
  }

  public equals(value: ValueMetadata): boolean {
    return (
      this.cell.equals(value.cell) &&
      this.cell_error === value.cell_error &&
      this.cell_focus === value.cell_focus &&
      this.entry_focus === value.entry_focus &&
      this.entry_across_error === value.entry_across_error &&
      this.entry_down_error === value.entry_down_error &&
      this.human_index === value.human_index &&
      this.value_published.equals(value.value_published) &&
      this.value_player.equals(value.value_player) &&
      this.$show_cell_value === value.$show_cell_value &&
      this.$show_cell_success === value.$show_cell_success &&
      this.$show_cell_error === value.$show_cell_error &&
      this.$show_cell_value_because_entry ===
        value.$show_cell_value_because_entry &&
      this.$show_cell_success_because_entry ===
        value.$show_cell_success_because_entry &&
      this.$show_cell_error_because_entry ===
        value.$show_cell_error_because_entry
    );
  }

  public serialize(): ISerializeValueMetadata {
    return {
      serialized: 1,
      cell: this.cell.serialize(),
      cell_focus: this.cell_focus,
      cell_error: this.cell_error,
      entry_focus: this.entry_focus,
      entry_across_error: this.entry_across_error,
      entry_down_error: this.entry_down_error,
      human_index: this.human_index,
      value_published: this.value_published,
      value_player: this.value_player,
      $show_cell_value: this.$show_cell_value,
      $show_cell_success: this.$show_cell_success,
      $show_cell_error: this.$show_cell_error,
      $show_cell_value_because_entry: this.$show_cell_value_because_entry,
      $show_cell_success_because_entry: this.$show_cell_success_because_entry,
      $show_cell_error_because_entry: this.$show_cell_error_because_entry,
    };
  }
}
