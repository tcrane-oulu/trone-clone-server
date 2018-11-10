export enum PacketType {
  // server packets
  failure,
  lobbyInfo,
  loadGame,
  update,
  tick,
  startGame,
  // client packets
  login,
  loadGameAck,
  lobbyUpdate,
}
