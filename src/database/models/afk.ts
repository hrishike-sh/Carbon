import { Schema, model, Document } from 'mongoose';

interface IDM {
  userId: string;
  message: string;
  timestamp: number;
}

interface IAFK extends Document {
  userId: string;
  reason: string;
  time: number;
  dms: IDM[];
}

const AFKSchema = new Schema<IAFK>({
  userId: { type: String, required: true, index: true },
  reason: { type: String, default: 'No reason provided' },
  time: { type: Number, default: Date.now },
  dms: [
    {
      userId: { type: String, required: true },
      message: { type: String, required: true },
      timestamp: { type: Number, default: Date.now }
    }
  ]
});

export default model<IAFK>('AFK', AFKSchema);
