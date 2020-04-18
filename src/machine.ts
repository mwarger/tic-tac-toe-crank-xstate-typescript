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

const PLAY = 'PLAY';

type PlayValues = {
  value: number;
  player: PlayerTypes;
};

type PlayUpdateEvent = ImmerUpdateEvent<typeof PLAY, PlayValues>;

const playUpdater = createUpdater<TicTacToeContext, PlayUpdateEvent>(
  PLAY,
  (ctx, { input }) => {
    ctx.board[input.value] = ctx.player;
    ctx.moves = ctx.moves + 1;
    ctx.player = ctx.player === PlayerTypes.x ? PlayerTypes.o : PlayerTypes.x;
  }
);

const isValidMove = (ctx: TicTacToeContext, e: PlayUpdateEvent) => {
  return ctx.board[e.input.value] === null;
};

type ResetEvent = { type: 'RESET' };

export type TicTacToeEvent = PlayUpdateEvent | ResetEvent;

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
