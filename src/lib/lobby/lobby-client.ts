import { PacketIO } from '../packets/packetio';
import { LobbyInfo } from '../packets/data/lobby-info';

/**
 * A client connected to the lobby.
 */
export interface LobbyClient {
  /**
   * The packet interface for this client.
   */
  io: PacketIO;
  /**
   * Information about this client.
   */
  info: LobbyInfo;
}
