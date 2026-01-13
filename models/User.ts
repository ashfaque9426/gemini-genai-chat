import mongoose, { Schema, Model } from "mongoose";

interface UserDocType {
    uid: string;
    userName: string;
    userEmail: string;
    photoURL: string | null;
    sessionType: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema: Schema<UserDocType> = new Schema<UserDocType>(
    {
        uid: { type: String, required: true },
        userName: { type: String, required: true },
        userEmail: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function (value: string): boolean {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                },
                message: 'Invalid email address'
            },
        },
        photoURL: { type: String, default: null },
        sessionType: { type: String, enum: ['googleSignIn'], required: true }
    },
    { timestamps: true }
);

UserSchema.index({ uid: 1, userEmail: 1 });

const User: Model<UserDocType> = mongoose.models.Users || mongoose.model<UserDocType>("Users", UserSchema);

export default User;