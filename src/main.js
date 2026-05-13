import './style.css';
import { fetchPrompts } from './parser.js';

const PAGE_SIZE = 10;

const state = {
  prompts: [],
  categories: [],
  query: '',
  category: '전체',
  page: 1,
  sort: { key: null, direction: 'asc' }
};

const SORT_KEY_MAP = {
  no: (p) => parseInt(p.no, 10) || 0,
  category: (p) => p.category || '',
  name: (p) => p.name || ''
};

const modal = {
  prompt: null,
  language: 'ko'
};

const els = {
  loading: document.getElementById('state-loading'),
  error: document.getElementById('state-error'),
  errorText: document.getElementById('state-error-text'),
  empty: document.getElementById('state-empty'),
  table: document.getElementById('prompt-table'),
  tbody: document.getElementById('prompt-tbody'),
  retry: document.getElementById('retry-button'),
  search: document.getElementById('search-input'),
  categoryChips: document.getElementById('category-chips'),
  toast: document.getElementById('toast'),
  pagination: document.getElementById('pagination'),
  prevPage: document.getElementById('prev-page'),
  nextPage: document.getElementById('next-page'),
  pageInfo: document.getElementById('page-info'),
  resultSummary: document.getElementById('result-summary'),
  modal: document.getElementById('modal'),
  modalCategory: document.getElementById('modal-category'),
  modalTitle: document.getElementById('modal-title'),
  modalSubtitle: document.getElementById('modal-subtitle'),
  modalLanguage: document.getElementById('modal-language'),
  modalBody: document.getElementById('modal-body'),
  modalClose: document.getElementById('modal-close'),
  modalCopy: document.getElementById('modal-copy'),
  themeToggle: document.getElementById('theme-toggle')
};

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  els.themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  els.themeToggle.setAttribute(
    'title',
    theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'
  );
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

function setLoading(isLoading) {
  els.loading.hidden = !isLoading;
}

function setError(message) {
  els.errorText.textContent = message || '데이터를 불러오지 못했습니다.';
  els.error.hidden = false;
  els.table.hidden = true;
  els.empty.hidden = true;
  els.pagination.hidden = true;
  els.resultSummary.hidden = true;
}

function clearError() {
  els.error.hidden = true;
}

function buildCategoryChips() {
  const set = new Set(state.prompts.map((p) => p.category).filter(Boolean));
  state.categories = ['전체', ...Array.from(set)];

  els.categoryChips.innerHTML = '';
  state.categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === state.category ? ' is-active' : '');
    chip.textContent = cat;
    chip.dataset.category = cat;
    chip.setAttribute('aria-pressed', cat === state.category ? 'true' : 'false');
    chip.addEventListener('click', () => {
      state.category = cat;
      state.page = 1;
      els.categoryChips.querySelectorAll('.chip').forEach((c) => {
        const active = c.dataset.category === cat;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      render();
    });
    els.categoryChips.appendChild(chip);
  });
}

function filterPrompts() {
  const q = state.query.trim().toLowerCase();
  return state.prompts.filter((p) => {
    const matchesCategory = state.category === '전체' || p.category === state.category;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });
}

function sortPrompts(prompts) {
  if (!state.sort.key) return prompts;
  const getter = SORT_KEY_MAP[state.sort.key];
  if (!getter) return prompts;
  const sorted = [...prompts].sort((a, b) => {
    const va = getter(a);
    const vb = getter(b);
    if (typeof va === 'number' && typeof vb === 'number') {
      return va - vb;
    }
    return String(va).localeCompare(String(vb), 'ko');
  });
  return state.sort.direction === 'desc' ? sorted.reverse() : sorted;
}

function updateSortHeaders() {
  document.querySelectorAll('.prompt-table th.sortable').forEach((th) => {
    const key = th.dataset.sort;
    th.classList.remove('is-asc', 'is-desc');
    if (state.sort.key === key) {
      th.classList.add(state.sort.direction === 'asc' ? 'is-asc' : 'is-desc');
      th.setAttribute('aria-sort', state.sort.direction === 'asc' ? 'ascending' : 'descending');
    } else {
      th.setAttribute('aria-sort', 'none');
    }
  });
}

function handleSort(key) {
  if (state.sort.key === key) {
    if (state.sort.direction === 'asc') {
      state.sort.direction = 'desc';
    } else {
      state.sort = { key: null, direction: 'asc' };
    }
  } else {
    state.sort = { key, direction: 'asc' };
  }
  state.page = 1;
  updateSortHeaders();
  render();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function renderRows(rows) {
  if (rows.length === 0) {
    els.table.hidden = true;
    els.empty.hidden = false;
    return;
  }
  els.empty.hidden = true;
  els.table.hidden = false;

  els.tbody.innerHTML = rows
    .map(
      (p, index) => `
        <tr data-index="${index}">
          <td class="col-no" data-label="No.">${escapeHtml(p.no)}</td>
          <td class="col-category" data-label="카테고리"><span class="category-tag">${escapeHtml(
            p.category
          )}</span></td>
          <td class="col-name" data-label="프롬프트 이름">${escapeHtml(p.name)}</td>
          <td class="col-desc" data-label="설명">${escapeHtml(p.description)}</td>
          <td class="col-prompt" data-label="프롬프트(한글)">
            ${renderPromptCell(p, 'ko', index)}
          </td>
          <td class="col-prompt" data-label="프롬프트(영문)">
            ${renderPromptCell(p, 'en', index)}
          </td>
          <td class="col-updated" data-label="최종 수정일">${escapeHtml(p.updatedAt || '—')}</td>
        </tr>`
    )
    .join('');

  els.tbody.querySelectorAll('.prompt-cell').forEach((cell) => {
    cell.addEventListener('click', (e) => {
      const idx = Number(cell.dataset.index);
      const lang = cell.dataset.lang;
      openModal(rows[idx], lang);
    });
  });

  els.tbody.querySelectorAll('.cell-copy').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.index);
      const lang = btn.dataset.lang;
      copyText(rows[idx][lang]);
    });
  });
}

