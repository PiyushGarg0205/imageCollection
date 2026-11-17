const mongoose = require('mongoose');

const FaceSchema = new mongoose.Schema({
    proxy_name: { 
        type: String, 
        required: true 
    },
    emotion: { 
        type: String, 
        enum: ['Surprise', 'Fear', 'Disgust', 'Happy', 'Sad', 'Angry', 'Neutral'],
        required: true 
    },
    image_data: { 
        type: Buffer, 
        required: true 
    },
    content_type: { 
        type: String, 
        default: 'image/jpeg' 
    },
    uploaded_at: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Face', FaceSchema);