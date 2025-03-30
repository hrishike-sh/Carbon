import { Schema, model, Document } from 'mongoose';

interface IMainDonation extends Document {
  userID: string;
  guildID: string;
  messages: number;
  lastUpdated: Date;
}

const MainDonationSchema = new Schema<IMainDonation>({
  userID: { type: String, required: true },
  guildID: { type: String, required: true },
  messages: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export default model<IMainDonation>('MainDonation', MainDonationSchema);
