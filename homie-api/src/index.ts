import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './socket';
import { startScheduler } from './jobs/scheduler';

const server = http.createServer(app);

initSocket(server);
startScheduler();

server.listen(env.PORT, () => {
  console.log(`Homie API running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
