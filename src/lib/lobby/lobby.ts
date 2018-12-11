import { GameState } from '../models/game-state';
import println from '../log/log';
import { LoginPacket } from '../packets/incoming/login';
import { LobbyClient } from './lobby-client';
import { LobbyInfo } from '../packets/data/lobby-info';
import { Session } from '../session';
import { Client } from '../models/client';
import { LobbyInfoPacket } from '../packets/outgoing/lobby-info';
import { Emitter, EventListener } from '../util/emitter';
import { LobbyUpdate } from '../packets/incoming/lobby-update';
import { LoadingState } from '../game/loading-state';
import chalk from 'chalk';
import { VERSION, FAKE_CLIENTS } from '../globals';
import { FailurePacket, FailureCode } from '../packets/outgoing/failure';

export class LobbyState extends Emitter implements GameState {

  accept = true;

  private players: Map<number, LobbyClient>;
  private listeners: EventListener[];

  constructor(session: Session) {
    super();
    this.players = new Map();
    // add some fake clients.
    for (let i = 0; i < FAKE_CLIENTS; i++) {
      const fakeClient = new Client(undefined);
      this.players.set(fakeClient.id, {
        client: fakeClient,
        info: new LobbyInfo(`Fake Client ${i + 1}`, true),
      });
    }
    const enter = session.on('enter', (client: Client) => {
      // wait 10 seconds max for a response.
      const timer = setTimeout(() => {
        println('Lobby', 'Removed io that did not send a login.');
        client.io.destroy(new Error('No initial packet.'));
      }, 10_000);

      // listen for the initial packet.
      client.io.once('packet', (packet) => {
        clearTimeout(timer);
        // if they didn't send a login packet, disconnect them.
        if (!(packet instanceof LoginPacket)) {
          client.io.destroy(new Error('Wrong initial packet.'));
          return;
        }

        // if they used the wrong version, disconnect them.
        if (packet.version !== VERSION) {
          client.io.send(new FailurePacket(FailureCode.IncorrectVersion, 'Wrong game version.'));
          client.io.destroy(new Error(`Client using incorrect version (${packet.version})`));
          return;
        }
        // everything is fine, add them to the lobby.
        this.players.set(client.id, {
          client,
          info: new LobbyInfo(packet.name, false),
        });
        println('Lobby', `Player "${packet.name}" connected.`);
        this.sendLobbyInfo();
        // attach a listener for the lobby update packet.
        const updateListener = client.io.on('packet', (update) => {
          if (!(update instanceof LobbyUpdate)) {
            return;
          }
          this.players.get(client.id).info.ready = update.ready;
          this.sendLobbyInfo();
          // if we can start the game, move into the next state.
          if (this.canStart()) {
            println('Lobby', 'Entering load game state.');
            const loadingState = new LoadingState(new Map(this.players));
            this.emit('next', loadingState);
          }
        });
        this.listeners.push(updateListener);
      });
    });

    // if the player leaves, remove them from the lobby.
    const leave = session.on('leave', (client: Client) => {
      if (this.players.has(client.id)) {
        this.players.delete(client.id);
        this.sendLobbyInfo();
      }
    });
    this.listeners = [enter, leave];
  }

  destroy(): void {
    // dont leave any hanging event listeners.
    for (const listener of this.listeners) {
      listener.remove();
    }
    println('Lobby', chalk.red('Destroyed lobby'));
  }

  private canStart(): boolean {
    if (this.players.size < 2) {
      // not enough players.
      return false;
    }
    if ([...this.players.values()].some((lc) => !lc.info.ready)) {
      // some players aren't ready.
      return false;
    }
    return true;
  }

  private sendLobbyInfo() {
    // broadcast the update.
    const update = new LobbyInfoPacket([...this.players.values()].map((player) => player.info));
    for (const lc of this.players.values()) {
      lc.client.io.send(update);
    }
  }
}
