import { Schema, model, Document } from 'mongoose';

interface ISkullBoard {
  enabled: boolean;
  count: number;
  channelId: string;
}

interface ISnipeConfig {
  enabled: boolean;
  allowed_roles: string[];
}

interface IGiveawayConfig {
  manager_roles: string[];
  blacklisted_roles: string[];
  bypass_roles: string[];
}

interface ILockdownSet {
  channels: string[];
  lockDowned: boolean;
  issuedBy: string;
  message: string;
}

interface IHeistMode {
  enabled: boolean;
  joined: number;
  left: number;
  startedOn: number;
}

interface ICensors {
  censors: {
    word: string;
    action: 'delete' | 'timeout' | 'warn';
  }[];
  timeout_duration: number;
}

interface IPings {
  mini: number;
  gaw: number;
  event: number;
}

interface ISettings extends Document {
  guildID: string;
  donationRoles: string[];
  logChannel: string;
  gtnRole: string[];
  skullBoard: ISkullBoard;
  disabledDrop: string[];
  snipe_config: ISnipeConfig;
  giveaway_config: IGiveawayConfig;
  lockdownSet: ILockdownSet;
  heistMode: IHeistMode;
  afkIgnore: string[];
  censors: ICensors;
  pings: IPings;
}

const SettingsSchema = new Schema<ISettings>({
  guildID: { type: String, required: true, unique: true },
  donationRoles: { type: [String], default: [] },
  logChannel: { type: String },
  gtnRole: { type: [String], default: [] },
  skullBoard: {
    enabled: { type: Boolean, default: false },
    count: { type: Number, default: 5 },
    channelId: { type: String }
  },
  disabledDrop: { type: [String], default: [] },
  snipe_config: {
    enabled: { type: Boolean, default: true },
    allowed_roles: { type: [String], default: [] }
  },
  giveaway_config: {
    manager_roles: { type: [String], default: [] },
    blacklisted_roles: { type: [String], default: [] },
    bypass_roles: { type: [String], default: [] }
  },
  lockdownSet: {
    channels: { type: [String], default: [] },
    lockDowned: { type: Boolean, default: false },
    issuedBy: { type: String },
    message: { type: String }
  },
  heistMode: {
    enabled: { type: Boolean, default: false },
    joined: { type: Number, default: 0 },
    left: { type: Number, default: 0 },
    startedOn: { type: Number }
  },
  afkIgnore: { type: [String], default: [] },
  censors: {
    censors: [
      {
        word: { type: String, required: true },
        action: {
          type: String,
          enum: ['delete', 'timeout', 'warn'],
          required: true
        }
      }
    ],
    timeout_duration: { type: Number, default: 60_000 } // 1 minute in ms
  },
  pings: {
    mini: { type: Number, default: 0 },
    gaw: { type: Number, default: 0 },
    event: { type: Number, default: 0 }
  }
});

export default model<ISettings>('Settings', SettingsSchema);
