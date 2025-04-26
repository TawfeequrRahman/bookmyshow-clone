const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 5005;

// Middleware
app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb+srv://tawfeequrrahman:tawfeequrrahman@cluster0.c3bbf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('MongoDB Atlas connection error:', err);
  });

// Movie schema and model
const movieSchema = new mongoose.Schema({
  title: String,
  poster: String,
  language: String,
  genre: [String],
  duration: String,
  releaseDate: Date,
  description: String,
  showtimes: [{
    theater: String,
    time: String,
    price: Number,
    seatsAvailable: Number
  }]
});

const Movie = mongoose.model('Movie', movieSchema);

// Seed data if collection is empty
const seedMovies = async () => {
  try {
    const count = await Movie.countDocuments();
    if (count === 0) {
      const movies = require('./data.json');
      await Movie.insertMany(movies);
      console.log('Seeded movies data');
    }
  } catch (err) {
    console.error('Error seeding movies data:', err);
  }
};
mongoose.connection.once('open', () => {
  seedMovies();
});

const path = require('path');

// Routes
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

app.post('/api/book', async (req, res) => {
  try {
    const { movieId, showtimeId, seats } = req.body;
    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const showtime = movie.showtimes.id(showtimeId);
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });

    if (showtime.seatsAvailable < seats) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    showtime.seatsAvailable -= seats;
    await movie.save();

    res.json({ message: 'Booking successful' });
  } catch (err) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
