import { PacketIO } from '../packets/packetio';
import { PlayerInfo } from '../packets/data/player-info';

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
  info: PlayerInfo;
}
