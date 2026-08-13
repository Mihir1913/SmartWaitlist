import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress: string;
  location?: string;
  userEmail?: string;
  userRole?: string;
  userId?: mongoose.Types.ObjectId;
  restaurantId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    ipAddress: { type: String, required: true },
    location: { type: String },
    userEmail: { type: String },
    userRole: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for fast querying by SuperAdmin
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
