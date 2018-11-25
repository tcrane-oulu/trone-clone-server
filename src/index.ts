import { Server } from './lib/server/server';

const port = +process.env.PORT || 2050;

// const server = GameServer.createServer({
//   port,
//   version: 12345,
// });
const server = new Server();
server.listen(port);
