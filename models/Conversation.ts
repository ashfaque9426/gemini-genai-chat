import mongoose, { Schema, Model } from "mongoose";

interface ConversationDoc {
  uid: string;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ConversationSchema = new Schema<ConversationDoc>(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      set: (v: string) => v?.slice(0, 120)
    },
  },
  {
    timestamps: true,
  }
);

const Conversation: Model<ConversationDoc> = mongoose.models.Conversation || mongoose.model<ConversationDoc>("Conversation", ConversationSchema);

export default Conversation;
