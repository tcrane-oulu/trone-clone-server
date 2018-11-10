import { ServerOptions } from './server-options';
import { Server } from 'net';
import { PacketIO } from '../packets/packetio';
import { IncomingPacket } from '../packets/packet';
import { Lobby } from '../lobby/lobby';
import { LoginPacket } from '../packets/incoming/login';
import { FailurePacket, FailureCode } from '../packets/outgoing/failure';
import { PlayerInfo } from '../packets/data/player-info';
import chalk from 'chalk';
import println from '../log/log';

export function createServer(serverOptions: ServerOptions): Server {
  // tslint:disable-next-line:no-console
  const clients = new Map<string, PacketIO>();
  const lobby = new Lobby();

  return new Server()
    .on('connection', (socket) => {
      println(chalk.gray(socket.remoteAddress), 'connected.');

      // set up required connection listeners.
      socket.on('error', (error) => {
        println(chalk.gray(socket.remoteAddress), chalk.red(`${error.name}: ${error.message}`));
      });
      socket.on('close', () => {
        println(chalk.gray(socket.remoteAddress), 'disconnected.');
        clients.delete(socket.remoteAddress);
      });

      // set up packet interface.
      const io = new PacketIO(socket, socket.remoteAddress);
      // io.send(new FailurePacket(0, 'test'));
      io.on('error', (error: Error) => {
        println(chalk.gray(socket.remoteAddress), `PacketIO error: ${error.message}`);
        io.socket.destroy(error);
        clients.delete(io.socket.remoteAddress);
      });
      clients.set(socket.remoteAddress, io);

      // wait for the login packet, or disconnect the socket
      // if it is not received in a reasonable amount of time.
      const timer = setTimeout(() => {
        clients.delete(socket.remoteAddress);
        socket.destroy(new Error(`${socket.remoteAddress} timed out waiting for initial packet.`));
      }, 10000); // make this a constant somewhere.
      io.once('packet', (packet: IncomingPacket) => {
        clearTimeout(timer);
        if (packet instanceof LoginPacket) {
          if (packet.version !== serverOptions.version) {
            const failure = new FailurePacket(FailureCode.IncorrectVersion, `Please update to version ${serverOptions.version}`);
            io.send(failure, 'Incorrect version number received.');
            clients.delete(socket.remoteAddress);
            socket.destroy(new Error(`${socket.remoteAddress} connected with incorrect version.`));
          } else {
            lobby.addClient({
              io,
              info: new PlayerInfo(packet.name),
            });
          }
        } else {
          io.emit('error', new Error(`${socket.remoteAddress} sent the wrong initial packet.`));
        }
      });
    }).on('close', () => {
      println('Server', 'closed.');
    }).on('error', (error) => {
      println('Server', `error: ${error.name}`);
      println(chalk.red(error.name), chalk.red(error.message));
    });
}
