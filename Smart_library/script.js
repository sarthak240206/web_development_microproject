const API = "https://openlibrary.org/search.json?q=";
const COVER = "https://covers.openlibrary.org/b/id/";
const PLACEHOLDER = "https://placehold.co/300x420?text=No+Cover";

let currentUser = null;

function byId(id) {
  return document.getElementById(id);
}

function coverUrl(id) {
  return id ? `${COVER}${id}-M.jpg` : PLACEHOLDER;
}

function safeText(text, fallback = "N/A") {
  if (!text || text === "undefined" || text === "null") return fallback;
  return text;
}

function normalizeBook(book) {
  const title = book.title || "Untitled";
  const author = (book.author_name && book.author_name[0]) || book.author || "Unknown";
  const year = book.first_publish_year || book.year || "N/A";
  const key = book.key || `${title}-${author}`;
  const coverId = book.cover_i || book.coverId || "";
  const languages = Array.isArray(book.language) ? book.language.slice(0, 4) : (book.languages || []);
  const subjects = Array.isArray(book.subject) ? book.subject.slice(0, 6) : (book.subjects || []);
  const editionCount = book.edition_count || book.editionCount || "N/A";
  return { key, title, author, year, coverId, languages, subjects, editionCount };
}

async function loadSessionStatus() {
  try {
    const res = await fetch("session_status.php", { credentials: "same-origin" });
    if (!res.ok) return null;
    const data = await res.json();
    currentUser = data.logged_in ? data.user : null;
    return currentUser;
  } catch (error) {
    currentUser = null;
    return null;
  }
}

function getFavoritesLocal() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function setFavoritesLocal(data) {
  localStorage.setItem("favorites", JSON.stringify(data));
}

async function getFavorites() {
  if (!currentUser) return getFavoritesLocal();
  try {
    const res = await fetch("get_favorites.php", { credentials: "same-origin" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.favorites) ? data.favorites.map(normalizeBook) : [];
  } catch (error) {
    return [];
  }
}

function setSelectedBook(book) {
  sessionStorage.setItem("selectedBook", JSON.stringify(book));
}

function getSelectedBook() {
  const raw = sessionStorage.getItem("selectedBook");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function toast(message) {
  const t = byId("toast");
  if (!t) return;
  t.textContent = message;
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, 2200);
}

function chipHTML(items) {
  if (!items || !items.length) return `<span class="chip">Not available</span>`;
  return items.map((item) => `<span class="chip">${item}</span>`).join("");
}

function cardHTML(rawBook) {
  const book = normalizeBook(rawBook);
  return `
    <article class="card">
      <img src="${coverUrl(book.coverId)}" alt="${book.title}">
      <div class="card-body">
        <h3>${book.title}</h3>
        <div class="meta-wrap">
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>Year:</strong> ${book.year}</p>
          <p><strong>Language:</strong> ${book.languages.length ? book.languages.join(", ") : "N/A"}</p>
          <p><strong>Edition Count:</strong> ${book.editionCount}</p>
        </div>
        <div class="chips">${chipHTML(book.subjects.slice(0, 3))}</div>
        <div class="actions">
          <button class="btn btn-secondary" data-book="${encodeURIComponent(JSON.stringify(book))}" onclick="addFavoriteFromData(this)">Favorite</button>
          <a class="btn btn-primary" href="details.html?key=${encodeURIComponent(book.key)}" data-book="${encodeURIComponent(JSON.stringify(book))}" onclick="openDetails(this)">Details</a>
        </div>
      </div>
    </article>
  `;
}

function addFavoriteFromData(btn) {
  const encoded = btn.dataset.book;
  if (!encoded) return;
  try {
    addFavorite(JSON.parse(decodeURIComponent(encoded)));
  } catch (error) {
    toast("Could not add favorite");
  }
}

function openDetails(link) {
  const encoded = link.dataset.book;
  if (!encoded) return;
  try { setSelectedBook(JSON.parse(decodeURIComponent(encoded))); } catch (error) {}
}

async function searchBooks(query, targetId, messageId) {
  const box = byId(targetId);
  const msg = byId(messageId);
  if (!box) return;
  box.innerHTML = "";
  if (msg) msg.textContent = "Loading books...";
  try {
    const response = await fetch(API + encodeURIComponent(query));
    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();
    const docs = (data.docs || []).slice(0, 18);
    if (!docs.length) {
      if (msg) msg.textContent = "No books found.";
      return;
    }
    if (msg) msg.textContent = `Found ${docs.length} books`;
    box.innerHTML = docs.map(cardHTML).join("");
    if (byId("totalBooks")) byId("totalBooks").textContent = `${docs.length}`;
    if (byId("langCount")) {
      const languageSet = new Set();
      docs.forEach((book) => Array.isArray(book.language) && book.language.forEach((lang) => languageSet.add(lang)));
      byId("langCount").textContent = `${languageSet.size}`;
    }
  } catch (error) {
    if (msg) msg.textContent = "Error while fetching books. Please try again.";
  }
}

async function addFavorite(bookData) {
  const book = normalizeBook(bookData);
  if (!currentUser) {
    const list = getFavoritesLocal();
    if (list.some((item) => item.key === book.key)) return toast("Already in favorites");
    list.push(book);
    setFavoritesLocal(list);
    if (byId("favCount")) byId("favCount").textContent = `${list.length}`;
    return toast("Added to favorites (local)");
  }

  const res = await fetch("save_favorite.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(book)
  });
  const data = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !data.success) return toast(data.message || "Please login to save favorites");

  const latest = await getFavorites();
  if (byId("favCount")) byId("favCount").textContent = `${latest.length}`;
  toast("Added to favorites (database)");
}

