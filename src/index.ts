import * as GameServer from './lib/server';
import println from './lib/log/log';

const port = +process.env.PORT || 2050;

const server = GameServer.createServer({
  port,
  version: 12345,
});

server.listen(port).on('listening', () => {
  println('Server', `is now listening on port ${port}`);
});
