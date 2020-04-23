# Pendwa's Crossword Solving State

## Before you begin...

- This is for inspirational purposes only as people are curious how exactly the crossword works. 
- This code was extracted from Pendwa's private repository and made public. Many more components are left out so it will not run by itself 😞.
- Last updated: April 23rd, 2020.

## Prerequisites
- [Redux JS](https://redux.js.org/). The entire state of the crossword while solving can get pretty complex. To make things a bit easier, it is always better to separate the state from the view (React, not included).
- [Typescript](https://www.typescriptlang.org/) (for our own sanity). Really, the only reason coding in Javascript makes sense.
- Smile 😃.

## Structure
- `ac.ts` - Redux action creators.
- `fns.ts` - Collections of useful re-usable functions that mutate our redux state and return a new state.
- `selectors.ts` - Collections of useful re-usable selectors to select 😅 data from our very complex state.
- `reducers.ts` - Take an action, return a new state. The backbone of Redux really. Since the state is very complex, the reducer is also very complex. Most of it is very expressive so the patient reader will get something.
- `persist.ts` - Persisting useful info to Indexed DB so we can survive browser refreshes and offline situations.
- `models/...` - Models for things like Cells e.t.c

### License

[MIT licensed](./LICENSE) - in short free to copy/use/modify/re-distribute 😇. 