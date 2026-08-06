import mongoose, { Schema, Document } from 'mongoose';

export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface IWhatsAppLogDoc extends Document {
  restaurantId?: mongoose.Types.ObjectId;
  to: string;
  type: 'template' | 'text' | 'webhook_status' | 'incoming';
  templateName?: string;
  status: WhatsAppMessageStatus;
  metaMessageId?: string;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const whatsappLogSchema = new Schema<IWhatsAppLogDoc>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    to: { type: String, required: true, index: true },
    type: { type: String, enum: ['template', 'text', 'webhook_status', 'incoming'], required: true },
    templateName: String,
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'queued',
      index: true,
    },
    metaMessageId: { type: String, index: true },
    payload: { type: Schema.Types.Mixed },
    response: { type: Schema.Types.Mixed },
    error: String,
  },
  { timestamps: true }
);

export const WhatsAppLog = mongoose.model<IWhatsAppLogDoc>('WhatsAppLog', whatsappLogSchema);
