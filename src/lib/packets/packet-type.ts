export enum PacketType {
  // server packets
  failure,
  lobbyInfo,
  loadGame,
  update,
  tick,
  startGame,
  death,
  endGame,
  // client packets
  login,
  loadGameAck,
  lobbyUpdate,
  playerUpdate,
}
