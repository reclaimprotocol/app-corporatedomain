import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/otp_auth_db';

// User interface
interface IUser {
  email: string;
  domain_name: string;
  employer: string | null;
  proof: object | null;
  created_at: Date;
  updated_at: Date;
}

// User schema
const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    domain_name: { type: String, required: true, index: true },
    employer: { type: String, default: null, index: true },
    proof: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const User = mongoose.model<IUser>('User', userSchema);

async function listAllUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri);
    console.log('Connected to database');

    // Fetch all users
    const users = await User.find({}).sort({ created_at: 1 });

    console.log(`\nTotal users: ${users.length}\n`);
    console.log('Email\t\t\t\tCompany Name');
    console.log('='.repeat(80));

    // Output each user
    users.forEach(user => {
      const email = user.email.padEnd(40);
      const company = user.employer || '(not set)';
      console.log(`${email}\t${company}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

listAllUsers();
