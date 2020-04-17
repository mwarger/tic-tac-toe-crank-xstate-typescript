import { actions, createMachine } from 'xstate';
const { assign } = actions;

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
export type TicTacToeEvent =
  | { type: 'PLAY'; value: number; player: PlayerTypes }
  | { type: 'RESET' };

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

const isValidMove = (ctx: TicTacToeContext, e: TicTacToeEvent) => {
  return e.type === 'PLAY' ? ctx.board[e.value] === null : false;
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
          PLAY: [
            {
              target: 'playing',
              cond: 'isValidMove',
              actions: 'updateBoard',
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
      updateBoard: assign({
        board: (ctx, e) => {
          if (e.type === 'PLAY') {
            const updatedBoard = [...ctx.board];
            updatedBoard[e.value] = ctx.player;
            return updatedBoard;
          }
          return [...ctx.board];
        },
        moves: (ctx) => ctx.moves + 1,
        player: (ctx) =>
          ctx.player === PlayerTypes.x ? PlayerTypes.o : PlayerTypes.x,
      }),
      resetGame: () => assign(initialContext),
      setWinner: assign({
        winner: (ctx) =>
          ctx.player === PlayerTypes.x ? PlayerTypes.o : PlayerTypes.x,
      }),
    },
    guards: {
      checkWin,
      checkDraw,
      isValidMove,
    },
  }
);
