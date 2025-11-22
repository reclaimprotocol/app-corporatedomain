import mongoose, { Schema, Model } from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/otp_auth_db';

// User interface
export interface IUser {
  email: string;
  domain_name: string;
  employer: string | null;
  proof: object | null;
  created_at: Date;
  updated_at: Date;
}

// User schema
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    domain_name: { type: String, required: true, index: true },
    employer: { type: String, default: null, index: true },
    proof: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// User model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

// Country Request interface
export interface ICountryRequest {
  email: string;
  country: string;
  created_at: Date;
}

// Country Request schema
const countryRequestSchema = new Schema<ICountryRequest>(
  {
    email: { type: String, required: true, index: true },
    country: { type: String, required: true, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Country Request model
const CountryRequest: Model<ICountryRequest> = mongoose.models.CountryRequest || mongoose.model<ICountryRequest>('CountryRequest', countryRequestSchema);

// Connect to database
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(uri);
}

export const userDb = {
  // Create or update user
  upsertUser: async (email: string): Promise<IUser> => {
    await connectToDatabase();
    const domainName = email.split('@')[1];

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: { updated_at: new Date() },
        $setOnInsert: {
          email,
          domain_name: domainName,
          employer: null,
          proof: null,
          created_at: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return user.toObject();
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<IUser | null> => {
    await connectToDatabase();
    const user = await User.findOne({ email });
    return user ? user.toObject() : null;
  },

  // Update user employer and proof
  updateUserData: async (email: string, employer: string, proof: object): Promise<IUser | null> => {
    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          employer,
          proof,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    return user ? user.toObject() : null;
  },

  // Get employer statistics by domain
  getEmployerStatsByDomain: async (domainName: string): Promise<{ employer: string; count: number }[]> => {
    await connectToDatabase();
    const stats = await User.aggregate([
      {
        $match: {
          domain_name: domainName,
          employer: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$employer',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1, _id: 1 },
      },
      {
        $project: {
          _id: 0,
          employer: '$_id',
          count: 1,
        },
      },
    ]);

    return stats;
  },

  // Get all users by domain
  getUsersByDomain: async (domainName: string): Promise<IUser[]> => {
    await connectToDatabase();
    const users = await User.find({ domain_name: domainName });
    return users.map(user => user.toObject());
  },

  // Delete user by email
  deleteUser: async (email: string): Promise<boolean> => {
    await connectToDatabase();
    const result = await User.deleteOne({ email });
    return result.deletedCount > 0;
  },

  // Get all unique domains
  getAllDomains: async (): Promise<string[]> => {
    await connectToDatabase();
    const domains = await User.distinct('domain_name');
    return domains;
  },
};

export const countryRequestDb = {
  // Create a country request
  createRequest: async (email: string, country: string): Promise<ICountryRequest> => {
    await connectToDatabase();
    const request = await CountryRequest.create({
      email,
      country,
      created_at: new Date(),
    });
    return request.toObject();
  },

  // Get all requests for a country
  getRequestsByCountry: async (country: string): Promise<ICountryRequest[]> => {
    await connectToDatabase();
    const requests = await CountryRequest.find({ country });
    return requests.map(req => req.toObject());
  },

  // Get all requests by email
  getRequestsByEmail: async (email: string): Promise<ICountryRequest[]> => {
    await connectToDatabase();
    const requests = await CountryRequest.find({ email });
    return requests.map(req => req.toObject());
  },
};

export default connectToDatabase;
