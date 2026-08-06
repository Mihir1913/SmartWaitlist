import mongoose, { Schema } from 'mongoose';
const whatsappLogSchema = new Schema({
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
}, { timestamps: true });
export const WhatsAppLog = mongoose.model('WhatsAppLog', whatsappLogSchema);
