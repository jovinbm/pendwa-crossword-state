import { CrosswordEntry } from '@app-frontend/models/crossword/CrosswordEntry';
import { EntryClue } from '@app-frontend/models/crossword/EntryClue';
import { EntryValue } from '@app-frontend/models/crossword/EntryValue';

interface ISerializeEntryMetadata {
  serialized: number;
  entry: ReturnType<CrosswordEntry['serialize']>;
  entry_focus: boolean;
  entry_error: boolean;
  all_cells_have_player_values: boolean;
  is_complete: boolean;
  entryClue: ReturnType<EntryClue['serialize']>;
  entryValue: ReturnType<EntryValue['serialize']>;
}

export class EntryMetadata {
  public static deSerialize(value: ISerializeEntryMetadata): EntryMetadata {
    return new EntryMetadata({
      ...value,
      entry: CrosswordEntry.deSerialize(value.entry),
      entryClue: EntryClue.deSerialize(value.entryClue),
      entryValue: EntryValue.deSerialize(value.entryValue),
    });
  }

  public readonly entry: CrosswordEntry;
  public readonly entry_focus: boolean;
  public readonly entry_error: boolean;
  public readonly all_cells_have_player_values: boolean;
  public readonly is_complete: boolean;
  public readonly entryClue: EntryClue;
  public readonly entryValue: EntryValue;

  constructor(params: {
    entry: CrosswordEntry;
    entry_focus: boolean;
    entry_error: boolean;
    all_cells_have_player_values: boolean;
    is_complete: boolean;
    entryClue: EntryClue;
    entryValue: EntryValue;
  }) {
    this.entry = params.entry;
    this.entry_focus = params.entry_focus;
    this.entry_error = params.entry_error;
    this.all_cells_have_player_values = params.all_cells_have_player_values;
    this.is_complete = params.is_complete;
    this.entryClue = params.entryClue;
    this.entryValue = params.entryValue;
  }

  public equals(value: EntryMetadata): boolean {
    return (
      this.entry.equals(value.entry) &&
      this.entry_focus === value.entry_focus &&
      this.entry_error === value.entry_error &&
      this.is_complete === value.is_complete &&
      this.all_cells_have_player_values ===
        value.all_cells_have_player_values &&
      this.entryClue.equals(value.entryClue) &&
      this.entryValue.equals(value.entryValue)
    );
  }

  public serialize(): ISerializeEntryMetadata {
    return {
      serialized: 1,
      entry: this.entry.serialize(),
      entry_focus: this.entry_focus,
      entry_error: this.entry_error,
      is_complete: this.is_complete,
      all_cells_have_player_values: this.all_cells_have_player_values,
      entryClue: this.entryClue.serialize(),
      entryValue: this.entryValue.serialize(),
    };
  }
}
