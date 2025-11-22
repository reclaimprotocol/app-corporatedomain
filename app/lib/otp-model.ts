import mongoose, { Schema, Model } from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/otp_auth_db';

// OTP interface
export interface IOTP {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

// OTP schema
const otpSchema = new Schema<IOTP>(
  {
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index to auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// OTP model
const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model<IOTP>('OTP', otpSchema);

// Connect to database
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(uri);
}

export const otpDb = {
  // Store OTP
  storeOTP: async (email: string, code: string, expiresAt: Date): Promise<IOTP> => {
    await connectToDatabase();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    const otp = await OTP.create({
      email,
      code,
      expiresAt,
    });

    return otp.toObject();
  },

  // Get OTP by email
  getOTP: async (email: string): Promise<IOTP | null> => {
    await connectToDatabase();
    const otp = await OTP.findOne({ email });
    return otp ? otp.toObject() : null;
  },

  // Delete OTP
  deleteOTP: async (email: string): Promise<void> => {
    await connectToDatabase();
    await OTP.deleteMany({ email });
  },

  // Clean up expired OTPs (manual cleanup, though TTL index handles this automatically)
  cleanupExpired: async (): Promise<void> => {
    await connectToDatabase();
    await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
  },
};

export default connectToDatabase;
