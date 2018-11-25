import { Session } from '../session';
import { Server as TcpListener } from 'net';
import println from '../log/log';
import { createUuid } from '../util/uuid';
import chalk from 'chalk';
import { Client } from '../models/client';

export class Server {
  sessions: Map<string, Session>;

  listener: TcpListener;

  private session: Session;

  constructor() {
    this.sessions = new Map();
    this.createSession();
    this.listener = new TcpListener();
    this.listener.on('connection', (socket) => {
      // add a basic error handler to the socket
      socket.once('error', (err) => {
        println('Socket error', err.message);
      });
      // if the current session is not accepting connections,
      // we need to create a new one.
      if (!this.session.canAccept) {
        this.createSession();
      }
      // create a new client and pass it to the current session
      const client = new Client(socket);
      this.session.accept(client);
    });
  }

  listen(port: number): void {
    this.listener.listen(port).once('listening', () => {
      println('Server', `now listening on ${port}`);
    });
  }

  private createSession(): void {
    const uuid = createUuid();
    println('Server', `Created session ${uuid}`);
    // new sessions start in the lobby state.
    const session = new Session();
    // keep track of the new session, and also update
    // the 'current session' property.
    this.sessions.set(uuid, session);
    this.session = session;
    session.once('close', () => {
      println('Server', chalk.red(`Deleting session ${uuid}`));
      this.sessions.delete(uuid);
    });
  }
}
