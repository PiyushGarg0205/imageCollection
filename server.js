require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const basicAuth = require('express-basic-auth');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const Face = require('./models/Face');

const app = express();

// ==========================================
// 1. SECURITY & PRIVACY MIDDLEWARE
// ==========================================

// Set secure HTTP headers (prevents clickjacking, XSS, etc.)
app.use(helmet());

// Prevent NoSQL Injection by sanitizing incoming data
app.use(mongoSanitize());

// Limit upload requests to prevent spam/DDoS (Max 5 uploads per IP every 15 minutes)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: { error: 'Too many upload requests from this IP, please try again later.' }
});

app.use(express.json());
app.use(express.static('public'));

// Setup Admin Authentication for the Gallery
const adminAuth = basicAuth({
    users: { 'admin': process.env.ADMIN_PASSWORD },
    challenge: true,
    realm: 'Secure Admin Gallery'
});

// ==========================================
// 2. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// ==========================================
// 3. UPLOAD CONFIGURATION
// ==========================================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB total limit
});

// ==========================================
// 4. PUBLIC API ROUTES
// ==========================================

app.post('/api/upload', uploadLimiter, upload.array('images', 7), async (req, res) => {
    try {
        const { proxy_name, emotions, consent_given } = req.body;
        
        // Strict Privacy Check: Ensure consent was actually passed to the backend
        if (consent_given !== 'true') {
            return res.status(403).json({ error: 'Legal consent is explicitly required to upload data.' });
        }

        if (!req.files || req.files.length !== 7) {
            return res.status(400).json({ error: 'Please provide all 7 emotion images.' });
        }

        if (!proxy_name) {
            return res.status(400).json({ error: 'Proxy name is required.' });
        }

        const savedFaces = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const emotion = emotions[i]; 

            const processedImageBuffer = await sharp(file.buffer)
                .resize(224, 224, { fit: 'cover', position: 'center' })
                .jpeg({ quality: 80 })
                .toBuffer();

            const newFace = new Face({
                proxy_name: proxy_name,
                emotion: emotion,
                image_data: processedImageBuffer,
                content_type: 'image/jpeg'
            });

            await newFace.save();
            savedFaces.push(newFace._id);
        }

        res.status(201).json({ 
            message: 'All 7 emotions saved securely.',
            count: savedFaces.length
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Server error processing images.' });
    }
});

// ==========================================
// 5. PROTECTED ADMIN ROUTES (GALLERY)
// ==========================================

// Serve the Gallery HTML securely
app.get('/gallery', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_gallery.html'));
});

// View a specific image securely (Now protected by Admin Auth)
app.get('/api/image/:id', adminAuth, async (req, res) => {
    try {
        const face = await Face.findById(req.params.id);
        if (!face) return res.status(404).json({ error: 'Not found' });

        // Privacy Header: Instruct search engines NEVER to index these images
        res.set({
            'Content-Type': face.content_type,
            'X-Robots-Tag': 'noindex, nofollow'
        });
        res.send(face.image_data);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving image' });
    }
});

// Fetch gallery metadata securely
app.get('/api/faces', adminAuth, async (req, res) => {
    try {
        const faces = await Face.find().select('-image_data').sort({ uploaded_at: -1 });
        res.json(faces);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching faces' });
    }
});

// ==========================================
// 6. START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running securely on port ${PORT}`));