import mongoose from 'mongoose';

    const taskschema = new mongoose.Schema({
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true  
        },
        title:{
            type: String,
            required: true,
            trim: true,
            maxlength: 100

        },
        description:{
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        status:{
            type: String,
            enum: ['pending', 'in progress', 'completed'],
            default: 'pending'
        },
        attachment:{
            type: [String],
            default: []
        }
    }, { timestamps: true });

export default mongoose.model('task',taskschema);
    