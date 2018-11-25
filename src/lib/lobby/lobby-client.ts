import { LobbyInfo } from '../packets/data/lobby-info';
import { Client } from '../models/client';

/**
 * A client connected to the lobby.
 */
export interface LobbyClient {
  /**
   * The client.
   */
  client: Client;
  /**
   * Information about this client.
   */
  info: LobbyInfo;
}
