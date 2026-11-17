# Facial Emotion Data Collection Tool 📸🤖

A secure, high-performance web application designed to crowdsource and dynamically process facial emotion datasets. This tool was built to collect structured, high-quality data to fine-tune an EfficientNet-B0 PyTorch model for Facial Expression Recognition (FER).

## 🚀 Overview

Collecting consistent data for computer vision is difficult. This application streamlines the process by guiding users to mimic 7 standard emotions (Surprise, Fear, Disgust, Happy, Sad, Angry, Neutral) using reference images. 

Instead of saving raw, messy webcam photos, the frontend utilizes **Google MediaPipe** to perform real-time face detection, calculate a dynamic bounding box (including the jawline and hair), and instantly crop the frame into a perfect 224x224 square. The backend then compresses and securely stores the batch directly into MongoDB.

## ✨ Key Features

* **AI-Powered Smart Cropping:** Uses MediaPipe Tasks Vision (WASM) directly in the browser to detect faces and automatically crop them to 224x224 pixels.
* **In-Memory Image Processing:** Uses `multer` and `sharp` to process uploads entirely in RAM, preventing disk I/O bottlenecks.
* **Binary Database Storage:** Images are stored natively as highly efficient BSON `Buffer` objects in MongoDB, maximizing the free-tier storage limits (accommodating ~30,000 images).
* **Batch Transactions:** Forces the collection of all 7 target emotions before uploading to prevent incomplete datasets.
* **Secure Admin Gallery:** Features an authenticated dashboard to review the collected dataset grid.
* **Strict Privacy & Security:** Built with `helmet`, `express-rate-limit`, `express-mongo-sanitize`, explicit legal consent validation, and `noindex` headers to protect biometric data.

## 🛠️ Tech Stack

* **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript, MediaPipe (Face Detection)
* **Backend:** Node.js, Express.js
* **Image Processing:** Sharp (Node.js), HTML5 Canvas API (Browser)
* **Database:** MongoDB Atlas (Mongoose)
* **Security:** Helmet