function renderPromptCell(prompt, lang, index) {
  const text = prompt[lang] || '';
  if (!text) {
    return `<div class="prompt-cell prompt-cell--empty" aria-disabled="true">—</div>`;
  }
  return `
    <div class="prompt-cell" data-index="${index}" data-lang="${lang}" role="button" tabindex="0">
      <p class="prompt-preview">${escapeHtml(text)}</p>
      <button class="cell-copy" type="button" data-index="${index}" data-lang="${lang}" aria-label="${
    lang === 'ko' ? '한글' : '영문'
  } 프롬프트 복사">
        <span aria-hidden="true">📋</span><span class="cell-copy-label">복사</span>
      </button>
    </div>`;
}

function renderPagination(totalPages, total, currentStart, currentCount) {
  if (totalPages <= 1) {
    els.pagination.hidden = true;
    return;
  }
  els.pagination.hidden = false;
  const endIndex = currentStart + currentCount;
  els.pageInfo.textContent = `${state.page} / ${totalPages}  ·  ${currentStart + 1}–${endIndex} / ${total}`;
  els.prevPage.disabled = state.page <= 1;
  els.nextPage.disabled = state.page >= totalPages;
}

function renderResultSummary(totalAll, totalFiltered, totalPages, currentStart, currentCount) {
  if (totalAll === 0) {
    els.resultSummary.hidden = true;
    els.resultSummary.textContent = '';
    return;
  }
  els.resultSummary.hidden = false;
  if (totalFiltered === 0) {
    els.resultSummary.textContent = `전체 ${totalAll}개 · 검색 결과 없음`;
    return;
  }
  const startIndex = currentStart + 1;
  const endIndex = currentStart + currentCount;
  els.resultSummary.textContent = `${currentCount}개 표시 · 전체 ${totalFiltered}개 · ${startIndex}–${endIndex}번째 · ${state.page}/${totalPages}페이지`;
}

function render() {
  const filtered = filterPrompts();
  const sorted = sortPrompts(filtered);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);

  renderRows(rows);
  renderPagination(totalPages, total, start, rows.length);
  renderResultSummary(state.prompts.length, total, totalPages, start, rows.length);
}

async function copyText(text) {
  if (!text) {
    showToast('복사할 내용이 없습니다.', true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('복사되었습니다');
  } catch (err) {
    const ok = fallbackCopy(text);
    if (ok) {
      showToast('복사되었습니다');
    } else {
      showToast('복사에 실패했습니다.', true);
    }
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

let toastTimer = null;
function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle('is-error', isError);
  els.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('is-visible');
  }, 1500);
}

function openModal(prompt, lang) {
  modal.prompt = prompt;
  modal.language = lang;
  els.modalCategory.textContent = prompt.category || '';
  els.modalTitle.textContent = prompt.name || '';
  els.modalSubtitle.textContent = prompt.description || '';
  els.modalLanguage.textContent = lang === 'ko' ? '프롬프트(한글)' : '프롬프트(영문)';
  els.modalBody.textContent = prompt[lang] || '';
  els.modal.hidden = false;
  document.body.classList.add('no-scroll');
  els.modalClose.focus();
}

function closeModal() {
  els.modal.hidden = true;
  document.body.classList.remove('no-scroll');
  modal.prompt = null;
}

function bindEvents() {
  els.search.addEventListener('input', (e) => {
    state.query = e.target.value;
    state.page = 1;
    render();
  });

  els.retry.addEventListener('click', () => {
    loadPrompts();
  });

  els.prevPage.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  els.nextPage.addEventListener('click', () => {
    state.page += 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  els.modalClose.addEventListener('click', closeModal);
  els.modal.addEventListener('click', (e) => {
    if (e.target.dataset.close === 'true') closeModal();
  });
  els.modalCopy.addEventListener('click', () => {
    if (modal.prompt) {
      copyText(modal.prompt[modal.language]);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.modal.hidden) closeModal();
  });

  els.tbody.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('prompt-cell')) {
      e.preventDefault();
      e.target.click();
    }
  });

  els.themeToggle.addEventListener('click', toggleTheme);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  document.querySelectorAll('.prompt-table th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      handleSort(th.dataset.sort);
    });
  });
}

async function loadPrompts() {
  clearError();
  setLoading(true);
  els.table.hidden = true;
  els.empty.hidden = true;
  els.pagination.hidden = true;
  els.resultSummary.hidden = true;
  try {
    const prompts = await fetchPrompts();
    state.prompts = prompts;
    state.page = 1;
    buildCategoryChips();
    render();
  } catch (err) {
    console.error(err);
    setError(err.message || '데이터를 불러오지 못했습니다.');
  } finally {
    setLoading(false);
  }
}

applyTheme(getInitialTheme());
bindEvents();
loadPrompts();
