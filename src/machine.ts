import { createMachine } from 'xstate';
import { assign, createUpdater, ImmerUpdateEvent } from '@xstate/immer';

enum PlayerTypes {
  'x' = 'x',
  'o' = 'o',
}

// The context (extended state) of the machine
export interface TicTacToeContext {
  board: (PlayerTypes | null)[];
  moves: number;
  player: PlayerTypes;
  winner: undefined | PlayerTypes;
}
// The events that the machine handles

export type TicTacToeState =
  | {
      value: 'playing';
      context: TicTacToeContext & { winner: undefined };
    }
  | {
      value: 'winner';
      context: TicTacToeContext;
    }
  | {
      value: 'draw';
      context: TicTacToeContext & { winner: undefined };
    };

const initialContext = {
  board: Array(9).fill(null),
  moves: 0,
  player: PlayerTypes.x,
  winner: undefined,
};

// ISSUE #2
/**
 * the event is of the wrong type - in the guard declaration in the machine,
 * the event is passed in as PlayUpdateEvent
 *
 * however, this event shape is incorrect and has the shape {type: "PLAY", player: "x", value: 2}
 */
const isValidMove = (ctx: TicTacToeContext, e: PlayUpdateEvent) => {
  console.log('e', e);
  return true;
  // return ctx.board[e.value] === null;
};

function checkWin(ctx: TicTacToeContext) {
  const { board } = ctx;
  const winningLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let line of winningLines) {
    const xWon = line.every((index) => {
      return board[index] === PlayerTypes.x;
    });

    if (xWon) {
      return true;
    }

    const oWon = line.every((index) => {
      return board[index] === PlayerTypes.o;
    });

    if (oWon) {
      return true;
    }
  }
  return false;
}

function checkDraw(ctx: TicTacToeContext) {
  return ctx.moves === 9;
}

const PlayType = 'PLAY';
type PlayValues = {
  value: number;
  player: PlayerTypes;
};

type PlayUpdateEvent = ImmerUpdateEvent<'PLAY', PlayValues>;

// ISSUE #1
const playUpdater = createUpdater<TicTacToeContext, PlayUpdateEvent>(
  'PLAY',
  // (ctx, {input}) => { // this is the version in the docs and the actual type of the event {type, input}
  (ctx, input) => {
    // but this actually works - this has the shape {type: "PLAY", player: "x", value: 2}
    console.log('ctx', ctx);
    console.log('input', input);

    // ctx.board[input.value] = ctx.player;  // if the first version from the docs is used ({input}), this does not work.. "input" is undefined
    // ctx.moves = ctx.moves + 1;
    // ctx.player = ctx.player === PlayerTypes.x ? PlayerTypes.o : PlayerTypes.x;
  }
);

type ResetEvent = { type: 'RESET' };

type TicTacToeEvent = PlayUpdateEvent | ResetEvent;

export const ticTacToeMachine = createMachine<
  TicTacToeContext,
  TicTacToeEvent,
  TicTacToeState
>(
  {
    context: initialContext,
    initial: 'playing',
    states: {
      playing: {
        on: {
          '': [
            { target: 'winner', cond: 'checkWin' },
            { target: 'draw', cond: 'checkDraw' },
          ],
          [playUpdater.type]: [
            {
              target: 'playing',
              cond: isValidMove,
              actions: playUpdater.action,
            },
          ],
        },
      },
      winner: {
        onEntry: 'setWinner',
      },
      draw: {},
    },
    on: {
      RESET: {
        target: 'playing',
        actions: 'resetGame',
      },
    },
  },
  {
    actions: {
      setWinner: assign<TicTacToeContext>((context) => {
        context.winner =
          context.player === PlayerTypes.x ? PlayerTypes.o : PlayerTypes.x;
      }),
    },
    guards: {
      checkWin,
      checkDraw,
    },
  }
);
