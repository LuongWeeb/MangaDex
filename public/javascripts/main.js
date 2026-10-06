/**
 * LOGIC FRONTEND CHO ỨNG DỤNG ĐỌC TRUYỆN ONLINE
 * Kết nối REST API Node.js/Express và MySQL (Auth, Me, Stories, Chapters, Categories)
 */

// State toàn cục của ứng dụng
let storiesData = [];
let categoriesData = [];
let currentCategory = 'all';
let currentCategoryName = 'Trang Chủ';
let currentCategorySlug = 'all';
let currentRanking = null;
let currentRankingName = '';
let currentView = 'home'; // 'home' | 'category' | 'ranking' | 'advanced-search'
let currentSubSort = 'latest';
let currentSubStatus = 'all';
let currentPagination = { page: 1, limit: 18, total: 0, totalPages: 0 };
let rankingStories = [];
let pendingRoute = null;
let currentStory = null;
let currentChapters = [];
let currentChapterIndex = 0;
let readerTheme = localStorage.getItem('readerTheme') || 'reader-theme-dark';

const icon = (name, className = 'icon') => `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const appPageIds = ['homePageView', 'advancedSearchPageView', 'storyDetailPageView', 'libraryPageView', 'profilePageView', 'uploaderPageView', 'adminPageView'];

function showAppPage(pageId) {
  appPageIds.forEach((id) => document.getElementById(id)?.classList.toggle('active', id === pageId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
let readerFontSize = parseInt(localStorage.getItem('readerFontSize')) || 18;
let userFollowedIds = new Set();
let storiesRequestId = 0;
let advancedSearchState = {
  categories: new Map(),
  page: 1,
  pagination: { page: 1, limit: 18, total: 0, totalPages: 0 }
};
const chapterUploadFiles = { create: [], edit: [] };
const advancedCategoryFallbacks = [
  ['Action', 'action'], ['Adventure', 'adventure'], ['Anime', 'anime'], ['Chuyển Sinh', 'chuyen-sinh'], ['Cổ Đại', 'co-dai'], ['Comedy', 'comedy'], ['Comic', 'comic'], ['Demons', 'demons'], ['Detective', 'detective'], ['Doujinshi', 'doujinshi'], ['Drama', 'drama'], ['Fantasy', 'fantasy'], ['Harem', 'harem'], ['Historical', 'historical'], ['Horror', 'horror'], ['Huyền Huyễn', 'huyen-huyen'], ['Isekai', 'isekai'], ['Josei', 'josei'], ['Manga', 'manga'], ['Manhua', 'manhua'], ['Manhwa', 'manhwa'], ['Martial Arts', 'martial-arts'], ['Mecha', 'mecha'], ['Mystery', 'mystery'], ['Ngôn Tình', 'ngon-tinh'], ['Psychological', 'psychological'], ['Romance', 'romance'], ['School Life', 'school-life'], ['Sci-fi', 'sci-fi'], ['Seinen', 'seinen'], ['Shoujo', 'shoujo'], ['Shounen', 'shounen'], ['Slice of life', 'slice-of-life'], ['Sports', 'sports'], ['Supernatural', 'supernatural'], ['Tragedy', 'tragedy'], ['Trinh Thám', 'trinh-tham'], ['Trọng Sinh', 'trong-sinh'], ['Tu Tiên', 'tu-tien'], ['Việt Nam', 'viet-nam'], ['Webtoon', 'webtoon'], ['Xuyên Không', 'xuyen-khong'], ['Yuri', 'yuri'], ['Yaoi', 'yaoi'], ['Kiếm Hiệp', 'kiem-hiep'], ['Tiên Hiệp', 'tien-hiep'], ['Đô Thị', 'do-thi']
];

const imageFallbackAttribute = "onerror=\"this.onerror=null; this.src='/images/covers/default-cover.svg';\"";

function debounce(fn, delay = 300) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = window.setTimeout(() => fn(...args), delay);
  };
}

function initImageDropzones() {
  document.querySelectorAll('.image-dropzone').forEach((dropzone) => {
    const key = dropzone.dataset.uploadKey;
    const input = document.getElementById(dropzone.dataset.fileInput);
    if (!key || !input) return;
    dropzone.addEventListener('click', () => input.click());
    dropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        input.click();
      }
    });
    input.addEventListener('change', () => {
      addChapterUploadFiles(key, Array.from(input.files));
      input.value = '';
    });
    ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragging');
    }));
    dropzone.addEventListener('drop', (event) => addChapterUploadFiles(key, Array.from(event.dataTransfer?.files || [])));
  });
}

function addChapterUploadFiles(key, files) {
  const imageFiles = files.filter((file) => /^image\/(jpeg|png|webp|gif)$/i.test(file.type));
  if (imageFiles.length !== files.length) showToast('⚠️ Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF');
  const existing = chapterUploadFiles[key] || [];
  const additions = imageFiles.filter((file) => !existing.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified));
  const nextFiles = [...existing, ...additions];
  if (nextFiles.length > 200) return showToast('⚠️ Mỗi chương chỉ được tải tối đa 200 ảnh');
  if (nextFiles.some((file) => file.size > 5 * 1024 * 1024)) return showToast('⚠️ Mỗi ảnh có dung lượng tối đa 5MB');
  chapterUploadFiles[key] = nextFiles;
  renderChapterUploadPreview(key);
}

function renderChapterUploadPreview(key) {
  const dropzone = document.querySelector(`.image-dropzone[data-upload-key="${key}"]`);
  const preview = document.getElementById(dropzone?.dataset.previewTarget);
  if (!preview) return;
  const files = chapterUploadFiles[key] || [];
  preview.innerHTML = files.map((file, index) => `
    <div class="image-upload-chip" title="${escapeHtml(file.name)}"><span>${index + 1}. ${escapeHtml(file.name)}</span><button class="image-upload-remove" type="button" onclick="removeChapterUploadFile('${key}', ${index})" aria-label="Bỏ ${escapeHtml(file.name)}">×</button></div>
  `).join('');
}

function removeChapterUploadFile(key, index) {
  chapterUploadFiles[key] = (chapterUploadFiles[key] || []).filter((_, itemIndex) => itemIndex !== index);
  renderChapterUploadPreview(key);
}

function clearChapterUploadFiles(key) {
  chapterUploadFiles[key] = [];
  renderChapterUploadPreview(key);
}

// Auth State
let authToken = localStorage.getItem('authToken') || null;
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
} catch (e) {
  currentUser = null;
}

// Hàm tính thời gian tương đối từ timestamp
function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  if (diffWeek < 5) return `${diffWeek} tuần trước`;
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${diffYear} năm trước`;
}

const defaultSeo = {
  title: 'MangaDex - Đọc Truyện Online',
  description: 'MangaDex - nền tảng đọc truyện tranh và tiểu thuyết online hiện đại, cập nhật nhanh và tối ưu trải nghiệm đọc.',
  image: '/images/covers/default-cover.svg'
};

function getAbsoluteUrl(url) {
  return new URL(url || '/', window.location.origin).href;
}

function setMetaContent(selector, content) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute('content', content);
}

function updateDefaultSeo() {
  document.title = defaultSeo.title;
  setMetaContent('meta[name="description"]', defaultSeo.description);
  setMetaContent('meta[property="og:title"]', defaultSeo.title);
  setMetaContent('meta[property="og:description"]', defaultSeo.description);
  setMetaContent('meta[property="og:image"]', getAbsoluteUrl(defaultSeo.image));
  setMetaContent('meta[property="og:type"]', 'website');
  setMetaContent('meta[property="og:url"]', window.location.href);
  document.getElementById('canonicalUrl')?.setAttribute('href', window.location.href);
}

