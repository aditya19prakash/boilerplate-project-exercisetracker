require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Enable CORS
app.use(cors());

// Middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// In-memory "databases" for users and exercises
let users = {};
let exercises = [];
let nextUserId = 1;
let nextExerciseId = 1;

// Serve index.html
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST /api/users to create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;

  // Check if the username already exists
  for (let userId in users) {
    if (users[userId].username === username) {
      return res.status(400).json({ error: 'Username already exists' });
    }
  }

  // Add new user to the in-memory store
  const userId = nextUserId++;
  users[userId] = { username, _id: userId };
  
  res.json({ username, _id: userId });
});

// GET /api/users to get a list of all users
app.get('/api/users', (req, res) => {
  const userArray = Object.values(users);
  res.json(userArray);
});

// POST /api/users/:_id/exercises to add a new exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  // Check if the user exists
  if (!users[userId]) {
    return res.status(400).json({ error: 'User not found' });
  }

  // Parse the date or use current date
  const exerciseDate = date ? new Date(date) : new Date();

  // Create a new exercise log
  const exercise = {
    _id: nextExerciseId++,
    userId,
    description,
    duration,
    date: exerciseDate.toDateString(),
  };

  // Store the exercise log
  exercises.push(exercise);

  // Respond with the user and exercise details
  res.json({
    username: users[userId].username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: userId,
  });
});

// GET /api/users/:_id/logs to retrieve a full exercise log of a user
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  // Check if the user exists
  if (!users[userId]) {
    return res.status(400).json({ error: 'User not found' });
  }

  // Filter exercises based on userId
  let userExercises = exercises.filter((exercise) => exercise.userId == userId);

  // Filter by date range if provided
  if (from) userExercises = userExercises.filter((exercise) => new Date(exercise.date) >= new Date(from));
  if (to) userExercises = userExercises.filter((exercise) => new Date(exercise.date) <= new Date(to));

  // Limit the number of logs
  if (limit) userExercises = userExercises.slice(0, parseInt(limit));

  // Respond with user data and exercise logs
  res.json({
    username: users[userId].username,
    _id: userId,
    count: userExercises.length,
    log: userExercises,
  });
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
