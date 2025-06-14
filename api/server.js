require('dotenv').config(); // Ensure .env is loaded

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // For form submissions
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'views')));

app.set('view engine', 'ejs');
app.set('views', './views');

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://doctor123:doctor123@cluster0.nnxbqud.mongodb.net/review';
const connectDB = async () => {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit on connection failure
    }
};

connectDB();

// Review Schema
const reviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }, // Adjusted to 1-5
    review: { type: String, required: true },
    imageUrl: { type: String, default: '' }
});

const Review = mongoose.model('Review', reviewSchema);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Serve the homepage
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Submit a new review
app.post('/reviews', async (req, res) => {
    const { name, rating, review, imageUrl } = req.body;
    if (!name || !rating || !review) {
        return res.status(400).json({ success: false, message: 'Name, rating, and review are required.' });
    }
    try {
        const newReview = new Review({ name, rating, review, imageUrl });
        await newReview.save();
        return res.status(201).json({ success: true, message: 'Review submitted successfully!' });
    } catch (error) {
        console.error('Error saving review:', error);
        return res.status(500).json({ success: false, message: 'Error saving review' });
    }
});

// Get all reviews
app.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find();
        return res.status(200).json(reviews);
    } catch (error) {
        console.error('Error retrieving reviews:', error);
        return res.status(500).json({ success: false, message: 'Error retrieving reviews' });
    }
});

// Handle 404 errors for unmatched routes
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