function updateStorySeo(story, chapter = null) {
  const chapterLabel = chapter ? `Chương ${chapter.chapter_number}` : '';
  const title = chapterLabel
    ? `${story.title} - ${chapterLabel} | MangaDex`
    : `${story.title} | MangaDex`;
  const summary = (story.description || `Đọc truyện ${story.title} online.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  const description = chapterLabel ? `Đọc ${story.title} - ${chapterLabel}. ${summary}` : summary;

  document.title = title;
  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[property="og:image"]', getAbsoluteUrl(story.cover_image || defaultSeo.image));
  setMetaContent('meta[property="og:type"]', 'book');
  setMetaContent('meta[property="og:url"]', window.location.href);
  document.getElementById('canonicalUrl')?.setAttribute('href', window.location.href);
}

function setStoryUrl(story, chapter = null, replace = false) {
  const basePath = `/truyen/${encodeURIComponent(story.slug)}`;
  const path = chapter ? `${basePath}/chuong-${encodeURIComponent(chapter.chapter_number)}` : basePath;
  const state = chapter
    ? { view: 'chapter', storySlug: story.slug, chapterNumber: String(chapter.chapter_number) }
    : { view: 'story', storySlug: story.slug };
  window.history[replace ? 'replaceState' : 'pushState'](state, '', path);
}

function getStoryRoute() {
  const chapterMatch = window.location.pathname.match(/^\/truyen\/([^/]+)\/chuong-([^/]+)\/?$/i);
  if (chapterMatch) {
    return { storySlug: decodeURIComponent(chapterMatch[1]), chapterNumber: decodeURIComponent(chapterMatch[2]) };
  }

  const storyMatch = window.location.pathname.match(/^\/truyen\/([^/]+)\/?$/i);
  return storyMatch ? { storySlug: decodeURIComponent(storyMatch[1]), chapterNumber: null } : null;
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderUserHeader();
  loadUserFollows();
  loadCategories().finally(handleUrlRoute);
  loadRankings();
  setupEventListeners();
  initImageDropzones();
  if (currentUser && (currentUser.role_name === 'Admin' || currentUser.role_id === 1)) {
    checkPendingStoriesCount();
  }
});

// 1. Quản lý Dark/Light Mode toàn trang
function initTheme() {
  const savedTheme = localStorage.getItem('siteTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', target);
  localStorage.setItem('siteTheme', target);
  updateThemeIcon(target);
  showToast(target === 'dark' ? 'Đã đổi sang Dark Mode' : 'Đã đổi sang Light Mode');
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerHTML = icon(theme === 'dark' ? 'moon' : 'sun');
}

// 2. Render Khu vực User / Login trên Header
function renderUserHeader() {
  const area = document.getElementById('userHeaderArea');
  if (!area) return;

  if (authToken && currentUser) {
    const isAdmin = currentUser.role_name === 'Admin' || currentUser.role_id === 1;
    const isUploader = currentUser.role_name === 'Uploader' || currentUser.role_id === 2 || isAdmin;

    const avatar = escapeHtml(currentUser.avatar_url || '/images/avatars/default.svg');
    area.innerHTML = `
      <div class="user-avatar-menu">
        <button class="user-avatar-button" type="button" onclick="toggleUserMenu(event)" aria-label="Mở menu tài khoản" aria-expanded="false">
          <img src="${avatar}" alt="Ảnh đại diện của ${escapeHtml(currentUser.username || 'người dùng')}" ${imageFallbackAttribute} />
        </button>
        <div class="user-menu-popover" id="userMenuPopover" role="menu">
          <div class="user-menu-name">${escapeHtml(currentUser.full_name || currentUser.username)}</div>
          <button role="menuitem" onclick="openProfile()">${icon('user')}Hồ Sơ Của Tôi</button>
          <button role="menuitem" onclick="openLibraryModalWithTab('follows'); closeUserMenu()">${icon('bookmark')}Tủ Truyện &amp; Lịch Sử</button>
          ${isUploader ? `<button role="menuitem" onclick="openUploaderModal(); closeUserMenu()">${icon('pen')}Kênh Đăng Truyện</button>` : ''}
          ${isAdmin ? `<button role="menuitem" onclick="openAdminModal(); closeUserMenu()">${icon('shield')}Trang Quản Trị</button>` : ''}
          <button role="menuitem" class="user-menu-logout" onclick="handleLogout()">${icon('close')}Đăng Xuất</button>
        </div>
      </div>`;
  } else {
    area.innerHTML = `
      <button class="btn-primary" onclick="openAuthModal('login')">
        <span>Đăng Nhập</span>
      </button>
    `;
  }
}

// 3. Tải danh sách Thể loại từ API /categories
async function loadCategories() {
  try {
    const res = await fetch('/categories');
    categoriesData = await res.json();
    renderCategories();
  } catch (err) {
    console.error('Lỗi tải thể loại:', err);
  }
}

// 3. Quản lý Tủ truyện & Theo dõi trực tiếp trên Card truyện
async function loadUserFollows() {
  if (!authToken) {
    userFollowedIds.clear();
    return;
  }
  try {
    const res = await fetch('/api/me/follows', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const list = await res.json();
      userFollowedIds = new Set(list.map(item => item.id));
      renderStoriesGrid();
    }
  } catch (e) {
    console.error('Lỗi tải danh sách theo dõi:', e);
  }
}

async function toggleCardFollow(e, storyId) {
  e.stopPropagation(); // Không mở modal chi tiết truyện
  if (!authToken) {
    showToast('⚠️ Vui lòng đăng nhập để theo dõi truyện!');
    openAuthModal('login');
    return;
  }

  const btn = e.currentTarget;
  try {
    const res = await fetch(`/api/me/follows/${storyId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    if (data.followed) {
      userFollowedIds.add(storyId);
      btn.classList.add('followed');
      btn.title = 'Đang theo dõi (Bấm để hủy)';
    } else {
      userFollowedIds.delete(storyId);
      btn.classList.remove('followed');
      btn.title = 'Theo dõi truyện';
    }
    showToast(data.message || (data.followed ? 'Đã theo dõi truyện!' : 'Đã hủy theo dõi'));
  } catch (err) {
    showToast('❌ Không thể thực hiện thao tác theo dõi');
  }
}

// ==========================================================================
// ĐIỀU HƯỚNG TRANG & ROUTING (THỂ LOẠI / XẾP HẠNG / TRANG CHỦ)
// Chuẩn phong cách TruyenQQ - Không mở modal cửa sổ popup, chuyển trang thật!
// ==========================================================================

function closeAllModals() {
  if (typeof closeStoryModal === 'function') closeStoryModal(false);
  if (typeof closeReader === 'function') closeReader(false);
  if (typeof closeAuthModal === 'function') closeAuthModal();
}

function renderCategories() {
  const container = document.getElementById('navCategoriesMenu');
  if (!container) return;

  let html = `<button class="mega-category-link ${currentCategory === 'all' && currentView === 'category' ? 'active' : ''}" onclick="navigateToCategory('all', 'Tất Cả Thể Loại', 'all')">Tất Cả Thể Loại</button>`;
  categoriesData.forEach(cat => {
    const isAct = currentView === 'category' && (currentCategory == cat.id || currentCategorySlug === cat.slug);
    html += `<button class="mega-category-link ${isAct ? 'active' : ''}" onclick="navigateToCategory(${cat.id}, '${escapeHtml(cat.name)}', '${cat.slug}')">${escapeHtml(cat.name)}</button>`;
  });
  container.innerHTML = html;
  const mobileContainer = document.getElementById('mobileDrawerCategories');
  if (mobileContainer) {
    mobileContainer.innerHTML = categoriesData.map((cat) => `
      <button type="button" onclick="navigateToCategory(${cat.id}, '${escapeHtml(cat.name)}', '${cat.slug}'); closeMobileDrawer()">${escapeHtml(cat.name)}</button>
    `).join('');
  }
}

function navigateToHome(pushState = true) {
  closeAllModals();
  showAppPage('homePageView');
  updateDefaultSeo();
  currentView = 'home';
  currentCategory = 'all';
  currentCategoryName = 'Trang Chủ';
  currentCategorySlug = 'all';
  currentRanking = null;
  currentRankingName = '';

  // Ẩn Header trang thể loại/BXH, hiển thị lại Hero Banner
  const hero = document.getElementById('heroSection');
  const pageHeader = document.getElementById('pageHeaderSection');
  const sectionTitle = document.getElementById('storiesSectionTitle');
  const clearBtn = document.getElementById('clearFilterBtn');
  const navHomeBtn = document.getElementById('navHomeBtn');

  if (hero) hero.style.display = 'block';
  if (pageHeader) pageHeader.style.display = 'none';
  if (sectionTitle) sectionTitle.textContent = 'Truyện Mới Cập Nhật';
  if (clearBtn) clearBtn.style.display = 'none';

  // Highlight menu Trang Chủ
  document.querySelectorAll('.main-nav-link').forEach(btn => btn.classList.remove('active'));
  if (navHomeBtn) navHomeBtn.classList.add('active');

  // Bỏ active ở các dropdown/ranking links
  document.querySelectorAll('.mega-category-link').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.ranking-bar-link').forEach(el => el.classList.remove('active'));

  if (pushState) {
    window.history.pushState({ view: 'home' }, '', '/');
  }

  renderCategories();
  loadStories(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToCategory(catId, catName, catSlug, pushState = true) {
  closeAllModals();
  closeMobileDrawer();
  closeUserMenu();
  // Thể loại/ranking dùng chung vùng nội dung Trang chủ. Luôn kích hoạt vùng
  // này trước để các nút điều hướng nhanh vẫn hoạt động sau khi xem trang khác.
  showAppPage('homePageView');
  updateDefaultSeo();

  if (catId === 'all') {
    navigateToHome(pushState);
    return;
  }

  currentView = 'category';
  currentCategory = catId;
  currentCategoryName = catName;
  currentCategorySlug = catSlug || (catName ? catName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : catId);
  currentRanking = null;
  currentRankingName = '';

  // Ẩn Hero Banner, hiển thị Dedicated Page Header
  const hero = document.getElementById('heroSection');
  const pageHeader = document.getElementById('pageHeaderSection');
  const navHomeBtn = document.getElementById('navHomeBtn');
  const clearBtn = document.getElementById('clearFilterBtn');

  if (hero) hero.style.display = 'none';
  if (pageHeader) pageHeader.style.display = 'block';
  if (navHomeBtn) navHomeBtn.classList.remove('active');
  if (clearBtn) clearBtn.style.display = 'none';

  // Cập nhật Breadcrumbs
  const bcType = document.getElementById('breadcrumbType');
  const bcName = document.getElementById('breadcrumbName');
  if (bcType) bcType.textContent = 'Thể Loại';
  if (bcName) bcName.textContent = catName;

  // Cập nhật Banner Info Box
  const badgeEl = document.getElementById('pageTypeBadge');
  const titleEl = document.getElementById('pageHeaderTitle');
  const descEl = document.getElementById('pageHeaderDesc');
  if (badgeEl) badgeEl.textContent = 'THỂ LOẠI';
  if (titleEl) titleEl.textContent = `Thể Loại: ${catName}`;
  if (descEl) descEl.textContent = `Tổng hợp những bộ truyện hay nhất thuộc thể loại ${catName}. Đọc truyện tranh online bản đẹp, cập nhật các chương mới nhất mỗi ngày.`;

  // Cập nhật Section Title
  const sectionTitle = document.getElementById('storiesSectionTitle');
  if (sectionTitle) sectionTitle.innerHTML = `Danh Sách Truyện: <span style="color: var(--accent-primary);">${catName}</span>`;

  // Update active state in nav
  document.querySelectorAll('.main-nav-link').forEach(btn => {
    if (btn.textContent.trim().toLowerCase() === catName.toLowerCase()) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderCategories();

  if (pushState) {
    window.history.pushState(
      { view: 'category', catId, catName, catSlug: currentCategorySlug },
      '',
      `/?the-loai=${encodeURIComponent(currentCategorySlug)}`
    );
  }

  loadStories(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToCategoryBySlug(slug, fallbackName) {
  const cat = categoriesData.find(c => 
    c.slug === slug || 
    (c.name && c.name.toLowerCase() === (fallbackName || slug).toLowerCase())
  );
  if (cat) {
    navigateToCategory(cat.id, cat.name, cat.slug);
  } else {
    navigateToCategory(slug, fallbackName || slug, slug);
  }
}

function navigateToRanking(rankingType, rankingTitle, pushState = true) {
  closeAllModals();
  closeMobileDrawer();
  closeUserMenu();
  showAppPage('homePageView');
  updateDefaultSeo();

  currentView = 'ranking';
  currentCategory = 'all';
  currentCategoryName = '';
  currentCategorySlug = 'all';
  currentRanking = rankingType;
  currentRankingName = rankingTitle;

  // Ẩn Hero Banner, hiển thị Dedicated Page Header
  const hero = document.getElementById('heroSection');
  const pageHeader = document.getElementById('pageHeaderSection');
  const navHomeBtn = document.getElementById('navHomeBtn');
  const clearBtn = document.getElementById('clearFilterBtn');

  if (hero) hero.style.display = 'none';
  if (pageHeader) pageHeader.style.display = 'block';
  if (navHomeBtn) navHomeBtn.classList.remove('active');
  if (clearBtn) clearBtn.style.display = 'none';

  // Cập nhật Breadcrumbs
  const bcType = document.getElementById('breadcrumbType');
  const bcName = document.getElementById('breadcrumbName');
  if (bcType) bcType.textContent = 'Bảng Xếp Hạng';
  if (bcName) bcName.textContent = rankingTitle;

  // Cập nhật Banner Box
  const badgeEl = document.getElementById('pageTypeBadge');
  const titleEl = document.getElementById('pageHeaderTitle');
  const descEl = document.getElementById('pageHeaderDesc');
  if (badgeEl) badgeEl.textContent = 'BẢNG XẾP HẠNG';
  if (titleEl) titleEl.textContent = `Bảng Xếp Hạng: ${rankingTitle}`;
  if (descEl) descEl.textContent = `Top những bộ truyện đứng đầu bảng xếp hạng theo tiêu chí ${rankingTitle}. Được đông đảo bạn đọc bình chọn và theo dõi liên tục.`;

  // Cập nhật Section Title
  const sectionTitle = document.getElementById('storiesSectionTitle');
  if (sectionTitle) sectionTitle.innerHTML = `Bảng Xếp Hạng: <span style="color: var(--accent-primary);">${rankingTitle}</span>`;

  // Highlight active trong ranking sub-bar
  document.querySelectorAll('.ranking-bar-link').forEach(btn => {
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(rankingType)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (pushState) {
    window.history.pushState(
      { view: 'ranking', rankingType, rankingTitle },
      '',
      `/?xep-hang=${encodeURIComponent(rankingType)}`
    );
  }

  loadStories(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setSubSort(sortType) {
  currentSubSort = sortType;
  document.querySelectorAll('#sortFilterGroup .filter-pill').forEach(btn => {
    if (btn.getAttribute('data-sort') === sortType) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  loadStories(1);
}

function setSubStatus(status) {
  currentSubStatus = status;
  document.querySelectorAll('#statusFilterGroup .filter-pill').forEach(btn => {
    if (btn.getAttribute('data-status') === status) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  loadStories(1);
}

function selectCategory(catId, catName) {
  navigateToCategory(catId, catName);
}

function sortStories(criteria) {
  navigateToRanking(criteria, criteria);
}

function focusSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.focus();
    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function toggleUserMenu(event) {
  event?.stopPropagation();
  const popover = document.getElementById('userMenuPopover');
  const trigger = document.querySelector('.user-avatar-button');
  if (!popover) return;
  const isOpen = popover.classList.toggle('active');
  trigger?.setAttribute('aria-expanded', String(isOpen));
}

function closeUserMenu() {
  document.getElementById('userMenuPopover')?.classList.remove('active');
  document.querySelector('.user-avatar-button')?.setAttribute('aria-expanded', 'false');
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  if (!drawer || !backdrop) return;
  const isOpen = drawer.classList.toggle('active');
  backdrop.classList.toggle('active', isOpen);
  drawer.setAttribute('aria-hidden', String(!isOpen));
  document.body.classList.toggle('drawer-open', isOpen);
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  drawer?.classList.remove('active');
  drawer?.setAttribute('aria-hidden', 'true');
  document.getElementById('mobileDrawerBackdrop')?.classList.remove('active');
  document.body.classList.remove('drawer-open');
}

function advancedCategories() {
  const known = new Map(categoriesData.map((category) => [category.slug, category]));
  advancedCategoryFallbacks.forEach(([name, slug]) => {
    if (!known.has(slug)) known.set(slug, { name, slug });
  });
  return [...known.values()];
}

function openAdvancedSearch(pushState = true) {
  closeAllModals();
  closeMobileDrawer();
  closeUserMenu();
  currentView = 'advanced-search';
  showAppPage('advancedSearchPageView');
  renderAdvancedCategories();
  if (pushState) window.history.pushState({ view: 'advanced-search' }, '', '/tim-kiem');
}

function renderAdvancedCategories() {
  const container = document.getElementById('advancedCategoryGrid');
  if (!container) return;
  container.innerHTML = advancedCategories().map((category) => {
    const state = advancedSearchState.categories.get(category.slug) || 'none';
    const stateIcon = state === 'include' ? '✔' : state === 'exclude' ? '✕' : '□';
    return `<button type="button" class="tri-state-category ${state}" data-category-slug="${escapeHtml(category.slug)}" onclick="cycleAdvancedCategory('${escapeHtml(category.slug)}')" aria-label="${escapeHtml(category.name)}: ${state}" title="${escapeHtml(category.name)}"> <span aria-hidden="true">${stateIcon}</span>${escapeHtml(category.name)}</button>`;
  }).join('');
}

function cycleAdvancedCategory(slug) {
  const state = advancedSearchState.categories.get(slug) || 'none';
  const nextState = state === 'none' ? 'include' : state === 'include' ? 'exclude' : 'none';
  if (nextState === 'none') advancedSearchState.categories.delete(slug);
  else advancedSearchState.categories.set(slug, nextState);
  renderAdvancedCategories();
}

function toggleAdvancedFilters() {
  document.getElementById('advancedFilterPanel')?.classList.toggle('collapsed');
}

function resetAdvancedSearch() {
  advancedSearchState = { categories: new Map(), page: 1, pagination: { page: 1, limit: 18, total: 0, totalPages: 0 } };
  const keyword = document.getElementById('advancedSearchKeyword');
  if (keyword) keyword.value = '';
  ['advancedCountry', 'advancedStatus', 'advancedMinChapters', 'advancedSort'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.selectedIndex = 0;
  });
  renderAdvancedCategories();
  const grid = document.getElementById('advancedStoriesGrid');
  if (grid) grid.innerHTML = '';
  const count = document.getElementById('advancedResultsCount');
  if (count) count.textContent = 'Chọn điều kiện rồi nhấn Tìm Kiếm';
}

function advancedSearchRequest(page) {
  const include = [];
  const exclude = [];
  advancedSearchState.categories.forEach((state, slug) => {
    if (state === 'include') include.push(slug);
    if (state === 'exclude') exclude.push(slug);
  });
  const params = new URLSearchParams({
    page: String(page), limit: '18',
    search: document.getElementById('advancedSearchKeyword')?.value.trim() || '',
    country: document.getElementById('advancedCountry')?.value || 'all',
    status: document.getElementById('advancedStatus')?.value || 'all',
    min_chapters: document.getElementById('advancedMinChapters')?.value || '0',
    sort: document.getElementById('advancedSort')?.value || 'latest'
  });
  if (include.length) params.set('include_cats', include.join(','));
  if (exclude.length) params.set('exclude_cats', exclude.join(','));
  return `/stories?${params.toString()}`;
}

async function performAdvancedSearch(page = 1) {
  const grid = document.getElementById('advancedStoriesGrid');
  if (!grid) return;
  advancedSearchState.page = page;
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = '<p class="advanced-loading">Đang tìm truyện phù hợp…</p>';
  try {
    const response = await fetch(advancedSearchRequest(page));
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không thể tìm kiếm truyện');
    advancedSearchState.pagination = result.pagination || { page, limit: 18, total: 0, totalPages: 0 };
    renderAdvancedSearchResults(result.data || []);
  } catch (error) {
    grid.innerHTML = '<p class="stories-load-error">Không thể tải kết quả. Vui lòng thử lại.</p>';
  }
}

function renderAdvancedSearchResults(stories) {
  const grid = document.getElementById('advancedStoriesGrid');
  const count = document.getElementById('advancedResultsCount');
  if (!grid || !count) return;
  grid.removeAttribute('aria-busy');
  const total = advancedSearchState.pagination.total || 0;
  count.textContent = `Tìm thấy ${total} bộ truyện phù hợp`;
  if (!stories.length) {
    grid.innerHTML = '<p class="advanced-empty">Chưa có truyện nào phù hợp với điều kiện đã chọn.</p>';
  } else {
    grid.innerHTML = stories.map((story) => `
      <article class="story-card-v2" onclick="openStoryModal(${story.id})">
        <div class="card-thumb-wrapper"><img class="card-thumb" src="${escapeHtml(story.cover_image || '/images/covers/default-cover.svg')}" alt="${escapeHtml(story.title)}" loading="lazy" ${imageFallbackAttribute} /><div class="card-badges-left"><span class="card-badge ${story.status === 'Hoàn thành' ? 'badge-completed' : 'badge-ongoing'}">${escapeHtml(story.status || 'Đang ra')}</span></div></div>
        <div class="card-info"><h3 class="card-title">${escapeHtml(story.title)}</h3><div class="card-chapter">Ch. ${story.latest_chapter || 1}</div></div>
      </article>`).join('');
  }
  renderAdvancedPagination();
}

function renderAdvancedPagination() {
  const container = document.getElementById('advancedStoriesPagination');
  if (!container) return;
  const { page, totalPages } = advancedSearchState.pagination;
  if (!totalPages || totalPages <= 1) return void (container.innerHTML = '');
  const buttons = Array.from({ length: totalPages }, (_, index) => index + 1).filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1);
  container.innerHTML = `<div class="stories-pagination"><button class="pagination-button" ${page <= 1 ? 'disabled' : ''} onclick="performAdvancedSearch(${page - 1})">‹</button>${buttons.map((number, index) => `${index && number - buttons[index - 1] > 1 ? '<span class="pagination-ellipsis">…</span>' : ''}<button class="pagination-button ${number === page ? 'active' : ''}" onclick="performAdvancedSearch(${number})">${number}</button>`).join('')}<button class="pagination-button" ${page >= totalPages ? 'disabled' : ''} onclick="performAdvancedSearch(${page + 1})">›</button></div>`;
}

async function openProfile(pushState = true) {
  if (!authToken) {
    showToast('⚠️ Vui lòng đăng nhập để quản lý hồ sơ');
    openAuthModal('login');
    return;
  }
  closeAllModals();
  closeMobileDrawer();
  closeUserMenu();
  showAppPage('profilePageView');
  switchProfileTab('account');
  if (pushState) window.history.pushState({ view: 'profile' }, '', '/ho-so');
  await loadProfile();
}

async function loadProfile() {
  try {
    const response = await fetch('/api/me', { headers: { Authorization: `Bearer ${authToken}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    currentUser = { ...currentUser, ...data.user };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    renderUserHeader();
    const user = currentUser;
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileUsername').value = user.username || '';
    document.getElementById('profileFullName').value = user.full_name || '';
    document.getElementById('profileAvatarUrl').value = user.avatar_url || '';
    document.getElementById('profileAvatarPreview').src = user.avatar_url || '/images/avatars/default.svg';
    const gender = user.gender || '';
    const radio = document.querySelector(`input[name="profileGender"][value="${gender}"]`);
    if (radio) radio.checked = true;
    loadProfileAchievements();
  } catch (error) {
    showToast('❌ Không thể tải hồ sơ. Vui lòng đăng nhập lại.');
  }
}

function switchProfileTab(tab) {
  document.querySelectorAll('.profile-tab[data-profile-tab]').forEach((button) => button.classList.toggle('active', button.dataset.profileTab === tab));
  document.querySelectorAll('.profile-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `profile${tab.charAt(0).toUpperCase()}${tab.slice(1)}Panel`));
  if (tab === 'achievements') loadProfileAchievements();
}

async function saveProfile(event) {
  event.preventDefault();
  const gender = document.querySelector('input[name="profileGender"]:checked')?.value || '';
  const body = { full_name: document.getElementById('profileFullName').value, avatar_url: document.getElementById('profileAvatarUrl').value, gender };
  try {
    const response = await fetch('/api/me/profile', { method: 'PUT', headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Không thể lưu hồ sơ');
    currentUser = { ...currentUser, ...data.user };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    renderUserHeader();
    document.getElementById('profileAvatarPreview').src = currentUser.avatar_url;
    showToast('✅ Đã lưu thông tin hồ sơ');
  } catch (error) { showToast(`❌ ${error.message}`); }
}

async function uploadProfileAvatar(input) {
  const file = input.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('avatar', file);
  try {
    const response = await fetch('/api/me/avatar', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` }, body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Không thể tải ảnh');
    document.getElementById('profileAvatarUrl').value = data.avatar_url;
    document.getElementById('profileAvatarPreview').src = data.avatar_url;
    currentUser = { ...currentUser, avatar_url: data.avatar_url };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    renderUserHeader();
    showToast('✅ Đã cập nhật ảnh đại diện');
  } catch (error) { showToast(`❌ ${error.message}`); }
  input.value = '';
}

async function changeProfilePassword(event) {
  event.preventDefault();
  const currentPassword = document.getElementById('profileCurrentPassword').value;
  const newPassword = document.getElementById('profileNewPassword').value;
  if (newPassword !== document.getElementById('profileConfirmPassword').value) return showToast('⚠️ Xác nhận mật khẩu chưa khớp');
  try {
    const response = await fetch('/api/me/change-password', { method: 'PUT', headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Không thể đổi mật khẩu');
    event.target.reset();
    showToast('✅ Đổi mật khẩu thành công');
  } catch (error) { showToast(`❌ ${error.message}`); }
}

async function loadProfileAchievements() {
  const content = document.getElementById('profileAchievementsContent');
  if (!content || !authToken) return;
  try {
    const response = await fetch('/api/me/history', { headers: { Authorization: `Bearer ${authToken}` } });
    const history = await response.json();
    if (!response.ok) throw new Error();
    const chapters = history.length;
    const level = Math.max(1, Math.floor(chapters / 10) + 1);
    const progress = (chapters % 10) * 10;
    content.innerHTML = `<div class="achievement-level">${level}</div><div><strong>Cấp độ Độc giả ${level}</strong><p>Đã ghi nhận ${chapters} truyện trong lịch sử đọc.</p><div class="achievement-progress"><span style="width:${progress}%"></span></div><small>${progress}/100 EXP đến cấp tiếp theo</small></div>`;
  } catch (error) { content.textContent = 'Chưa thể tải thành tựu của bạn.'; }
}

// Xử lý Route từ URL (Browser Back/Forward và Direct URL)
function handleUrlRoute() {
  const storyRoute = getStoryRoute();
  if (storyRoute) {
    navigateToHome(false);
    openStoryBySlug(storyRoute.storySlug, {
      chapterNumber: storyRoute.chapterNumber,
      updateUrl: false
    });
    return;
  }

  if (window.location.pathname === '/tu-truyen' && authToken) {
    showAppPage('libraryPageView');
    switchLibraryTab(window.history.state?.tab || 'follows');
    return;
  }
  if (window.location.pathname === '/tim-kiem') {
    openAdvancedSearch(false);
    return;
  }
  if (window.location.pathname === '/ho-so' && authToken) {
    openProfile(false);
    return;
  }
  if (window.location.pathname === '/studio' && authToken) {
    showAppPage('uploaderPageView');
    switchUploaderTab('stories');
    return;
  }
  if (window.location.pathname === '/quan-tri' && authToken && (currentUser?.role_name === 'Admin' || currentUser?.role_id === 1)) {
    showAppPage('adminPageView');
    switchAdminTab('stats');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const theLoai = params.get('the-loai') || params.get('category');
  const xepHang = params.get('xep-hang') || params.get('ranking');

  if (theLoai) {
    if (theLoai === 'all') {
      navigateToHome(false);
    } else {
      const cat = categoriesData.find(c => 
        c.slug === theLoai || 
        c.id.toString() === theLoai || 
        (c.name && c.name.toLowerCase() === theLoai.toLowerCase())
      );
      if (cat) {
        navigateToCategory(cat.id, cat.name, cat.slug, false);
      } else if (categoriesData.length === 0) {
        pendingRoute = { type: 'category', value: theLoai };
      } else {
        navigateToCategory(theLoai, theLoai, theLoai, false);
      }
    }
  } else if (xepHang) {
    const titles = {
      'top-day': 'Top Ngày',
      'top-week': 'Top Tuần',
      'top-month': 'Top Tháng',
      'views': 'Top Lượt Đọc',
      'likes': 'Yêu Thích',
      'latest': 'Mới Cập Nhật',
      'newest': 'Truyện Mới',
      'completed': 'Truyện Full',
      'random': 'Truyện Ngẫu Nhiên'
    };
    navigateToRanking(xepHang, titles[xepHang] || xepHang, false);
  } else {
    navigateToHome(false);
  }
}

window.addEventListener('popstate', () => {
  handleUrlRoute();
});

function getStoriesRequest(page) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(currentPagination.limit || 18),
    sort: currentSubSort,
    status: currentSubStatus
  });
  let endpoint = '/stories';

  if (currentView === 'category' && currentCategorySlug !== 'all') {
    endpoint = `/stories/category/${encodeURIComponent(currentCategorySlug)}`;
  }

  if (currentView === 'ranking' && currentRanking) {
    const rankingOptions = {
      'top-day': { sort: 'views' },
      views: { sort: 'views' },
      'top-week': { sort: 'likes' },
      likes: { sort: 'likes' },
      'top-month': { sort: 'follows' },
      follows: { sort: 'follows' },
      latest: { sort: 'latest' },
      newest: { sort: 'latest' },
      completed: { status: 'completed' },
      random: { sort: 'latest' }
    };
    const option = rankingOptions[currentRanking] || {};
    if (option.sort) params.set('sort', option.sort);
    if (option.status) params.set('status', option.status);
  }

  return `${endpoint}?${params.toString()}`;
}

// 4. Tải danh sách truyện theo trang, bộ lọc và thứ tự hiện tại
async function loadStories(page = 1) {
  const requestId = ++storiesRequestId;
  renderStoriesSkeletons();
  try {
    const res = await fetch(getStoriesRequest(page));
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Không thể tải danh sách truyện');
    if (requestId !== storiesRequestId) return;

    storiesData = result.data || [];
    currentPagination = result.pagination || { page: 1, limit: 18, total: storiesData.length, totalPages: 1 };
    renderHeroBanner();
    renderStoriesGrid();
  } catch (err) {
    if (requestId !== storiesRequestId) return;
    console.error('Lỗi tải truyện:', err);
    const grid = document.getElementById('storiesGrid');
    if (grid) grid.innerHTML = '<p class="stories-load-error">Không thể tải danh sách truyện. Vui lòng thử lại.</p>';
  }
}

function renderStoriesSkeletons() {
  const grid = document.getElementById('storiesGrid');
  const pagination = document.getElementById('storiesPagination');
  if (!grid) return;
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = Array.from({ length: 8 }, () => `
    <article class="story-skeleton" aria-hidden="true">
      <div class="skeleton skeleton-cover"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-subtitle"></div>
    </article>
  `).join('');
  if (pagination) pagination.innerHTML = '';
}

async function loadRankings() {
  try {
    const res = await fetch('/stories?page=1&limit=5&sort=views&status=all');
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Không thể tải bảng xếp hạng');

    rankingStories = result.data || [];
    renderRankings();
  } catch (err) {
    console.error('Lỗi tải bảng xếp hạng:', err);
  }
}

function renderHeroBanner() {
  if (storiesData.length === 0) return;
  const hotStory = storiesData[0];

  const titleEl = document.getElementById('heroTitle');
  const descEl = document.getElementById('heroDesc');
  const readBtn = document.getElementById('heroReadBtn');

  if (titleEl) titleEl.textContent = hotStory.title;
  if (descEl) descEl.textContent = hotStory.description || 'Truyện cực hay, hấp dẫn từng chi tiết.';
  if (readBtn) {
    readBtn.onclick = () => openStoryModal(hotStory.id);
  }
}

function renderStoriesGrid(searchKeyword = '') {
  const grid = document.getElementById('storiesGrid');
  if (!grid) return;
  grid.removeAttribute('aria-busy');

  let filtered = [...storiesData];

  // Chỉ tìm trong trang hiện tại; các điều kiện chính đã được lọc trên server.
  if (searchKeyword.trim()) {
    const kw = searchKeyword.toLowerCase();
    filtered = filtered.filter(s => 
      s.title.toLowerCase().includes(kw) || 
      (s.other_name && s.other_name.toLowerCase().includes(kw))
    );
  }

  // Cập nhật số lượng đếm trên banner
  const countEl = document.getElementById('pageStoryCount');
  if (countEl) countEl.textContent = searchKeyword.trim() ? filtered.length : currentPagination.total;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1.5rem; color: var(--text-muted);">
        <p style="font-size: 3rem; margin-bottom: 0.75rem;">${icon('book')}</p>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
          Chưa có bộ truyện nào trong mục này
        </h3>
        <p style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 1.5rem; max-width: 480px; margin-left: auto; margin-right: auto;">
          Hệ thống đang liên tục cập nhật thêm truyện mới mỗi ngày. Bạn có thể khám phá thêm các thể loại khác!
        </p>
        <button class="btn-primary" onclick="navigateToHome()">
          <span>Khám Phá Trang Chủ</span>
        </button>
      </div>
    `;
    renderPagination();
    return;
  }

  // MangaDex card: tỷ lệ bìa 2:3, trạng thái và chương mới nhất hiển thị ngay trên ảnh.
  grid.innerHTML = filtered.map(story => {
    const coverUrl = story.cover_image || '/images/covers/default-cover.svg';
    const isFollowed = userFollowedIds.has(story.id);
    const statusClass = story.status === 'Hoàn thành' ? 'badge-completed' : 'badge-ongoing';

    return `
      <div class="story-card-v2" onclick="openStoryModal(${story.id})">
        <div class="card-thumb-wrapper">
          <img class="card-thumb" src="${coverUrl}" alt="${escapeHtml(story.title)}" loading="lazy" ${imageFallbackAttribute} />
          <div class="card-badges-left"><span class="card-badge ${statusClass}">${escapeHtml(story.status || 'Đang ra')}</span></div>
          <button class="card-bookmark-btn ${isFollowed ? 'followed' : ''}" 
                  title="${isFollowed ? 'Đang theo dõi (Bấm để hủy)' : 'Theo dõi truyện'}" 
                  onclick="toggleCardFollow(event, ${story.id})">
            <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
        </div>
          <div class="card-info">
            <h3 class="card-title">${escapeHtml(story.title)}</h3>
           <div class="card-chapter">Ch. ${story.latest_chapter || 1}</div>
        </div>
      </div>
    `;
  }).join('');

  renderPagination();
}

function renderPagination() {
  const container = document.getElementById('storiesPagination');
  if (!container) return;

  const { page, totalPages } = currentPagination;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pageNumbers = new Set([1, totalPages, page - 1, page, page + 1]);
  const visiblePages = [...pageNumbers]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((first, second) => first - second);
  let previousPage = 0;
  const buttons = visiblePages.map((number) => {
    const separator = number - previousPage > 1 ? '<span class="pagination-ellipsis" aria-hidden="true">…</span>' : '';
    previousPage = number;
    return `${separator}<button class="pagination-button ${number === page ? 'active' : ''}" type="button" onclick="changeStoriesPage(${number})" ${number === page ? 'aria-current="page"' : ''}>${number}</button>`;
  }).join('');

  container.innerHTML = `
    <nav class="stories-pagination" aria-label="Phân trang danh sách truyện">
      <button class="pagination-button" type="button" onclick="changeStoriesPage(1)" ${page === 1 ? 'disabled' : ''}>« Đầu</button>
      <button class="pagination-button" type="button" onclick="changeStoriesPage(${page - 1})" ${page === 1 ? 'disabled' : ''} aria-label="Trang trước">‹</button>
      ${buttons}
      <button class="pagination-button" type="button" onclick="changeStoriesPage(${page + 1})" ${page === totalPages ? 'disabled' : ''} aria-label="Trang sau">›</button>
      <button class="pagination-button" type="button" onclick="changeStoriesPage(${totalPages})" ${page === totalPages ? 'disabled' : ''}>Cuối »</button>
    </nav>
  `;
}

function changeStoriesPage(page) {
  if (page < 1 || page > currentPagination.totalPages || page === currentPagination.page) return;
  loadStories(page);
  document.getElementById('storiesSectionTitle')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderRankings() {
  const list = document.getElementById('rankingList');
  if (!list) return;

  list.innerHTML = rankingStories.map((s, idx) => `
    <div class="ranking-item" onclick="openStoryModal(${s.id})">
      <span class="rank-number rank-${idx + 1}">0${idx + 1}</span>
      <img class="rank-thumb" src="${s.cover_image || '/images/covers/default-cover.svg'}" alt="${escapeHtml(s.title)}" ${imageFallbackAttribute} />
      <div class="rank-detail">
        <h4 class="rank-title">${s.title}</h4>
        <div class="rank-views">${icon('eye')} ${formatViews(s.views)} lượt đọc</div>
      </div>
    </div>
  `).join('');
}

// 5. Modal Chi Tiết Truyện
async function openStoryBySlug(slug, options = {}) {
  try {
    const res = await fetch(`/stories/slug/${encodeURIComponent(slug)}`);
    const story = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (story.message || 'Không tìm thấy truyện'));
      return;
    }
    await openStoryModal(story.id, { ...options, story });
  } catch (error) {
    showToast('❌ Không thể tải truyện từ đường dẫn này');
  }
}

async function openStoryModal(storyId, options = {}) {
  const { story: suppliedStory = null, updateUrl = true, chapterNumber = null } = options;
  let story = suppliedStory || storiesData.find(s => s.id == storyId);

  if (!story) {
    try {
      const res = await fetch(`/stories/${storyId}`);
      story = await res.json();
      if (!res.ok) {
        showToast('❌ ' + (story.message || 'Không tìm thấy truyện'));
        return;
      }
    } catch (error) {
      showToast('❌ Không thể tải thông tin truyện');
      return;
    }
  }

  currentStory = story;

  if (updateUrl) setStoryUrl(story);
  updateStorySeo(story);
  showAppPage('storyDetailPageView');
  document.getElementById('storyBreadcrumbTitle').textContent = story.title;

  document.getElementById('modalCover').src = story.cover_image || '/images/covers/default-cover.svg';
  document.getElementById('modalTitle').textContent = story.title;
  document.getElementById('modalOtherName').textContent = story.other_name ? `(${story.other_name})` : '';
  document.getElementById('modalViews').innerHTML = `${icon('eye')} ${formatViews(story.views)} lượt xem`;
  document.getElementById('modalStatus').textContent = story.status || 'Đang ra';
  document.getElementById('modalDesc').textContent = story.description || 'Chưa có mô tả tóm tắt.';

  // Tăng lượt xem cho truyện
  fetch(`/stories/${storyId}/views`, { method: 'POST' }).catch(() => {});

  // Reset nút like / follow
  const likeBtn = document.getElementById('modalLikeBtn');
  const followBtn = document.getElementById('modalFollowBtn');
  if (likeBtn) {
    likeBtn.className = 'btn-secondary';
    likeBtn.innerHTML = `${icon('heart')}<span>Thích Truyện</span>`;
  }
  if (followBtn) {
    followBtn.className = 'btn-secondary';
    followBtn.innerHTML = `${icon('star')}<span>Theo Dõi</span>`;
  }

  // Kiểm tra trạng thái thích và theo dõi nếu đã đăng nhập
  if (authToken) {
    fetch(`/api/me/likes/check/${storyId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.liked && likeBtn) {
          likeBtn.className = 'btn-secondary btn-active-like';
          likeBtn.innerHTML = `${icon('heart')}<span>Đã Thích</span>`;
        }
      }).catch(() => {});

    fetch(`/api/me/follows/check/${storyId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.followed && followBtn) {
          followBtn.className = 'btn-secondary btn-active-follow';
          followBtn.innerHTML = `${icon('star')}<span>Đang Theo Dõi</span>`;
        }
      }).catch(() => {});
  }

  // Tải danh sách chương
  const chaptersList = document.getElementById('chaptersList');
  chaptersList.innerHTML = '<p style="color: var(--text-muted)">Đang tải danh sách chương...</p>';

  try {
    const res = await fetch(`/chapters?story_id=${storyId}`);
    currentChapters = await res.json();
    if (!res.ok) throw new Error('Không thể tải danh sách chương');

    if (currentChapters.length === 0) {
      chaptersList.innerHTML = '<p style="color: var(--text-muted)">Chưa có chương nào được đăng.</p>';
    } else {
      chaptersList.innerHTML = currentChapters.map((chap, idx) => `
        <button class="chapter-btn" onclick="startReading(${idx})">
          <span>${chap.title || `Chương ${chap.chapter_number}`}</span>
          <span style="color: var(--text-muted); font-size: 0.75rem; display:flex; align-items:center; gap:4px;">${icon('eye')} ${chap.views || 0}</span>
        </button>
      `).join('');

      document.getElementById('modalReadFirstBtn').onclick = () => startReading(0);

      if (chapterNumber !== null) {
        const chapterIndex = currentChapters.findIndex((chapter) => Number(chapter.chapter_number) === Number(chapterNumber));
        if (chapterIndex >= 0) {
          await startReading(chapterIndex, { updateUrl: false });
          return;
        }

        showToast('⚠️ Không tìm thấy chương trong đường dẫn này');
        setStoryUrl(story, null, true);
        updateStorySeo(story);
      }
    }
  } catch (err) {
    console.error('Lỗi tải chương:', err);
    chaptersList.innerHTML = '<p style="color: #ef4444">Không thể tải danh sách chương.</p>';
  }

  // Tải bình luận của truyện
  loadStoryComments(storyId);

}

function closeStoryModal(restoreUrl = true) {
  if (restoreUrl && getStoryRoute()) {
    window.history.back();
  }
}

// 6. Màn hình Đọc Truyện (Reader View hỗ trợ cả Truyện Tranh Comic & Truyện Chữ Novel)
async function startReading(chapterIndex, options = {}) {
  if (!currentChapters || currentChapters.length === 0) return;
  const { updateUrl = true } = options;
  currentChapterIndex = chapterIndex;
  const chapter = currentChapters[chapterIndex];

  closeStoryModal(false);

  if (updateUrl) setStoryUrl(currentStory, chapter);
  updateStorySeo(currentStory, chapter);

  const reader = document.getElementById('readerModal');
  reader.className = `reader-modal active ${readerTheme}`;
  updateReaderThemeControls();
  document.getElementById('readerStoryTitle').textContent = currentStory.title;
  document.getElementById('readerChapterTitle').textContent = chapter.title || `Chương ${chapter.chapter_number}`;

  // Cập nhật Dropdown chọn chương nhanh
  const chapterSelect = document.getElementById('readerChapterSelect');
  if (chapterSelect) {
    chapterSelect.innerHTML = currentChapters.map((c, i) => `
      <option value="${i}" ${i === chapterIndex ? 'selected' : ''}>
        ${c.title || `Chương ${c.chapter_number}`}
      </option>
    `).join('');
  }

  // Tăng lượt xem cho chương truyện trong CSDL
  fetch(`/chapters/${chapter.id}/views`, { method: 'POST' }).catch(() => {});

  // Reset thanh tiến trình
  const progressBar = document.getElementById('readerProgressBar');
  if (progressBar) progressBar.style.width = '0%';

  const comicStreamEl = document.getElementById('comicStream');
  const bodyTextEl = document.getElementById('readerBodyText');
  const fontControls = document.getElementById('fontControls');
  const modeBadge = document.getElementById('readerModeBadge');

  // Kiểm tra xem chương này có ảnh truyện tranh trong bảng chapter_images không
  try {
    const imgRes = await fetch(`/chapter_images?chapter_id=${chapter.id}`);
    const images = await imgRes.json();

    if (images && images.length > 0) {
      // ===== CHẾ ĐỘ 1: TRUYỆN TRANH (MANGA / COMIC / WEBTOON) =====
      if (comicStreamEl) {
        comicStreamEl.style.display = 'flex';
        comicStreamEl.innerHTML = images.map((img, i) => `
          <div class="comic-page-wrapper">
            <img class="comic-page-img" src="${img.image_url}" alt="Trang ${img.order_index || i + 1}" loading="lazy" ${imageFallbackAttribute} />
            <span class="comic-page-number">Trang ${img.order_index || i + 1} / ${images.length}</span>
          </div>
        `).join('');
      }
      if (bodyTextEl) bodyTextEl.style.display = 'none';
      if (fontControls) fontControls.style.display = 'none';

      if (modeBadge) {
        modeBadge.textContent = 'MangaDex Reader · Truyện tranh';
      }
    } else {
      // ===== CHẾ ĐỘ 2: TRUYỆN CHỮ (NOVEL / TIỂU THUYẾT) =====
      if (comicStreamEl) comicStreamEl.style.display = 'none';
      if (bodyTextEl) {
        bodyTextEl.style.display = 'block';
        bodyTextEl.style.fontSize = `${readerFontSize}px`;
        bodyTextEl.innerHTML = `
          <h2 style="margin-bottom: 1.5rem; text-align: center;">${chapter.title || `Chương ${chapter.chapter_number}`}</h2>
          <p style="margin-bottom: 1.25rem;">Trời thu u ám, mây đen giăng kín khắp chân trời. Gió lạnh xào xạc lướt qua rặng trúc rì rào ngoài sảnh lớn, mang theo hơi thở lành lạnh của tiết giao mùa.</p>
          <p style="margin-bottom: 1.25rem;">Hắn đứng lặng bên khung cửa sổ, ánh mắt xa xăm nhìn về phía ngọn núi mờ ảo trong sương sớm. Đã ba năm trôi qua kể từ ngày biến cố ấy xảy ra, mọi ký ức vẫn còn vẹn nguyên như mới hôm qua.</p>
          <p style="margin-bottom: 1.25rem;">"Vương đạo, nghịch thiên mà đi, dẫu vạn kiếp bất phục cũng quyết không lùi bước!" - Hắn lẩm bẩm, bàn tay vô thức siết chặt thanh cổ kiếm trong tay áo, linh khí nhàn nhạt bắt đầu luân chuyển quanh đầu ngón tay.</p>
          <p style="margin-bottom: 1.25rem;">Một tiếng chuông đồng từ đỉnh tiên môn ngân vang, vang vọng khắp cửu giới, báo hiệu thời khắc khảo nghiệm đã chính thức bắt đầu...</p>
          <p style="margin-bottom: 1.25rem; font-style: italic; color: var(--text-muted); text-align: center;">(Hết chương. Nhấn "Chương Tiếp Theo" để đọc tiếp diễn biến!)</p>
        `;
      }
      if (fontControls) fontControls.style.display = 'flex';

      if (modeBadge) {
        modeBadge.textContent = 'MangaDex Reader · Truyện chữ';
      }
    }
  } catch (err) {
    console.error('Lỗi khi tải nội dung chương:', err);
  }

  document.getElementById('prevChapterBtn').disabled = currentChapterIndex <= 0;
  document.getElementById('nextChapterBtn').disabled = currentChapterIndex >= currentChapters.length - 1;
  const readerScrollArea = document.getElementById('readerScrollArea');
  const scrollStorageKey = `mangadex_scroll_${currentStory.id}_${chapter.id}`;
  const savedScrollTop = Number(localStorage.getItem(scrollStorageKey)) || 0;
  readerScrollArea.scrollTop = 0;
  const restoreScrollPosition = () => {
    readerScrollArea.scrollTo({ top: savedScrollTop, behavior: savedScrollTop ? 'smooth' : 'auto' });
    handleReaderScroll();
  };
  window.requestAnimationFrame(restoreScrollPosition);
  readerScrollArea.querySelectorAll('img').forEach((image) => {
    image.addEventListener('load', restoreScrollPosition, { once: true });
    image.addEventListener('error', restoreScrollPosition, { once: true });
  });

  // Tự động lưu tiến độ đọc vào CSDL nếu người dùng đã đăng nhập (/api/me/history)
  if (authToken && currentStory) {
    try {
      await fetch('/api/me/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ storyId: currentStory.id, chapterId: chapter.id })
      });
    } catch (e) {
      // Bỏ qua lỗi ngầm
    }
  }
}

function jumpToChapter(val) {
  const idx = parseInt(val, 10);
  if (!isNaN(idx) && idx >= 0 && idx < currentChapters.length) {
    startReading(idx);
  }
}

function handleReaderScroll() {
  const el = document.getElementById('readerScrollArea');
  const bar = document.getElementById('readerProgressBar');
  if (!el || !bar) return;

  const scrollHeight = el.scrollHeight - el.clientHeight;
  if (scrollHeight > 0) {
    const percent = Math.min(Math.max((el.scrollTop / scrollHeight) * 100, 0), 100);
    bar.style.width = `${percent}%`;
  }

  const chapter = currentChapters[currentChapterIndex];
  if (currentStory && chapter) {
    localStorage.setItem(`mangadex_scroll_${currentStory.id}_${chapter.id}`, String(el.scrollTop));
  }
}

function changeChapter(step) {
  const newIndex = currentChapterIndex + step;
  if (newIndex >= 0 && newIndex < currentChapters.length) {
    startReading(newIndex);
  }
}

function closeReader(restoreUrl = true) {
  document.getElementById('readerModal').classList.remove('active');
  if (restoreUrl && currentStory) {
    showAppPage('storyDetailPageView');
    setStoryUrl(currentStory, null, true);
    updateStorySeo(currentStory);
  }
}

function setReaderTheme(themeClass) {
  readerTheme = themeClass;
  localStorage.setItem('readerTheme', themeClass);
  const reader = document.getElementById('readerModal');
  reader.className = `reader-modal active ${themeClass}`;
  updateReaderThemeControls();
}

function updateReaderThemeControls() {
  document.querySelectorAll('[data-reader-theme]').forEach((button) => {
    const isActive = button.dataset.readerTheme === readerTheme;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function toggleReaderHud(event) {
  if (event?.target?.closest('button, select, input, a')) return;
  document.getElementById('readerModal')?.classList.toggle('hud-hidden');
}

function adjustFontSize(delta) {
  readerFontSize = Math.min(Math.max(readerFontSize + delta, 14), 28);
  localStorage.setItem('readerFontSize', readerFontSize);
  document.getElementById('readerBodyText').style.fontSize = `${readerFontSize}px`;
}

// 7. Xử lý Thích & Theo dõi truyện kết nối API /api/me
async function handleLike() {
  if (!authToken) {
    showToast('⚠️ Vui lòng đăng nhập để thích truyện!');
    openAuthModal('login');
    return;
  }
  const storyId = currentStory ? currentStory.id : 1;
  const likeBtn = document.getElementById('modalLikeBtn');

  try {
    const res = await fetch(`/api/me/likes/${storyId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (likeBtn) {
      if (data.liked) {
        likeBtn.className = 'btn-secondary btn-active-like';
        likeBtn.innerHTML = `${icon('heart')}<span>Đã Thích</span>`;
      } else {
        likeBtn.className = 'btn-secondary';
        likeBtn.innerHTML = `${icon('heart')}<span>Thích Truyện</span>`;
      }
    }
    showToast(data.message || (data.liked ? 'Đã thích truyện!' : 'Đã bỏ thích truyện'));
  } catch (err) {
    showToast('❌ Không thể thực hiện thao tác thích');
  }
}

async function handleFollow() {
  if (!authToken) {
    showToast('⚠️ Vui lòng đăng nhập để lưu truyện vào tủ sách!');
    openAuthModal('login');
    return;
  }
  const storyId = currentStory ? currentStory.id : 1;
  const followBtn = document.getElementById('modalFollowBtn');

  try {
    const res = await fetch(`/api/me/follows/${storyId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (followBtn) {
      if (data.followed) {
        followBtn.className = 'btn-secondary btn-active-follow';
        followBtn.innerHTML = `${icon('star')}<span>Đang Theo Dõi</span>`;
      } else {
        followBtn.className = 'btn-secondary';
        followBtn.innerHTML = `${icon('star')}<span>Theo Dõi</span>`;
      }
    }
    showToast(data.message || (data.followed ? 'Đã lưu vào Tủ Truyện!' : 'Đã hủy theo dõi'));
  } catch (err) {
    showToast('❌ Không thể thực hiện thao tác theo dõi');
  }
}

// 7.1. Quản lý Bình Luận (Comments)
async function loadStoryComments(storyId) {
  const listEl = document.getElementById('commentsList');
  const countEl = document.getElementById('modalCommentsCount');
  if (!listEl) return;

  listEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">Đang tải bình luận...</p>';

  try {
    const res = await fetch(`/comments/story/${storyId}`);
    const comments = await res.json();
    if (countEl) countEl.textContent = `(${comments.length} bình luận)`;

    if (comments.length === 0) {
      listEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem; font-style: italic;">Chưa có bình luận nào. Hãy là người đầu tiên nêu cảm nghĩ!</p>';
    } else {
      renderComments(comments);
    }
  } catch (err) {
    console.error('Lỗi tải bình luận:', err);
    listEl.innerHTML = '<p style="color: #ef4444; font-size: 0.88rem;">Không thể tải danh sách bình luận.</p>';
  }
}

function renderComments(comments) {
  const listEl = document.getElementById('commentsList');
  if (!listEl) return;

  listEl.innerHTML = comments.map(c => {
    const timeStr = c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : 'Vừa xong';
    const avatar = c.avatar_url || '/images/avatars/default.svg';
    return `
      <div class="comment-item">
        <img class="comment-avatar" src="${avatar}" alt="${c.username || 'User'}" />
        <div class="comment-content-box">
          <div class="comment-header">
            <span class="comment-author">${c.username || 'Độc giả'}</span>
            <span class="comment-time">${timeStr}</span>
          </div>
          <div class="comment-text">${escapeHtml(c.content)}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function submitComment() {
  if (!authToken) {
    showToast('⚠️ Vui lòng đăng nhập để bình luận!');
    openAuthModal('login');
    return;
  }

  const inputEl = document.getElementById('commentInput');
  const content = inputEl ? inputEl.value.trim() : '';

  if (!content) {
    showToast('⚠️ Vui lòng nhập nội dung bình luận');
    return;
  }

  if (!currentStory) return;

  try {
    const res = await fetch('/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        story_id: currentStory.id,
        content: content
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Không thể gửi bình luận'));
      return;
    }

    inputEl.value = '';
    showToast('✅ Đã gửi bình luận thành công!');
    // Tải lại danh sách bình luận
    loadStoryComments(currentStory.id);
  } catch (err) {
    showToast('❌ Lỗi khi gửi bình luận');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

// 7.2. Điền nhanh tài khoản mẫu để chấm điểm / demo
function quickFillAccount(username, password) {
  const u = document.getElementById('loginUsername');
  const p = document.getElementById('loginPassword');
  if (u) u.value = username;
  if (p) p.value = password;
  showToast(`⚡ Đã chọn tài khoản: ${username}`);
}

// 8. Auth Modal (Đăng Nhập / Đăng Ký)
function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  document.getElementById('authModal').classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('authTabLogin');
  const tabReg = document.getElementById('authTabRegister');

  if (tab === 'login') {
    loginForm.style.display = 'flex';
    regForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    regForm.style.display = 'flex';
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const usernameOrEmail = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Đăng nhập thất bại'));
      return;
    }

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    renderUserHeader();
    closeAuthModal();
    loadUserFollows();
    if (currentUser.role_name === 'Admin' || currentUser.role_id === 1) {
      checkPendingStoriesCount();
    }
    showToast(`Xin chào, ${currentUser.username}!`);
  } catch (err) {
    showToast('❌ Lỗi kết nối tới máy chủ');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Đăng ký thất bại'));
      return;
    }

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    renderUserHeader();
    closeAuthModal();
    loadUserFollows();
    showToast(`Đăng ký thành công! Chào mừng ${currentUser.username}`);
  } catch (err) {
    showToast('❌ Lỗi kết nối khi đăng ký');
  }
}

function handleLogout() {
  authToken = null;
  currentUser = null;
  userFollowedIds.clear();
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  renderUserHeader();
  renderStoriesGrid();
  showToast('Đã đăng xuất thành công');
}

// 9. Library Modal (Tủ truyện & Lịch sử đọc)
async function openLibraryModal() {
  openLibraryModalWithTab('follows');
}

function openLibraryModalWithTab(tab = 'follows') {
  if (!authToken) {
    showToast('⚠️ Vui lòng đăng nhập để xem Tủ Truyện & Lịch Sử Đọc!');
    openAuthModal('login');
    return;
  }
  showAppPage('libraryPageView');
  window.history.pushState({ view: 'library', tab }, '', '/tu-truyen');
  switchLibraryTab(tab);
}

function closeLibraryModal() {
  navigateToHome();
}

async function switchLibraryTab(tab) {
  const tabFollows = document.getElementById('libTabFollows');
  const tabHistory = document.getElementById('libTabHistory');
  const container = document.getElementById('libraryContent');

  if (tab === 'follows') {
    tabFollows.classList.add('active');
    tabHistory.classList.remove('active');
    container.innerHTML = '<p style="color: var(--text-muted)">Đang tải danh sách theo dõi...</p>';

    try {
      const res = await fetch('/api/me/follows', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();

      if (data.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 1.5rem; text-align: center;">Tủ truyện của bạn đang trống. Hãy theo dõi các bộ truyện yêu thích!</p>';
      } else {
        container.innerHTML = data.map(item => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${item.cover_image || '/images/covers/default-cover.svg'}" style="width: 40px; height: 52px; border-radius: 4px; object-fit: cover;" ${imageFallbackAttribute} />
              <div>
                <strong style="font-size: 0.95rem;">${item.title}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Tác giả: ${item.author_name || 'Đang cập nhật'} • ${item.status}</div>
              </div>
            </div>
            <button class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="openStoryModal(${item.id})">
              Xem
            </button>
          </div>
        `).join('');
      }
    } catch (e) {
      container.innerHTML = '<p style="color: #ef4444">Không thể tải dữ liệu tủ truyện.</p>';
    }
  } else {
    tabFollows.classList.remove('active');
    tabHistory.classList.add('active');
    container.innerHTML = '<p style="color: var(--text-muted)">Đang tải lịch sử đọc...</p>';

    try {
      const res = await fetch('/api/me/history', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();

      if (data.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 1.5rem; text-align: center;">Bạn chưa đọc chương truyện nào.</p>';
      } else {
        container.innerHTML = data.map(item => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
            <div>
              <strong style="font-size: 0.95rem;">${item.story_title}</strong>
              <div style="font-size: 0.8rem; color: var(--accent-secondary);">Đang đọc: ${item.chapter_title || `Chương ${item.chapter_number}`}</div>
            </div>
            <button class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="openStoryModal(${item.story_id})">
              Đọc Tiếp
            </button>
          </div>
        `).join('');
      }
    } catch (e) {
      container.innerHTML = '<p style="color: #ef4444">Không thể tải lịch sử đọc.</p>';
    }
  }
}

// Toast
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function formatViews(num) {
  if (!num) return '0';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const searchQuickResults = document.getElementById('searchQuickResults');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => showSearchQuickResults(e.target.value), 300));
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) showSearchQuickResults(searchInput.value);
    });
  }

  document.addEventListener('click', (event) => {
    if (searchQuickResults && !event.target.closest('.search-box')) hideSearchQuickResults();
    if (!event.target.closest('.user-avatar-menu')) closeUserMenu();
  });

  document.getElementById('readerScrollArea')?.addEventListener('click', toggleReaderHud);

  const modals = ['authModal'];
  modals.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) el.classList.remove('active');
      });
    }
  });

  // Nút Back to Top khi cuộn trang
  window.addEventListener('scroll', () => {
    const btn = document.getElementById('backToTopBtn');
    if (btn) {
      if (window.scrollY > 300) btn.classList.add('visible');
      else btn.classList.remove('visible');
    }
  });

  // Phím tắt điều hướng khi đang đọc truyện
  document.addEventListener('keydown', (e) => {
    const reader = document.getElementById('readerModal');
    if (reader && reader.classList.contains('active')) {
      const activeTag = document.activeElement && document.activeElement.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        changeChapter(-1);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        changeChapter(1);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const fullscreenAction = document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen();
        fullscreenAction.catch(() => showToast('⚠️ Không thể chuyển chế độ toàn màn hình'));
      } else if (e.key === 'Escape') {
        closeReader(false);
        navigateToHome();
      }
    } else if (e.key === 'Escape') {
      modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
      });
    }
  });
}

async function showSearchQuickResults(keyword) {
  const container = document.getElementById('searchQuickResults');
  const query = keyword.trim();
  if (!container) return;
  if (!query) return hideSearchQuickResults();

  container.hidden = false;
  container.innerHTML = '<div class="search-quick-status">Đang tìm truyện…</div>';
  try {
    const response = await fetch(`/stories?search=${encodeURIComponent(query)}&page=1&limit=5&sort=latest&status=all`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không thể tìm kiếm');
    const matches = result.data || [];
    if (!matches.length) {
      container.innerHTML = '<div class="search-quick-status">Không tìm thấy truyện phù hợp.</div>';
      return;
    }
    container.innerHTML = matches.map((story) => `
      <button class="search-quick-item" type="button" role="option" onclick="openQuickSearchStory(${story.id})">
        <img src="${story.cover_image || '/images/covers/default-cover.svg'}" alt="" ${imageFallbackAttribute} />
        <span class="search-quick-copy">
          <strong>${escapeHtml(story.title)}</strong>
          <small>${escapeHtml(story.author_name || 'Đang cập nhật')}</small>
        </span>
        <span class="search-quick-chapter">Ch. ${story.latest_chapter || 1}</span>
      </button>
    `).join('');
  } catch (error) {
    container.innerHTML = '<div class="search-quick-status">Không thể tìm kiếm lúc này.</div>';
  }
}

function hideSearchQuickResults() {
  const container = document.getElementById('searchQuickResults');
  if (container) {
    container.hidden = true;
    container.innerHTML = '';
  }
}

function openQuickSearchStory(storyId) {
  hideSearchQuickResults();
  document.getElementById('searchInput').value = '';
  openStoryModal(storyId);
}

// ==========================================================================
// 10. PHÂN HỆ UPLOADER (CMS QUẢN LÝ & ĐĂNG TRUYỆN)
// ==========================================================================

function openUploaderModal() {
  if (!authToken) {
    showToast('⚠️ Vui lòng đăng nhập với quyền Uploader/Admin!');
    openAuthModal('login');
    return;
  }
  showAppPage('uploaderPageView');
  window.history.pushState({ view: 'uploader' }, '', '/studio');
  switchUploaderTab('stories');
  populateUploaderOptions();
}

function closeUploaderModal() {
  navigateToHome();
}

function switchUploaderTab(tab) {
  const tabStories = document.getElementById('uploaderTabStories');
  const tabCreate = document.getElementById('uploaderTabCreate');
  const tabChap = document.getElementById('uploaderTabChapter');
  const tabEditStory = document.getElementById('uploaderTabEditStory');
  const tabManageChapters = document.getElementById('uploaderTabManageChapters');

  const panelStories = document.getElementById('uploaderStoriesPanel');
  const formCreate = document.getElementById('uploaderCreateStoryForm');
  const formChap = document.getElementById('uploaderCreateChapterForm');
  const formEditStory = document.getElementById('uploaderEditStoryForm');
  const panelManageChapters = document.getElementById('uploaderManageChaptersPanel');

  [tabStories, tabCreate, tabChap, tabEditStory, tabManageChapters].filter(Boolean).forEach(t => t.classList.remove('active'));
  [panelStories, formCreate, formChap, formEditStory, panelManageChapters].filter(Boolean).forEach(p => p.style.display = 'none');

  if (tab === 'stories') {
    tabStories.classList.add('active');
    panelStories.style.display = 'block';
    if (tabEditStory) tabEditStory.style.display = 'none';
    if (tabManageChapters) tabManageChapters.style.display = 'none';
    loadUploaderStories();
  } else if (tab === 'create') {
    tabCreate.classList.add('active');
    formCreate.style.display = 'flex';
  } else if (tab === 'chapter') {
    tabChap.classList.add('active');
    formChap.style.display = 'flex';
    populateUploaderStorySelect();
  } else if (tab === 'editStory') {
    if (tabEditStory) {
      tabEditStory.style.display = 'inline-block';
      tabEditStory.classList.add('active');
    }
    formEditStory.style.display = 'flex';
  } else if (tab === 'manageChapters') {
    if (tabManageChapters) {
      tabManageChapters.style.display = 'inline-block';
      tabManageChapters.classList.add('active');
    }
    panelManageChapters.style.display = 'block';
  }
}

async function loadUploaderStories() {
  const panel = document.getElementById('uploaderStoriesPanel');
  panel.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1.5rem;">Đang tải danh sách tác phẩm...</p>';

  try {
    const res = await fetch('/api/uploader/my-stories', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const stories = await res.json();

    if (stories.length === 0) {
      panel.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">${icon('book')}</p>
          Bạn chưa đăng tác phẩm nào. Bấm vào tab <strong>"Khai Báo Truyện Mới"</strong> để đăng tải bộ truyện đầu tiên!
        </div>
      `;
      return;
    }

    panel.innerHTML = stories.map(s => {
      let approvalBadge = '';
      if (s.approval_status === 'Chờ duyệt') {
        approvalBadge = '<span style="font-size: 0.72rem; color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.1rem 0.45rem; border-radius: 9999px; margin-left: 0.5rem; font-weight: 600;">⏳ Chờ Admin Duyệt</span>';
      } else if (s.approval_status === 'Đã duyệt') {
        approvalBadge = '<span style="font-size: 0.72rem; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.1rem 0.45rem; border-radius: 9999px; margin-left: 0.5rem; font-weight: 600;">✅ Đã Duyệt</span>';
      } else if (s.approval_status === 'Từ chối') {
        approvalBadge = '<span style="font-size: 0.72rem; color: #ef4444; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.1rem 0.45rem; border-radius: 9999px; margin-left: 0.5rem; font-weight: 600;">❌ Bị Từ Chối</span>';
      }

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem; border-bottom: 1px solid var(--border-color); gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <img src="${s.cover_image || '/images/covers/default-cover.svg'}" style="width: 44px; height: 58px; border-radius: 4px; object-fit: cover;" ${imageFallbackAttribute} />
            <div>
              <div style="display: flex; align-items: center; flex-wrap: wrap;">
                <strong style="font-size: 0.95rem; color: var(--text-primary);">${escapeHtml(s.title)}</strong>
                ${approvalBadge}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Tác giả: ${escapeHtml(s.author_name || 'Đang cập nhật')} • ${s.status} • ${s.total_chapters || 0} chương • ${formatViews(s.views)} lượt xem
              </div>
              <div style="font-size: 0.75rem; color: var(--accent-secondary); margin-top: 0.15rem;">
                Thể loại: ${escapeHtml(s.category_names || 'Manga/Manhwa')}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end;">
            <button class="btn-primary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" onclick="quickAddChapterToStory(${s.id})">
              + Thêm Chương
            </button>
            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #818cf8; border-color: rgba(99,102,241,0.3);" onclick="openManageChapters(${s.id})">
              Sửa Chương
            </button>
            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #38bdf8; border-color: rgba(56,189,248,0.3);" onclick="openEditStory(${s.id})">
              ✏️ Sửa Truyện
            </button>
            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #ef4444;" onclick="deleteUploaderStory(${s.id})">
              Xóa
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    panel.innerHTML = '<p style="color: #ef4444">Không thể tải danh sách truyện.</p>';
  }
}

// ==================== CHỈNH SỬA THÔNG TIN TRUYỆN ====================
async function openEditStory(storyId) {
  const form = document.getElementById('uploaderEditStoryForm');
  if (!form) return;

  try {
    const res = await fetch(`/api/uploader/stories/${storyId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const story = await res.json();
    if (!res.ok) return showToast('❌ ' + (story.message || 'Lỗi tải truyện'));

    document.getElementById('editStoryId').value = story.id;
    document.getElementById('editStoryDisplayTitle').textContent = story.title;
    document.getElementById('editStoryTitle').value = story.title || '';
    document.getElementById('editStoryOtherName').value = story.other_name || '';
    document.getElementById('editStoryStatus').value = story.status || 'Đang ra';
    document.getElementById('editStoryAgeLimit').value = story.age_limit || '0+';
    document.getElementById('editStoryCover').value = story.cover_image || '';
    document.getElementById('editStoryDesc').value = story.description || '';

    // Tải danh sách tác giả vào dropdown sửa
    const aSelect = document.getElementById('editStoryAuthorSelect');
    if (aSelect) {
      const aRes = await fetch('/authors');
      const authors = await aRes.json();
      aSelect.innerHTML = `<option value="">-- Chọn tác giả có sẵn --</option>` + 
        authors.map(a => `<option value="${a.id}" ${a.id == story.author_id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('');
    }

    // Tải danh sách thể loại với trạng thái đã tick
    const catBoxes = document.getElementById('editStoryCategoriesBoxes');
    if (catBoxes && categoriesData.length > 0) {
      const selectedIds = story.category_ids ? story.category_ids.toString().split(',').map(x => x.trim()) : [];
      catBoxes.innerHTML = categoriesData.map(c => `
        <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; cursor: pointer;">
          <input type="checkbox" name="uploaderEditCat" value="${c.id}" ${selectedIds.includes(c.id.toString()) ? 'checked' : ''} />
          <span>${escapeHtml(c.name)}</span>
        </label>
      `).join('');
    }

    switchUploaderTab('editStory');
  } catch (e) {
    showToast('❌ Không thể tải thông tin bộ truyện');
  }
}

async function handleUpdateStorySubmit(e) {
  e.preventDefault();
  const storyId = document.getElementById('editStoryId').value;
  const title = document.getElementById('editStoryTitle').value.trim();
  const other_name = document.getElementById('editStoryOtherName').value.trim();
  const author_id = document.getElementById('editStoryAuthorSelect').value;
  const new_author_name = document.getElementById('editStoryNewAuthor').value.trim();
  const status = document.getElementById('editStoryStatus').value;
  const age_limit = document.getElementById('editStoryAgeLimit').value;
  const cover_image = document.getElementById('editStoryCover').value.trim();
  const coverFile = document.getElementById('editStoryCoverFile').files[0];
  const description = document.getElementById('editStoryDesc').value.trim();

  const catBoxes = document.querySelectorAll('input[name="uploaderEditCat"]:checked');
  const category_ids = Array.from(catBoxes).map(b => parseInt(b.value, 10));
  const formData = new FormData();
  formData.append('title', title);
  formData.append('other_name', other_name);
  formData.append('author_id', author_id);
  formData.append('new_author_name', new_author_name);
  formData.append('category_ids', JSON.stringify(category_ids));
  formData.append('status', status);
  formData.append('age_limit', age_limit);
  formData.append('cover_image', cover_image);
  formData.append('description', description);
  if (coverFile) formData.append('cover_file', coverFile);

  try {
    const res = await fetch(`/api/uploader/stories/${storyId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Lỗi cập nhật'));
      return;
    }

    showToast('✅ Đã cập nhật thông tin truyện thành công!');
    loadStories(); // Tải lại lưới truyện trang chủ
    switchUploaderTab('stories');
  } catch (err) {
    showToast('❌ Lỗi kết nối máy chủ');
  }
}

// ==================== QUẢN LÝ & SỬA CHƯƠNG TRUYỆN ====================
let currentManagingStoryId = null;

async function openManageChapters(storyId) {
  currentManagingStoryId = storyId;
  const panel = document.getElementById('uploaderChaptersListContainer');
  const titleEl = document.getElementById('manageChaptersStoryTitle');
  const addBtn = document.getElementById('manageChaptersAddBtn');

  if (addBtn) {
    addBtn.onclick = () => {
      switchUploaderTab('chapter');
      populateUploaderStorySelect(storyId);
    };
  }

  panel.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1.5rem;">Đang tải danh sách chương...</p>';
  closeEditChapterForm();
  switchUploaderTab('manageChapters');

  try {
    const res = await fetch(`/api/uploader/stories/${storyId}/chapters`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();

    if (!res.ok) {
      panel.innerHTML = `<p style="color: #ef4444">${data.message || 'Lỗi tải chương'}</p>`;
      return;
    }

    if (titleEl && data.story) {
      titleEl.textContent = data.story.title;
    }

    if (!data.chapters || data.chapters.length === 0) {
      panel.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <p style="font-size: 1.8rem; margin-bottom: 0.5rem;">${icon('book')}</p>
          Truyện này chưa có chương nào. Hãy bấm <strong>"➕ Thêm Chương Mới"</strong> ở góc trên!
        </div>
      `;
      return;
    }

    panel.innerHTML = data.chapters.map(c => `
      <div class="uploader-chapter-row">
        <div class="uploader-chapter-info">
          <div class="uploader-chapter-title">
            Chương ${c.chapter_number}: ${escapeHtml(c.title || '')}
          </div>
          <div class="uploader-chapter-meta">
            ${c.views || 0} lượt đọc • ${c.image_count || 0} ảnh • Đăng: ${new Date(c.created_at).toLocaleDateString('vi-VN')}
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-primary" style="padding: 0.3rem 0.65rem; font-size: 0.78rem;" onclick="openEditChapter(${c.id})">
            ✏️ Sửa Chapter
          </button>
          <button class="btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.78rem; color: #ef4444;" onclick="deleteUploaderChapter(${c.id}, ${storyId})">
            Xóa
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    panel.innerHTML = '<p style="color: #ef4444">Không thể tải danh sách chương.</p>';
  }
}

async function openEditChapter(chapterId) {
  try {
    const res = await fetch(`/api/uploader/chapters/${chapterId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const chap = await res.json();
    if (!res.ok) return showToast('❌ ' + (chap.message || 'Lỗi tải chapter'));

    const form = document.getElementById('uploaderEditChapterForm');
    document.getElementById('editChapterId').value = chap.id;
    document.getElementById('editChapterStoryId').value = chap.story_id;
    document.getElementById('editChapterNumberDisplay').textContent = `Chương ${chap.chapter_number}`;
    document.getElementById('editChapterNumber').value = chap.chapter_number;
    document.getElementById('editChapterTitle').value = chap.title || '';

    // Image URLs list
    const urls = (chap.images || []).map(img => img.image_url).join('\n');
    document.getElementById('editChapterImagesUrls').value = urls;
    clearChapterUploadFiles('edit');

    form.style.display = 'flex';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    showToast('❌ Không thể tải thông tin chương');
  }
}

function closeEditChapterForm() {
  const form = document.getElementById('uploaderEditChapterForm');
  if (form) form.style.display = 'none';
  clearChapterUploadFiles('edit');
}

async function handleUpdateChapterSubmit(e) {
  e.preventDefault();
  const chapterId = document.getElementById('editChapterId').value;
  const storyId = document.getElementById('editChapterStoryId').value;
  const chapter_number = document.getElementById('editChapterNumber').value;
  const title = document.getElementById('editChapterTitle').value.trim();
  const rawImages = document.getElementById('editChapterImagesUrls').value;

  const images = rawImages
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const formData = new FormData();
  formData.append('chapter_number', chapter_number);
  formData.append('title', title);
  formData.append('images', JSON.stringify(images));
  chapterUploadFiles.edit.forEach((file) => formData.append('chapter_images', file));

  try {
    const res = await fetch(`/api/uploader/chapters/${chapterId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) return showToast('❌ ' + (data.message || 'Lỗi cập nhật chương'));

    showToast('✅ Đã cập nhật chương thành công!');
    closeEditChapterForm();
    openManageChapters(storyId);
  } catch (err) {
    showToast('❌ Lỗi kết nối khi cập nhật chương');
  }
}

async function deleteUploaderChapter(chapterId, storyId) {
  if (!confirm('Bạn có chắc chắn muốn xóa chương này không? Toàn bộ ảnh của chương sẽ bị xóa.')) return;

  try {
    const res = await fetch(`/api/uploader/chapters/${chapterId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (!res.ok) return showToast('❌ ' + (data.message || 'Lỗi xóa chương'));

    showToast(data.message);
    openManageChapters(storyId);
  } catch (e) {
    showToast('❌ Lỗi kết nối máy chủ');
  }
}

async function populateUploaderOptions() {
  // 1. Tải danh sách tác giả vào dropdown
  try {
    const aRes = await fetch('/authors');
    const authors = await aRes.json();
    const aSelect = document.getElementById('newStoryAuthorSelect');
    if (aSelect) {
      aSelect.innerHTML = `<option value="">-- Chọn tác giả có sẵn --</option>` + 
        authors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }
  } catch (e) {}

  // 2. Tải danh sách thể loại thành các checkbox
  const boxes = document.getElementById('newStoryCategoriesBoxes');
  if (boxes && categoriesData.length > 0) {
    boxes.innerHTML = categoriesData.map(c => `
      <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; cursor: pointer; background: var(--bg-card); padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid var(--border-color);">
        <input type="checkbox" name="uploaderCat" value="${c.id}" />
        <span>${c.name}</span>
      </label>
    `).join('');
  }
}

async function populateUploaderStorySelect(selectedStoryId = null) {
  const sSelect = document.getElementById('chapStorySelect');
  if (!sSelect) return;

  try {
    const res = await fetch('/api/uploader/my-stories', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const stories = await res.json();
    sSelect.innerHTML = stories.map(s => `
      <option value="${s.id}" ${s.id == selectedStoryId ? 'selected' : ''}>
        ${s.title} (Hiện có ${s.total_chapters || 0} chương)
      </option>
    `).join('');
  } catch (e) {}
}

function quickAddChapterToStory(storyId) {
  switchUploaderTab('chapter');
  populateUploaderStorySelect(storyId);
}

async function handleCreateStorySubmit(e) {
  e.preventDefault();
  const title = document.getElementById('newStoryTitle').value.trim();
  const other_name = document.getElementById('newStoryOtherName').value.trim();
  const author_id = document.getElementById('newStoryAuthorSelect').value;
  const new_author_name = document.getElementById('newStoryNewAuthor').value.trim();
  const status = document.getElementById('newStoryStatus').value;
  const origin_country = document.getElementById('newStoryCountry').value;
  const age_limit = document.getElementById('newStoryAgeLimit').value;
  const cover_image = document.getElementById('newStoryCover').value.trim();
  const coverFile = document.getElementById('newStoryCoverFile').files[0];
  const description = document.getElementById('newStoryDesc').value.trim();

  // Thu thập các thể loại đã check
  const catBoxes = document.querySelectorAll('input[name="uploaderCat"]:checked');
  const category_ids = Array.from(catBoxes).map(b => parseInt(b.value, 10));
  const formData = new FormData();
  formData.append('title', title);
  formData.append('other_name', other_name);
  formData.append('author_id', author_id);
  formData.append('new_author_name', new_author_name);
  formData.append('category_ids', JSON.stringify(category_ids));
  formData.append('status', status);
  formData.append('origin_country', origin_country);
  formData.append('age_limit', age_limit);
  formData.append('cover_image', cover_image);
  formData.append('description', description);
  if (coverFile) formData.append('cover_file', coverFile);

  try {
    const res = await fetch('/api/uploader/stories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Không thể tạo truyện'));
      return;
    }

    if (currentUser && (currentUser.role_name === 'Admin' || currentUser.role_id === 1)) {
      showToast('Đã tạo truyện mới thành công! (Quyền Admin tự động duyệt)');
    } else {
      showToast('Đã gửi truyện thành công! Đang chờ Admin duyệt trước khi hiển thị ra trang chủ.');
    }

    document.getElementById('uploaderCreateStoryForm').reset();
    loadStories(); // Tải lại lưới truyện ngoài trang chủ
    switchUploaderTab('stories');
    if (currentUser && (currentUser.role_name === 'Admin' || currentUser.role_id === 1)) {
      checkPendingStoriesCount();
    }
  } catch (err) {
    showToast('❌ Lỗi kết nối máy chủ');
  }
}

async function handleCreateChapterSubmit(e) {
  e.preventDefault();
  const story_id = document.getElementById('chapStorySelect').value;
  const chapter_number = document.getElementById('chapNumber').value;
  const title = document.getElementById('chapTitle').value.trim();
  const rawImages = document.getElementById('chapImagesUrls').value;

  const images = rawImages
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const imageFiles = chapterUploadFiles.create;

  if (imageFiles.length > 200) {
    showToast('❌ Chỉ được tải lên tối đa 200 ảnh cho mỗi chương');
    return;
  }

  const formData = new FormData();
  formData.append('story_id', story_id);
  formData.append('chapter_number', chapter_number);
  formData.append('title', title);
  formData.append('images', JSON.stringify(images));
  imageFiles.forEach((file) => formData.append('chapter_images', file));

  try {
    const res = await fetch('/api/uploader/chapters', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Không thể đăng chương'));
      return;
    }

    showToast(`Đã xuất bản Chương ${chapter_number} thành công!`);
    document.getElementById('uploaderCreateChapterForm').reset();
    clearChapterUploadFiles('create');
    switchUploaderTab('stories');
  } catch (err) {
    showToast('❌ Lỗi kết nối khi đăng chương');
  }
}

async function deleteUploaderStory(storyId) {
  if (!confirm('Bạn có chắc chắn muốn xóa bộ truyện này cùng toàn bộ các chương liên quan không?')) {
    return;
  }

  try {
    const res = await fetch(`/api/uploader/stories/${storyId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Xóa thất bại'));
      return;
    }
    showToast(data.message);
    loadUploaderStories();
    loadStories();
  } catch (e) {
    showToast('❌ Lỗi khi xóa truyện');
  }
}

// ==========================================================================
// 11. PHÂN HỆ QUẢN TRỊ ADMIN (DASHBOARD & MODERATION)
// ==========================================================================

function openAdminModal() {
  if (!authToken || (currentUser.role_name !== 'Admin' && currentUser.role_id !== 1)) {
    showToast('⛔ Chỉ tài khoản quyền Admin mới có thể truy cập!');
    return;
  }
  showAppPage('adminPageView');
  window.history.pushState({ view: 'admin' }, '', '/quan-tri');
  switchAdminTab('stats');
}

function closeAdminModal() {
  navigateToHome();
}

function switchAdminTab(tab) {
  const tabStats = document.getElementById('adminTabStats');
  const tabModeration = document.getElementById('adminTabModeration');
  const tabUsers = document.getElementById('adminTabUsers');
  const tabComments = document.getElementById('adminTabComments');
  const tabTaxonomy = document.getElementById('adminTabTaxonomy');

  const panelStats = document.getElementById('adminStatsPanel');
  const panelModeration = document.getElementById('adminModerationPanel');
  const panelUsers = document.getElementById('adminUsersPanel');
  const panelComments = document.getElementById('adminCommentsPanel');
  const panelTaxonomy = document.getElementById('adminTaxonomyPanel');

  [tabStats, tabModeration, tabUsers, tabComments, tabTaxonomy].filter(Boolean).forEach(t => t.classList.remove('active'));
  [panelStats, panelModeration, panelUsers, panelComments, panelTaxonomy].filter(Boolean).forEach(p => p.style.display = 'none');

  if (tab === 'stats') {
    if (tabStats) tabStats.classList.add('active');
    if (panelStats) panelStats.style.display = 'block';
    loadAdminStats();
    checkPendingStoriesCount();
  } else if (tab === 'moderation') {
    if (tabModeration) tabModeration.classList.add('active');
    if (panelModeration) panelModeration.style.display = 'block';
    loadAdminModeration();
  } else if (tab === 'users') {
    if (tabUsers) tabUsers.classList.add('active');
    if (panelUsers) panelUsers.style.display = 'block';
    loadAdminUsers();
  } else if (tab === 'comments') {
    if (tabComments) tabComments.classList.add('active');
    if (panelComments) panelComments.style.display = 'block';
    loadAdminComments();
  } else if (tab === 'taxonomy') {
    if (tabTaxonomy) tabTaxonomy.classList.add('active');
    if (panelTaxonomy) panelTaxonomy.style.display = 'block';
    loadAdminTaxonomy();
  }
}

async function checkPendingStoriesCount() {
  if (!authToken) return;
  try {
    const res = await fetch('/api/admin/stories/moderation', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const list = await res.json();
      const pending = list.filter(s => s.approval_status === 'Chờ duyệt');
      const badge = document.getElementById('adminPendingBadge');
      if (badge) {
        if (pending.length > 0) {
          badge.textContent = pending.length;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (e) {}
}

async function loadAdminModeration() {
  const panel = document.getElementById('adminModerationPanel');
  if (!panel) return;
  panel.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1.5rem;">Đang tải danh sách kiểm duyệt truyện...</p>';

  try {
    const res = await fetch('/api/admin/stories/moderation', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const stories = await res.json();

    if (!stories || stories.length === 0) {
      panel.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Hiện chưa có truyện nào trong hệ thống kiểm duyệt.</p>';
      return;
    }

    panel.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${stories.map(s => {
          let badgeColor = '#f59e0b';
          let badgeBg = 'rgba(245, 158, 11, 0.15)';
          if (s.approval_status === 'Đã duyệt') {
            badgeColor = '#10b981';
            badgeBg = 'rgba(16, 185, 129, 0.15)';
          } else if (s.approval_status === 'Từ chối') {
            badgeColor = '#ef4444';
            badgeBg = 'rgba(239, 68, 68, 0.15)';
          }

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.9rem; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); gap: 1rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <img src="${s.cover_image || '/images/covers/default-cover.svg'}" style="width: 48px; height: 64px; border-radius: 4px; object-fit: cover;" ${imageFallbackAttribute} />
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <strong style="font-size: 1rem; color: var(--text-primary);">${escapeHtml(s.title)}</strong>
                    <span style="font-size: 0.75rem; color: ${badgeColor}; background: ${badgeBg}; padding: 0.15rem 0.55rem; border-radius: 9999px; font-weight: 600;">
                      ${s.approval_status || 'Chờ duyệt'}
                    </span>
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">
                    Người đăng: <strong style="color: var(--text-primary);">${s.uploader_name || 'Uploader'}</strong> • Tác giả: ${s.author_name || 'Chưa rõ'}
                  </div>
                  <div style="font-size: 0.78rem; color: var(--accent-secondary); margin-top: 0.2rem;">
                    Thể loại: ${s.category_names || 'Manga/Manhwa'} • Ngày gửi: ${new Date(s.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                ${s.approval_status !== 'Đã duyệt' ? `
                  <button class="btn-primary" style="background: #10b981; padding: 0.38rem 0.85rem; font-size: 0.8rem;" onclick="adminUpdateStoryApproval(${s.id}, 'Đã duyệt')">
                    ✅ Duyệt Truyện
                  </button>
                ` : ''}
                ${s.approval_status !== 'Từ chối' ? `
                  <button class="btn-secondary" style="color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 0.38rem 0.85rem; font-size: 0.8rem;" onclick="adminUpdateStoryApproval(${s.id}, 'Từ chối')">
                    ❌ Từ Chối
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    panel.innerHTML = '<p style="color: #ef4444">Không thể tải danh sách kiểm duyệt.</p>';
  }
}

async function adminUpdateStoryApproval(storyId, status) {
  try {
    const res = await fetch(`/api/admin/stories/${storyId}/approval`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ approval_status: status })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Lỗi cập nhật'));
      return;
    }
    showToast(`✅ Đã cập nhật truyện sang: ${status}`);
    loadAdminModeration();
    checkPendingStoriesCount();
    loadStories(); // Tải lại danh sách truyện trang chủ
  } catch (e) {
    showToast('❌ Lỗi kết nối máy chủ');
  }
}

async function loadAdminUsers() {
  const panel = document.getElementById('adminUsersPanel');
  panel.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1.5rem;">Đang tải danh sách người dùng...</p>';

  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const users = await res.json();

    panel.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color); text-align: left; color: var(--text-secondary);">
            <th style="padding: 0.6rem;">ID</th>
            <th style="padding: 0.6rem;">Tài Khoản</th>
            <th style="padding: 0.6rem;">Email</th>
            <th style="padding: 0.6rem;">Phân Quyền (RBAC)</th>
            <th style="padding: 0.6rem; text-align: right;">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.6rem;">#${u.id}</td>
              <td style="padding: 0.6rem;">
                <strong>${escapeHtml(u.username)}</strong>
                ${u.is_banned ? '<span style="display:inline-block; font-size:0.72rem; color:#ef4444; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:0.1rem 0.4rem; border-radius:4px; margin-left:0.4rem;">Đã Khóa</span>' : ''}
              </td>
              <td style="padding: 0.6rem; color: var(--text-muted);">${escapeHtml(u.email)}</td>
              <td style="padding: 0.6rem;">
                <select onchange="adminUpdateRole(${u.id}, this.value)" style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.3rem 0.5rem; outline: none;">
                  <option value="1" ${u.role_id === 1 ? 'selected' : ''}>Admin</option>
                  <option value="2" ${u.role_id === 2 ? 'selected' : ''}>Uploader</option>
                  <option value="3" ${u.role_id === 3 ? 'selected' : ''}>Reader/User</option>
                </select>
              </td>
              <td style="padding: 0.6rem; text-align: right;">
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                  <button class="btn-secondary" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; color: ${u.is_banned ? '#10b981' : '#f59e0b'};" onclick="adminToggleBanUser(${u.id}, ${u.is_banned ? 0 : 1})">
                    ${u.is_banned ? 'Mở Khóa' : 'Khóa TK'}
                  </button>
                  <button class="btn-secondary" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; color: #ef4444;" onclick="adminDeleteUser(${u.id})">
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    panel.innerHTML = '<p style="color: #ef4444">Không thể tải danh sách người dùng.</p>';
  }
}

async function adminToggleBanUser(userId, newBannedStatus) {
  const actionText = newBannedStatus ? 'khóa tài khoản' : 'mở khóa tài khoản';
  if (!confirm(`Bạn có chắc chắn muốn ${actionText} ID #${userId}?`)) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ is_banned: newBannedStatus })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.message || 'Lỗi thao tác'));
      return;
    }
    showToast('✅ ' + data.message);
    loadAdminUsers();
  } catch (e) {
    showToast('❌ Lỗi kết nối máy chủ');
  }
}

async function adminUpdateRole(userId, newRoleId) {
  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ role_id: newRoleId })
    });
    const data = await res.json();
    showToast('✅ ' + data.message);
  } catch (e) {
    showToast('❌ Lỗi cập nhật phân quyền');
  }
}

async function adminDeleteUser(userId) {
  if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản ID #${userId}?`)) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + data.message);
      return;
    }
    showToast(data.message);
    loadAdminUsers();
  } catch (e) {
    showToast('❌ Lỗi khi xóa người dùng');
  }
}

async function loadAdminComments() {
  const panel = document.getElementById('adminCommentsPanel');
  panel.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1.5rem;">Đang tải bình luận...</p>';

  try {
    const res = await fetch('/api/admin/comments', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const comments = await res.json();

    if (comments.length === 0) {
      panel.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1.5rem;">Không có bình luận nào.</p>';
      return;
    }

    panel.innerHTML = comments.map(c => `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 0.85rem; border-bottom: 1px solid var(--border-color); gap: 1rem;">
        <div>
          <div style="font-size: 0.82rem; margin-bottom: 0.25rem;">
            <strong style="color: var(--text-primary);">${c.username}</strong> trên truyện <strong style="color: var(--accent-secondary);">${c.story_title}</strong>
            <span style="color: var(--text-muted); margin-left: 0.5rem;">(${new Date(c.created_at).toLocaleString('vi-VN')})</span>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-secondary);">${escapeHtml(c.content)}</div>
        </div>
        <button class="btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.75rem; color: #ef4444; flex-shrink: 0;" onclick="adminDeleteComment(${c.id})">
          Xóa Spam
        </button>
      </div>
    `).join('');
  } catch (e) {
    panel.innerHTML = '<p style="color: #ef4444">Không thể tải bình luận.</p>';
  }
}

async function adminDeleteComment(commentId) {
  if (!confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;

  try {
    const res = await fetch(`/api/admin/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    showToast(data.message);
    loadAdminComments();
  } catch (e) {
    showToast('❌ Lỗi khi xóa bình luận');
  }
}

async function loadAdminTaxonomy() {
  const catList = document.getElementById('adminCategoriesList');
  const authList = document.getElementById('adminAuthorsList');

  try {
    const [cRes, aRes] = await Promise.all([fetch('/categories'), fetch('/authors')]);
    const categories = await cRes.json();
    const authors = await aRes.json();

    if (catList) {
      catList.innerHTML = categories.map(c => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <span>${c.name}</span>
          <button style="background: none; border: none; color: #ef4444; cursor: pointer;" onclick="adminDeleteCategory(${c.id})">✕</button>
        </div>
      `).join('');
    }

    if (authList) {
      authList.innerHTML = authors.map(a => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <span>${a.name}</span>
          <button style="background: none; border: none; color: #ef4444; cursor: pointer;" onclick="adminDeleteAuthor(${a.id})">✕</button>
        </div>
      `).join('');
    }
  } catch (e) {}
}

async function adminAddCategory() {
  const input = document.getElementById('adminNewCatName');
  const name = input ? input.value.trim() : '';
  if (!name) return;

  try {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) return showToast('❌ ' + data.message);
    input.value = '';
    showToast('✅ Đã thêm thể loại: ' + name);
    loadAdminTaxonomy();
    loadCategories();
  } catch (e) {
    showToast('❌ Lỗi khi thêm thể loại');
  }
}

async function adminDeleteCategory(id) {
  if (!confirm('Xóa thể loại này?')) return;
  try {
    await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    showToast('Đã xóa thể loại');
    loadAdminTaxonomy();
    loadCategories();
  } catch (e) {}
}

async function adminAddAuthor() {
  const input = document.getElementById('adminNewAuthorName');
  const name = input ? input.value.trim() : '';
  if (!name) return;

  try {
    const res = await fetch('/api/admin/authors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) return showToast('❌ ' + data.message);
    input.value = '';
    showToast('✅ Đã thêm tác giả: ' + name);
    loadAdminTaxonomy();
  } catch (e) {
    showToast('❌ Lỗi khi thêm tác giả');
  }
}

async function adminDeleteAuthor(id) {
  if (!confirm('Xóa tác giả này?')) return;
  try {
    await fetch(`/api/admin/authors/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    showToast('Đã xóa tác giả');
    loadAdminTaxonomy();
  } catch (e) {}
}
