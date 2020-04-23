export const keyboardKeys = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  BACK_SPACE: 8,
  ALT: 18,
  F1: 112,
  F2: 113,
  isNumber(key_number: number): boolean {
    return key_number >= 48 && key_number <= 57;
  },
  isAlphabet(key_number: number): boolean {
    return (
      (key_number >= 65 && key_number <= 90) ||
      (key_number >= 97 && key_number <= 122)
    );
  },
};
