import { Schema, model, Document } from 'mongoose';

interface IGrinderDynamic {
  grinder: boolean;
  expires?: number;
}

interface IGrinderDonation extends Document {
  userID: string;
  guildID: string;
  amount: number;
  time: number;
  dynamic: IGrinderDynamic;
}

const GrinderDonationSchema = new Schema<IGrinderDonation>({
  userID: { type: String, required: true },
  guildID: { type: String, required: true },
  amount: { type: Number, default: 0 },
  time: { type: Number, default: Date.now },
  dynamic: {
    grinder: { type: Boolean, default: false },
    expires: { type: Number }
  }
});

export default model<IGrinderDonation>(
  'GrinderDonation',
  GrinderDonationSchema
);
