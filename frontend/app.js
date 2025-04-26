const API_BASE = "http://localhost:5005/api";

const moviesContainer = document.getElementById("movies-container");
const movieDetailsSection = document.getElementById("movie-details");
const bookingSection = document.getElementById("booking-section");
const backButton = document.getElementById("back-button");
const bookingForm = document.getElementById("booking-form");
const bookingMessage = document.getElementById("booking-message");

let currentMovie = null;

async function fetchMovies() {
  try {
    const res = await fetch(`${API_BASE}/movies`);
    const movies = await res.json();
    displayMovies(movies);
  } catch (err) {
    moviesContainer.innerHTML = "<p>Failed to load movies.</p>";
  }
}

function displayMovies(movies) {
  moviesContainer.innerHTML = "";
  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}" />
      <div class="movie-title">${movie.title}</div>
    `;
    card.addEventListener("click", () => showMovieDetails(movie));
    moviesContainer.appendChild(card);
  });
}

function showMovieDetails(movie) {
  currentMovie = movie;
  document.getElementById("movie-poster").src = movie.poster;
  document.getElementById("movie-title").textContent = movie.title;
  document.getElementById("movie-description").textContent = movie.description;
  document.getElementById("movie-language").textContent = movie.language;
  document.getElementById("movie-genre").textContent = movie.genre.join(", ");
  document.getElementById("movie-duration").textContent = movie.duration;
  document.getElementById("movie-release").textContent = new Date(
    movie.releaseDate
  ).toLocaleDateString();

  const showtimesContainer = document.getElementById("showtimes-container");
  showtimesContainer.innerHTML = "";
  movie.showtimes.forEach((showtime) => {
    const showtimeCard = document.createElement("div");
    showtimeCard.className = "showtime-card";
    const showtimeDate = new Date(showtime.time);
    showtimeCard.textContent = `${showtime.theater} - ${showtimeDate.toLocaleString()} - ₹${showtime.price} - Seats: ${showtime.seatsAvailable}`;
    showtimesContainer.appendChild(showtimeCard);
  });

  populateShowtimeSelect(movie.showtimes);

  moviesContainer.style.display = "none";
  movieDetailsSection.classList.remove("hidden");
  bookingSection.classList.add("hidden");
  bookingMessage.textContent = "";
}

function populateShowtimeSelect(showtimes) {
  const showtimeSelect = document.getElementById("showtime-select");
  showtimeSelect.innerHTML = "";
  showtimes.forEach((showtime, index) => {
    const option = document.createElement("option");
    option.value = index;
    const showtimeDate = new Date(showtime.time);
    option.textContent = `${showtime.theater} - ${showtimeDate.toLocaleString()} - ₹${showtime.price} - Seats: ${showtime.seatsAvailable}`;
    showtimeSelect.appendChild(option);
  });
}

backButton.addEventListener("click", () => {
  movieDetailsSection.classList.add("hidden");
  bookingSection.classList.add("hidden");
  moviesContainer.style.display = "flex";
  bookingMessage.textContent = "";
});

document
  .getElementById("showtimes-container")
  .addEventListener("click", (e) => {
    if (e.target.classList.contains("showtime-card")) {
      bookingSection.classList.remove("hidden");
      bookingMessage.textContent = "";
    }
  });

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const showtimeIndex = document.getElementById("showtime-select").value;
  const seats = parseInt(document.getElementById("seats-input").value, 10);

  if (!currentMovie || showtimeIndex === "") {
    bookingMessage.textContent = "Please select a showtime.";
    return;
  }

  const showtime = currentMovie.showtimes[showtimeIndex];

  if (seats > showtime.seatsAvailable) {
    bookingMessage.textContent = "Not enough seats available.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movieId: currentMovie._id,
        showtimeId: showtime._id,
        seats: seats,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      bookingMessage.style.color = "green";
      bookingMessage.textContent = data.message;
      // Update seats available locally
      currentMovie.showtimes[showtimeIndex].seatsAvailable -= seats;
      showMovieDetails(currentMovie);
      bookingSection.classList.add("hidden");
    } else {
      bookingMessage.style.color = "red";
      bookingMessage.textContent = data.error || "Booking failed.";
    }
  } catch (err) {
    bookingMessage.style.color = "red";
    bookingMessage.textContent = "Booking failed due to network error.";
  }
});

fetchMovies();
