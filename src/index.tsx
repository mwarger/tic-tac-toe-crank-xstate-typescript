/** @jsx createElement */
import { createElement, Context, Children } from '@bikeshaving/crank';
import { renderer } from '@bikeshaving/crank/dom';
import {
  ticTacToeMachine,
  TicTacToeEvent,
  TicTacToeContext,
  TicTacToeState,
} from './machine';
import { State } from 'xstate';

import styles from './style.css';

function range(start: number, end: number) {
  return Array(end - start)
    .fill(null)
    .map((_, i) => i + start);
}

function Tile(
  this: Context,
  { onClick, ...props }: { onClick: () => void; className: string }
) {
  this.addEventListener('click', (_) => {
    onClick();
  });
  return <div {...props} />;
}

function Button(
  this: Context,
  { onClick, children }: { onClick: () => void; children: Children }
) {
  this.addEventListener('click', (_) => {
    onClick();
  });
  return <button>{children}</button>;
}

function getTitle(
  currentState: State<TicTacToeContext, TicTacToeEvent, any, TicTacToeState>,
  send: EventReturn<TicTacToeEvent>
) {
  if (currentState.matches('playing')) {
    return (
      <h2>Player {currentState.context.player.toString().toUpperCase()}</h2>
    );
  }

  if (currentState.matches('winner')) {
    return (
      <h2>
        Player {currentState.context.winner?.toString().toUpperCase()} wins!{' '}
        <Button onClick={() => send({ type: 'RESET' })}>Reset</Button>
      </h2>
    );
  }

  return (
    <h2>
      Draw <Button onClick={() => send({ type: 'RESET' })}>Reset</Button>
    </h2>
  );
}

type EventReturn<EventType> = (value?: EventType) => void;

function useNextEvent() {
  let send: EventReturn<TicTacToeEvent> = () => {};
  const hasNextEvent = new Promise<TicTacToeEvent>((resolve) => {
    send = resolve;
  });
  return { send, hasNextEvent };
}

async function* TicTacToe() {
  const machine = ticTacToeMachine;
  let nextEvent = null;
  let state = machine.initialState;

  console.log('state', state);
  do {
    const { send, hasNextEvent } = useNextEvent();

    yield (
      <section className={styles.game}>
        <h2>{getTitle(state, send)}</h2>
        <div className={styles.grid}>
          {range(0, 9).map((i) => (
            <Tile
              onClick={() => {
                send({
                  type: 'PLAY',
                  player: state.context.player,
                  value: i,
                });
              }}
              className={styles.tile}
              data-player={state.context.board[i]?.toString()}
            />
          ))}
        </div>
      </section>
    );

    nextEvent = await hasNextEvent;
  } while ((state = machine.transition(state, nextEvent)));
}

renderer.render(<TicTacToe />, document.body);