async function removeFavorite(key) {
  if (!currentUser) {
    const list = getFavoritesLocal().filter((item) => item.key !== key);
    setFavoritesLocal(list);
    await renderFavorites();
    if (byId("favCount")) byId("favCount").textContent = `${list.length}`;
    return toast("Removed from favorites");
  }

  const res = await fetch("remove_favorite.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ key })
  });
  const data = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !data.success) return toast(data.message || "Could not remove favorite");
  await renderFavorites();
  const latest = await getFavorites();
  if (byId("favCount")) byId("favCount").textContent = `${latest.length}`;
  toast("Removed from favorites");
}

function favoriteCardHTML(book) {
  const safeKey = String(book.key).replace(/'/g, "\\'");
  return `
    <article class="card">
      <img src="${coverUrl(book.coverId)}" alt="${book.title}">
      <div class="card-body">
        <h3>${book.title}</h3>
        <div class="meta-wrap">
          <p><strong>Author:</strong> ${safeText(book.author)}</p>
          <p><strong>Language:</strong> ${book.languages && book.languages.length ? book.languages.join(", ") : "N/A"}</p>
          <p><strong>Edition Count:</strong> ${safeText(book.editionCount)}</p>
        </div>
        <div class="chips">${chipHTML((book.subjects || []).slice(0, 3))}</div>
        <div class="actions">
          <button class="btn btn-danger" onclick="removeFavorite('${safeKey}')">Remove</button>
          <a class="btn btn-primary" href="details.html?key=${encodeURIComponent(book.key)}" data-book="${encodeURIComponent(JSON.stringify(book))}" onclick="openDetails(this)">Details</a>
        </div>
      </div>
    </article>
  `;
}

async function renderFavorites() {
  const grid = byId("favGrid");
  const empty = byId("emptyFav");
  if (!grid) return;
  const list = await getFavorites();
  if (!list.length) {
    grid.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";
  grid.innerHTML = list.map(favoriteCardHTML).join("");
}

function setupAuth() {
  const login = byId("loginForm");
  const signup = byId("signupForm");

  if (login) {
    login.addEventListener("submit", (event) => {
      const email = byId("email").value.trim();
      const password = byId("password").value.trim();
      const err = byId("loginError");
      if (!email.includes("@") || password.length < 6) {
        event.preventDefault();
        err.textContent = "Enter valid email and password (min 6 characters).";
      }
    });
  }

  if (signup) {
    signup.addEventListener("submit", (event) => {
      const name = byId("name").value.trim();
      const email = byId("semail").value.trim();
      const password = byId("spassword").value.trim();
      const confirm = byId("confirm").value.trim();
      const err = byId("signupError");
      if (name.length < 3) { event.preventDefault(); return (err.textContent = "Name should be at least 3 letters."); }
      if (!email.includes("@")) { event.preventDefault(); return (err.textContent = "Enter valid email."); }
      if (password.length < 6) { event.preventDefault(); return (err.textContent = "Password should be at least 6 characters."); }
      if (password !== confirm) { event.preventDefault(); return (err.textContent = "Passwords do not match."); }
    });
  }

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const success = params.get("success");
  if (error && byId("loginError")) byId("loginError").textContent = error;
  if (error && byId("signupError")) byId("signupError").textContent = error;
  if (success && byId("loginError")) byId("loginError").style.color = "#1f7a43";
  if (success && byId("loginError")) byId("loginError").textContent = success;
}

function setupMenu() {
  const btn = byId("menuBtn");
  const links = byId("navLinks");
  if (!btn || !links) return;
  btn.addEventListener("click", () => links.classList.toggle("show"));
}

function setupTopButton() {
  const topBtn = byId("topBtn");
  if (!topBtn) return;
  window.addEventListener("scroll", () => { topBtn.style.display = window.scrollY > 260 ? "inline-block" : "none"; });
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function setupSearchPage() {
  const form = byId("searchForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = byId("searchInput").value.trim();
    if (query) searchBooks(query, "searchGrid", "searchMsg");
  });
}

async function setupHomePage() {
  const form = byId("heroForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = byId("heroInput").value.trim();
      if (query) window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    });
  }
  if (byId("trendingGrid")) searchBooks("bestseller fiction programming", "trendingGrid", "trendMsg");
  if (byId("favCount")) {
    const favs = await getFavorites();
    byId("favCount").textContent = `${favs.length}`;
  }
}

