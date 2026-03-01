// Minimal client-side blog engine for Markdown posts
// Fixed version - handles missing elements gracefully

const state = {
  posts: [],
  tags: new Set(),
  filteredTag: null,
  searchQuery: "",
};

const elements = {
  postList: document.getElementById("postList"),
  tagsContainer: document.getElementById("tagsContainer"),
  postView: document.getElementById("postView"),
  homeView: document.getElementById("homeView"),
  postTitle: document.getElementById("postTitle"),
  postContent: document.getElementById("postContent"),
  postDate: document.getElementById("postDate"),
  postTags: document.getElementById("postTags"),
  searchInput: document.getElementById("searchInput"),
  randomBtn: document.getElementById("randomBtn"),
  toc: document.getElementById("toc"),
  loadingIndicator: document.getElementById("loadingIndicator"),
  scrollToTop: document.getElementById("scrollToTop"),
};

async function loadManifest() {
  if (elements.loadingIndicator) {
    elements.loadingIndicator.setAttribute("aria-hidden", "false");
    elements.loadingIndicator.style.display = "flex";
  }
  try {
    const res = await fetch("./posts/posts.json");
    if (!res.ok) throw new Error("Failed to load posts.json");
    const manifest = await res.json();
    state.posts = manifest.posts
      .map(p => ({ ...p, date: new Date(p.date) }))
      .sort((a, b) => b.date - a.date);
    for (const p of state.posts) {
      if (Array.isArray(p.tags)) p.tags.forEach(t => state.tags.add(t));
    }
  } finally {
    if (elements.loadingIndicator) {
      elements.loadingIndicator.setAttribute("aria-hidden", "true");
      elements.loadingIndicator.style.display = "none";
    }
  }
}

function getTagCounts() {
  const counts = new Map();
  for (const post of state.posts) {
    const set = new Set(post.tags || []);
    for (const t of set) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return counts;
}

function renderTags() {
  if (!elements.tagsContainer) return;
  
  const counts = getTagCounts();
  const allCount = state.posts.length;
  const tags = ["all", ...Array.from(state.tags).sort((a, b) => a.localeCompare(b))];
  elements.tagsContainer.innerHTML = "";
  for (const tag of tags) {
    const isAll = tag === "all";
    const isActive = (state.filteredTag === null && isAll) || state.filteredTag === tag;
    const count = isAll ? allCount : (counts.get(tag) || 0);
    const el = document.createElement("button");
    el.className = "tag" + (isActive ? " active" : "");
    el.setAttribute("type", "button");
    el.setAttribute("aria-pressed", isActive ? "true" : "false");
    el.setAttribute("data-tag", tag);
    el.innerHTML = `#${escapeHtml(tag)} <span class="tag-count">${count}</span>`;
    el.addEventListener("click", () => {
      state.filteredTag = isAll ? null : tag;
      renderTags();
      renderList();
    });
    elements.tagsContainer.appendChild(el);
  }
}

function normalizeString(value) {
  return (value || "").toLowerCase().trim();
}

let searchTimeout = null;
function updateSearch(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchQuery = normalizeString(query);
    renderList();
  }, 150);
}

function matchesFilters(post) {
  const q = normalizeString(state.searchQuery);
  const text = normalizeString(`${post.slug} ${post.title} ${post.description || ""} ${(post.tags || []).join(" ")}`);
  const matchesQuery = q.length === 0 || text.includes(q);
  const matchesTag = state.filteredTag === null || (post.tags || []).includes(state.filteredTag);
  return matchesQuery && matchesTag;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}

function renderList() {
  if (!elements.postList) return;
  
  const filtered = state.posts.filter(matchesFilters);
  if (filtered.length === 0) {
    const q = state.searchQuery;
    const hasFilters = q || state.filteredTag;
    elements.postList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No posts found</h3>
        <p>${hasFilters ? `Nothing matches your filters.` : "No posts available."}</p>
        ${hasFilters ? `<button class="btn btn-primary clear-filters" onclick="clearFilters()">Clear filters</button>` : ""}
      </div>`;
    return;
  }
  
  // Minimal list layout (no cards, no images)
  elements.postList.innerHTML = filtered.map(post => {
    const dateStr = formatDate(post.date);
    const tags = (post.tags || []).map(t => `#${escapeHtml(t)}`).join(' ');
    return `
      <a class="card" href="#/post/${post.slug}" aria-label="Read ${escapeHtml(post.title)}">
        <div class="card-content">
          <div class="card-title-box">
            <h3>${escapeHtml(post.title)}</h3>
            ${post.description ? `<p>${escapeHtml(post.description)}</p>` : ''}
          </div>
          <div class="meta">
            <time datetime="${post.date.toISOString()}">${dateStr}</time>
            <span>${tags}</span>
          </div>
        </div>
      </a>`;
  }).join("");
}

window.clearFilters = function() {
  state.searchQuery = "";
  state.filteredTag = null;
  if (elements.searchInput) elements.searchInput.value = "";
  renderTags();
  renderList();
};

function escapeHtml(s) {
  return s.replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}

function rewriteRelativeImageSrcs(container, slug) {
  const imgs = container.querySelectorAll("img[src]");
  imgs.forEach(img => {
    const src = img.getAttribute("src") || "";
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|#|data:)/i.test(src)) return;
    img.setAttribute("src", `./posts/${slug}/${src}`);
  });
}

async function showHome() {
  if (elements.homeView) elements.homeView.classList.remove("view--hidden");
  if (elements.postView) elements.postView.classList.add("view--hidden");
}

