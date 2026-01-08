import mongoose, { Schema, Model, Types } from "mongoose";

export type ChatRole = "user" | "assistant";

export interface MessageDoc {
  conversationId: Types.ObjectId;
  uid: string;
  role: ChatRole;
  content: string;
  createdAt?: Date;
}

const MessageSchema = new Schema<MessageDoc>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    uid: {
      type: String,
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message: Model<MessageDoc> =
  mongoose.models.Message ||
  mongoose.model<MessageDoc>("Message", MessageSchema);

export default Message;
