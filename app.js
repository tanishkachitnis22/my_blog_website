// Minimal client-side blog engine for Markdown posts

const state = {
  posts: [],
  tags: new Set(),
  filteredTag: null,
  searchQuery: "",
};

// Safe element getter
function getEl(id) {
  return document.getElementById(id);
}

async function loadManifest() {
  const loadingIndicator = getEl("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "flex";
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
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
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
  const tagsContainer = getEl("tagsContainer");
  if (!tagsContainer) return;
  
  const counts = getTagCounts();
  const allCount = state.posts.length;
  const tags = ["all", ...Array.from(state.tags).sort((a, b) => a.localeCompare(b))];
  tagsContainer.innerHTML = "";
  
  for (const tag of tags) {
    const isAll = tag === "all";
    const isActive = (state.filteredTag === null && isAll) || state.filteredTag === tag;
    const el = document.createElement("button");
    el.className = "tag" + (isActive ? " active" : "");
    el.setAttribute("type", "button");
    el.textContent = tag;
    el.addEventListener("click", () => {
      state.filteredTag = isAll ? null : tag;
      renderTags();
      renderList();
    });
    tagsContainer.appendChild(el);
  }
}

function matchesFilters(post) {
  const matchesTag = state.filteredTag === null || (post.tags || []).includes(state.filteredTag);
  return matchesTag;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}

function renderList() {
  const postList = getEl("postList");
  if (!postList) return;
  
  const filtered = state.posts.filter(matchesFilters);
  
  if (filtered.length === 0) {
    postList.innerHTML = `
      <div class="empty-state">
        <h3>No posts found</h3>
        <p>Try selecting a different tag.</p>
        <button class="clear-btn" onclick="window.clearFilters()">Show all posts</button>
      </div>`;
    return;
  }
  
  postList.innerHTML = filtered.map(post => {
    const dateStr = formatDate(post.date);
    const firstTag = (post.tags || [])[0] || "";
    return `
      <article class="post-item">
        <h3><a href="#/post/${post.slug}">${escapeHtml(post.title)}</a></h3>
        ${post.description ? `<p class="post-desc">${escapeHtml(post.description)}</p>` : ''}
        <div class="post-meta">
          <time datetime="${post.date.toISOString()}">${dateStr}</time>
          ${firstTag ? `<span class="post-tag">${escapeHtml(firstTag)}</span>` : ''}
        </div>
      </article>`;
  }).join("");
}

window.clearFilters = function() {
  state.filteredTag = null;
  renderTags();
  renderList();
};

function rewriteRelativeImageSrcs(container, slug) {
  if (!container) return;
  const imgs = container.querySelectorAll("img[src]");
  imgs.forEach(img => {
    const src = img.getAttribute("src") || "";
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|#|data:)/i.test(src)) return;
    img.setAttribute("src", `./posts/${slug}/${src}`);
  });
}

function showHome() {
  const homeView = getEl("homeView");
  const postView = getEl("postView");
  if (homeView) homeView.classList.remove("view--hidden");
  if (postView) postView.classList.add("view--hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildToc(slug) {
  const toc = getEl("toc");
  const postContent = getEl("postContent");
  if (!toc || !postContent) return;
  
  const headings = postContent.querySelectorAll("h2, h3");
  if (!headings.length) {
    toc.innerHTML = "";
    toc.style.display = "none";
    return;
  }
  
  toc.style.display = "block";
  const links = Array.from(headings).map(h => {
    const id = h.id || h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    h.id = id;
    return `<a href="#/post/${slug}#${id}">${escapeHtml(h.textContent)}</a>`;
  }).join("");
  toc.innerHTML = `<h4>On this page</h4>${links}`;
}

async function showPost(slug, anchorId) {
  const post = state.posts.find(p => p.slug === slug);
  const postTitle = getEl("postTitle");
  const postContent = getEl("postContent");
  const postDate = getEl("postDate");
  const postTags = getEl("postTags");
  const homeView = getEl("homeView");
  const postView = getEl("postView");
  
  if (!post) {
    if (postTitle) postTitle.textContent = "Post not found";
    if (postContent) postContent.innerHTML = "<p>Sorry, this post doesn't exist.</p>";
    if (postDate) postDate.textContent = "";
    if (postTags) postTags.innerHTML = "";
    if (homeView) homeView.classList.add("view--hidden");
    if (postView) postView.classList.remove("view--hidden");
    return;
  }
  
  // Show loading
  if (postContent) {
    postContent.innerHTML = '<p>Loading...</p>';
  }
  if (homeView) homeView.classList.add("view--hidden");
  if (postView) postView.classList.remove("view--hidden");
  
  try {
    const res = await fetch(`./posts/${post.slug}.md`);
    if (!res.ok) throw new Error(`Failed to load post`);
    const markdown = await res.text();

    if (postTitle) postTitle.textContent = post.title;
    if (postDate) {
      postDate.textContent = formatDate(post.date);
      postDate.setAttribute("datetime", post.date.toISOString());
    }
    if (postTags) {
      postTags.innerHTML = (post.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(" ");
    }

    // Parse markdown
    const html = marked.parse(markdown, { mangle: false, headerIds: true });
    const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true, svg: true } });
    if (postContent) postContent.innerHTML = clean;

    rewriteRelativeImageSrcs(postContent, post.slug);
    buildToc(slug);

    // Highlight code
    if (window.Prism && postContent) {
      Prism.highlightAllUnder(postContent);
    }

    // Scroll to top or anchor
    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (error) {
    console.error("Error loading post:", error);
    if (postContent) {
      postContent.innerHTML = `<div class="empty-state"><h3>Error loading post</h3><p>${escapeHtml(error.message)}</p></div>`;
    }
  }
}

function onHashChange() {
  const hash = location.hash;
  const match = hash.match(/^#\/post\/([A-Za-z0-9_-]+)(?:#(.+))?/);
  if (match) {
    showPost(match[1], match[2] || null);
  } else {
    showHome();
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initEvents() {
  // Back link
  const backLink = document.querySelector(".back-link");
  if (backLink) {
    backLink.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = "";
    });
  }
  
  // Nav links
  document.querySelectorAll('.nav-bar a').forEach(link => {
    const text = link.textContent.toLowerCase().trim();
    if (text === 'home' || text === 'blog') {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = "";
        scrollToTop();
      });
    }
  });
  
  // Back to top
  const backToTop = document.querySelector(".back-to-top-link");
  if (backToTop) {
    backToTop.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToTop();
    });
  }

  // Scroll button
  const scrollBtn = getEl("scrollToTop");
  if (scrollBtn) {
    scrollBtn.addEventListener("click", scrollToTop);
    window.addEventListener("scroll", () => {
      scrollBtn.classList.toggle("visible", window.scrollY > 300);
    });
  }

  window.addEventListener("hashchange", onHashChange);
}

async function main() {
  try {
    await loadManifest();
    renderTags();
    renderList();
    initEvents();
    onHashChange();
  } catch (err) {
    console.error("Init error:", err);
    const postList = getEl("postList");
    if (postList) {
      postList.innerHTML = `<div class="empty-state"><h3>Load error</h3><p>${escapeHtml(String(err.message || err))}</p></div>`;
    }
  }
}

main();
