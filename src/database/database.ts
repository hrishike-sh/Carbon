import mongoose from 'mongoose';
import MainDonation from './models/MainDonation.ts';
import GrinderDonation from './models/GrinderDonation.ts';

interface DonationOptions {
  main?: boolean;
  grinder?: boolean;
  karuta?: boolean;
}

interface DonationResult {
  type: 'main' | 'grinder' | 'karuta';
  amount: number;
}

class Database {
  private uri: string;

  constructor(uri: string) {
    this.uri = uri;
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.uri);
      console.log('[DATABASE] Connected to MongoDB');
    } catch (error) {
      console.error('[DATABASE] Connection error:', error);
      throw new Error('Database connection failed');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('[DATABASE] Disconnected from MongoDB');
    } catch (error) {
      console.error('[DATABASE] Disconnection error:', error);
      throw new Error('Database disconnection failed');
    }
  }

  async getDonations(
    userId: string,
    options: DonationOptions
  ): Promise<DonationResult[]> {
    if (!options || Object.keys(options).length === 0) {
      throw new Error('Please provide at least one donation option');
    }

    const results: DonationResult[] = [];

    if (options.main) {
      let data =
        (await MainDonation.findOne({ userID: userId })) ||
        new MainDonation({ userID: userId, messages: 0 });
      results.push({ type: 'main', amount: data.messages });
    }

    if (options.grinder) {
      let data =
        (await GrinderDonation.findOne({ userID: userId })) ||
        new GrinderDonation({ userID: userId, amount: 0 });
      results.push({ type: 'grinder', amount: data.amount });
    }
      
    return results;
  }
}

export default Database;
