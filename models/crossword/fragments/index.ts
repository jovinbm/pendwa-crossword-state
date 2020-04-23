import gql from 'graphql-tag';

export const fragmentCrosswordPuzzleDimensions = gql`
  fragment fragmentCrosswordPuzzleDimensions on TypeCrosswordPuzzleDimensions {
    width
    height
  }
`;

export const fragTypeCrosswordPuzzleCell = gql`
  fragment fragTypeCrosswordPuzzleCell on TypeCrosswordPuzzleCell {
    x
    y
  }
`;

export const fragTypeCrosswordPuzzleEntry = gql`
  fragment fragTypeCrosswordPuzzleEntry on TypeCrosswordPuzzleEntry {
    id
    start {
      x
      y
    }
    end {
      x
      y
    }
    value
    length
    direction
    human_index
  }
`;

export const fragmentCrosswordPuzzleEntries = gql`
  fragment fragmentCrosswordPuzzleEntries on TypeCrosswordPuzzleEntries {
    across {
      id
      start {
        x
        y
      }
      end {
        x
        y
      }
      value
      length
      direction
      human_index
    }
    down {
      id
      start {
        x
        y
      }
      end {
        x
        y
      }
      value
      length
      direction
      human_index
    }
  }
`;

export const fragmentCrosswordPuzzleData = gql`
  fragment fragmentCrosswordPuzzleData on TypeCrosswordPuzzleData {
    dimensions {
      width
      height
    }
    values
    entries {
      across {
        id
        start {
          x
          y
        }
        end {
          x
          y
        }
        value
        length
        direction
        human_index
      }
      down {
        id
        start {
          x
          y
        }
        end {
          x
          y
        }
        value
        length
        direction
        human_index
      }
    }
    clues
  }
`;

export const fragmentCrosswordSolutionData = gql`
  fragment fragmentCrosswordSolutionData on TypeCrosswordSolutionData {
    player_values
    player_values_metadata
    player_actions
  }
`;
