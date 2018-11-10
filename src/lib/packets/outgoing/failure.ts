import { OutgoingPacket } from '../packet';
import { PacketBuffer } from '../packet-buffer';
import { PacketType } from '../packet-type';

export class FailurePacket implements OutgoingPacket {
  id = PacketType.failure;

  /**
   * The code of the failure.
   */
  code: FailureCode;
  /**
   * A description of the failure.
   */
  description: string;

  constructor(code?: FailureCode, description?: string) {
    this.code = code;
    this.description = description;
  }

  write(buffer: PacketBuffer): void {
    buffer.writeUnsignedByte(this.code);
    buffer.writeString(this.description);
  }
}

export enum FailureCode {
  IncorrectVersion,
  GameInProgress,
  IncorrectClientId,
}
