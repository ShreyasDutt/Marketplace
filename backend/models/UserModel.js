import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    verificationOTP: {
        type: String,
        default: ""
    },
    OTPExpiration: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    resetOTP: {
        type: String,
        default: ""
    },
    resetOTPExpiration: {
        type: Number,
        default: 0
    }
});

// Prevent model overwrite issue
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

export default UserModel;