async function setupDetailsPage() {
  const box = byId("detailsBox");
  if (!box) return;
  const selected = getSelectedBook();
  const key = new URLSearchParams(window.location.search).get("key") || "";
  const source = await getFavorites();
  const book = selected || source.find((item) => item.key === key);
  if (!book) {
    box.innerHTML = `<p class="muted">No details available. Open details from Search or Favorites page.</p>`;
    return;
  }
  box.innerHTML = `
    <img src="${coverUrl(book.coverId)}" alt="${book.title}">
    <div>
      <h2>${book.title}</h2>
      <div class="details-list">
        <p><strong>Author:</strong> ${safeText(book.author)}</p>
        <p><strong>Publish Year:</strong> ${safeText(book.year)}</p>
        <p><strong>Language:</strong> ${book.languages && book.languages.length ? book.languages.join(", ") : "N/A"}</p>
        <p><strong>Edition Count:</strong> ${safeText(book.editionCount)}</p>
        <p><strong>Open Library Key:</strong> ${safeText(book.key)}</p>
      </div>
      <h3>Subjects</h3>
      <div class="chips">${chipHTML(book.subjects)}</div>
      <div class="actions">
        <button class="btn btn-secondary" data-book="${encodeURIComponent(JSON.stringify(book))}" onclick="addFavoriteFromData(this)">Add to Favorites</button>
      </div>
    </div>
  `;
}

async function setupAuthorsPage() {
  const mount = byId("authorsTableMount");
  const msg = byId("authorsRenderMsg");
  if (!mount || !msg) return;
  try {
    const [xmlRes, xslRes] = await Promise.all([fetch("authors.xml"), fetch("authors.xsl")]);
    if (!xmlRes.ok || !xslRes.ok) throw new Error("Files not loaded");
    const [xmlText, xslText] = await Promise.all([xmlRes.text(), xslRes.text()]);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const xslDoc = parser.parseFromString(xslText, "text/xml");
    if (xmlDoc.querySelector("parsererror") || xslDoc.querySelector("parsererror")) throw new Error("Invalid XML or XSL");
    const processor = new XSLTProcessor();
    processor.importStylesheet(xslDoc);
    mount.innerHTML = "";
    mount.appendChild(processor.transformToFragment(xmlDoc, document));
    msg.textContent = "Rendered successfully from XML + XSLT.";
  } catch (error) {
    msg.innerHTML = "Could not render XML + XSLT in this mode. Open this project via XAMPP (http://localhost/...) and reload.";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSessionStatus();
  setupAuth();
  setupMenu();
  setupTopButton();
  setupSearchPage();
  await setupHomePage();
  await setupDetailsPage();
  await setupAuthorsPage();
  await renderFavorites();

  const query = new URLSearchParams(window.location.search).get("q");
  if (query && byId("searchInput")) {
    byId("searchInput").value = query;
    searchBooks(query, "searchGrid", "searchMsg");
  }
});