function buildToc(slug) {
  if (!elements.toc || !elements.postContent) return;
  
  const headings = elements.postContent.querySelectorAll("h2, h3");
  if (!headings.length) {
    elements.toc.innerHTML = "";
    return;
  }
  const links = Array.from(headings).map(h => {
    const id = h.id || h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    h.id = id;
    return `<a href="#/post/${slug}#${id}">${escapeHtml(h.textContent)}</a>`;
  }).join("");
  elements.toc.innerHTML = `<h4>On this page</h4>${links}`;
}

async function showPost(slug, anchorId) {
  const post = state.posts.find(p => p.slug === slug);
  if (!post) {
    if (elements.postTitle) elements.postTitle.textContent = "Not found";
    if (elements.postContent) elements.postContent.innerHTML = "<p>Post not found.</p>";
    if (elements.postDate) elements.postDate.textContent = "";
    if (elements.postTags) elements.postTags.innerHTML = "";
    if (elements.homeView) elements.homeView.classList.add("view--hidden");
    if (elements.postView) elements.postView.classList.remove("view--hidden");
    return;
  }
  
  if (elements.postContent) {
    elements.postContent.innerHTML = '<div class="loading-indicator" style="display: flex;"><div class="loading-spinner"></div><p>Loading post...</p></div>';
  }
  if (elements.homeView) elements.homeView.classList.add("view--hidden");
  if (elements.postView) elements.postView.classList.remove("view--hidden");
  
  try {
    const res = await fetch(`./posts/${post.slug}.md`);
    if (!res.ok) throw new Error(`Failed to load post: ${res.statusText}`);
    const markdown = await res.text();

    if (elements.postTitle) elements.postTitle.textContent = post.title;
    if (elements.postDate) {
      elements.postDate.textContent = formatDate(post.date);
      elements.postDate.setAttribute("datetime", post.date.toISOString());
    }
    if (elements.postTags) {
      elements.postTags.innerHTML = (post.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("");
    }

    const html = marked.parse(markdown, { mangle: false, headerIds: true });
    const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true, svg: true } });
    if (elements.postContent) elements.postContent.innerHTML = clean;

    rewriteRelativeImageSrcs(elements.postContent, post.slug);
    buildToc(slug);

    if (window.Prism && elements.postContent) {
      Prism.highlightAllUnder(elements.postContent);
    }

    const hashMatch = (typeof anchorId === 'string' && anchorId) ? [null, anchorId] : location.hash.match(/^#\/post\/[A-Za-z0-9-_]+#([A-Za-z0-9\-]+)/);
    const targetId = (hashMatch && hashMatch[1]) ? hashMatch[1] : null;
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (error) {
    console.error("Error loading post:", error);
    if (elements.postContent) {
      elements.postContent.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error loading post</h3><p>${escapeHtml(error.message || "Failed to load post content.")}</p></div>`;
    }
  }
}

function onHashChange() {
  const hash = location.hash;
  const match = hash.match(/^#\/post\/([A-Za-z0-9-_]+)(?:#([A-Za-z0-9\-]+))?/);
  if (match) {
    showPost(match[1], match[2] || null);
  } else {
    showHome();
  }
}

function handleScrollToTop() {
  if (elements.scrollToTop) {
    const showButton = window.scrollY > 300;
    elements.scrollToTop.classList.toggle("visible", showButton);
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initEvents() {
  // Search input (optional - may not exist in minimal theme)
  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", e => updateSearch(e.target.value));
    elements.searchInput.addEventListener("search", e => updateSearch(e.target.value));
    elements.searchInput.addEventListener("keydown", e => {
      if (e.key === "Escape") { 
        updateSearch(""); 
        elements.searchInput.value = "";
        elements.searchInput.blur();
      }
    });
  }

  // Random button (optional - may not exist in minimal theme)
  if (elements.randomBtn) {
    elements.randomBtn.addEventListener("click", () => {
      if (!state.posts.length) return;
      const idx = Math.floor(Math.random() * state.posts.length);
      location.hash = `#/post/${state.posts[idx].slug}`;
    });
  }
  
  // Back link
  const backLink = document.querySelector(".back-link");
  if (backLink) {
    backLink.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = "";
    });
  }
  
  // Home link in nav
  const homeLinks = document.querySelectorAll('a[href="#"], .nav-bar a:first-child');
  homeLinks.forEach(link => {
    if (link.textContent.toLowerCase().includes('home') || link.textContent.toLowerCase().includes('blog')) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = "";
        scrollToTop();
      });
    }
  });
  
  // Back to top link in footer
  const backToTopLink = document.querySelector(".back-to-top-link");
  if (backToTopLink) {
    backToTopLink.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToTop();
    });
  }

  // Scroll to top button
  if (elements.scrollToTop) {
    elements.scrollToTop.addEventListener("click", scrollToTop);
  }

  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("scroll", handleScrollToTop);
  handleScrollToTop();

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && elements.searchInput) {
      e.preventDefault();
      elements.searchInput.focus();
    }
    
    if (e.key === "r" && !e.ctrlKey && !e.metaKey && elements.randomBtn) {
      e.preventDefault();
      elements.randomBtn.click();
    }
  });
}

async function main() {
  await loadManifest();
  renderTags();
  renderList();
  initEvents();
  onHashChange();
}

main().catch(err => {
  console.error(err);
  if (elements.postList) {
    elements.postList.innerHTML = `<div class="empty-state"><h3>Load error</h3><p>${escapeHtml(String(err.message || err))}</p></div>`;
  }
});
