/* TodoList – VibeCoding
   Fonctionnalités: ajouter, éditer, supprimer, terminer, filtres, persistance localStorage, compteurs, toggle all, clear completed */

(function() {
  'use strict';

  /** Sélecteurs DOM **/
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const template = document.getElementById('todo-item-template');
  const filterButtons = Array.from(document.querySelectorAll('.filter'));
  const countRemaining = document.getElementById('count-remaining');
  const countTotal = document.getElementById('count-total');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const toggleAllBtn = document.getElementById('toggle-all');
  const emptyState = document.getElementById('empty-state');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('.theme-icon');

  /** État de l'application **/
  const STORAGE_KEY = 'vibecoding.todos.v1';
  const FILTER_KEY = 'vibecoding.todos.filter.v1';
  const THEME_KEY = 'vibecoding.todos.theme.v1';

  /** @typedef {{ id: string, text: string, completed: boolean, createdAt: number }} Todo */
  /** @type {Todo[]} */
  let todos = [];
  /** @type {'all'|'active'|'completed'} */
  let activeFilter = 'all';
  /** @type {'dark'|'light'} */
  let currentTheme = 'dark';

  /** Utilitaires **/
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  const saveFilter = () => localStorage.setItem(FILTER_KEY, activeFilter);
  const saveTheme = () => localStorage.setItem(THEME_KEY, currentTheme);
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) todos = parsed;
    } catch (_) { todos = []; }
    const f = localStorage.getItem(FILTER_KEY);
    if (f === 'all' || f === 'active' || f === 'completed') activeFilter = f;
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'dark' || t === 'light') currentTheme = t;
  };

  const getFiltered = () => {
    switch (activeFilter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    }
  };

  const updateCounters = () => {
    const remaining = todos.filter(t => !t.completed).length;
    countRemaining.textContent = String(remaining);
    countTotal.textContent = String(todos.length);
    toggleAllBtn.classList.toggle('active', remaining === 0 && todos.length > 0);
  };

  const setActiveFilterButton = () => {
    filterButtons.forEach(btn => {
      const isActive = btn.dataset.filter === activeFilter;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
  };

  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
  };

  const toggleTheme = () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme();
    applyTheme();
  };

  /** Rendu **/
  const render = () => {
    list.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const items = getFiltered();
    for (const todo of items) {
      const node = /** @type {HTMLElement} */ (template.content.firstElementChild.cloneNode(true));
      node.dataset.id = todo.id;
      if (todo.completed) node.classList.add('completed');
      node.querySelector('.toggle').checked = todo.completed;
      node.querySelector('.item__text').textContent = todo.text;
      node.querySelector('.item__edit').value = todo.text;
      fragment.appendChild(node);
    }
    list.appendChild(fragment);
    updateCounters();
    if (emptyState) {
      const showEmpty = items.length === 0;
      emptyState.classList.toggle('hidden', !showEmpty);
    }
  };

  /** Actions **/
  const addTodo = (text) => {
    const normalized = String(text || '').trim();
    if (!normalized) return;
    todos.unshift({ id: generateId(), text: normalized, completed: false, createdAt: Date.now() });
    save();
    render();
  };

  const removeTodo = (id) => {
    const before = todos.length;
    todos = todos.filter(t => t.id !== id);
    if (todos.length !== before) { save(); render(); }
  };

  const toggleTodo = (id, checked) => {
    const t = todos.find(t => t.id === id);
    if (!t) return;
    t.completed = !!checked;
    save();
    render();
  };

  const beginEdit = (li) => {
    if (!li) return;
    li.classList.add('editing');
    const input = li.querySelector('.item__edit');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  };

  const commitEdit = (li) => {
    if (!li) return;
    const id = li.dataset.id;
    const inputEl = li.querySelector('.item__edit');
    const newText = inputEl.value.trim();
    if (!newText) { removeTodo(id); return; }
    const t = todos.find(t => t.id === id);
    if (!t) return;
    t.text = newText;
    save();
    li.classList.remove('editing');
    render();
  };

  const cancelEdit = (li) => {
    if (!li) return;
    li.classList.remove('editing');
    render();
  };

  const clearCompleted = () => {
    const hasCompleted = todos.some(t => t.completed);
    if (!hasCompleted) return;
    todos = todos.filter(t => !t.completed);
    save();
    render();
  };

  const toggleAll = () => {
    const allCompleted = todos.length > 0 && todos.every(t => t.completed);
    const next = !allCompleted;
    todos.forEach(t => t.completed = next);
    save();
    render();
  };

  /** Écouteurs **/
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = '';
  });

  list.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const li = target.closest('li.item');
    if (!li) return;
    const id = li.dataset.id;
    if (target.classList.contains('delete')) {
      removeTodo(id);
    } else if (target.classList.contains('edit')) {
      beginEdit(li);
    }
  });

  list.addEventListener('change', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.classList.contains('toggle')) {
      const li = target.closest('li.item');
      toggleTodo(li.dataset.id, /** @type {HTMLInputElement} */(target).checked);
    }
  });

  list.addEventListener('dblclick', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const li = target.closest('li.item');
    if (!li) return;
    if (target.classList.contains('item__text')) beginEdit(li);
  });

  list.addEventListener('keydown', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (!target.classList.contains('item__edit')) return;
    const li = target.closest('li.item');
    if (!li) return;
    if (e.key === 'Enter') commitEdit(li);
    if (e.key === 'Escape') cancelEdit(li);
  });

  list.addEventListener('focusout', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.classList.contains('item__edit')) {
      const li = target.closest('li.item');
      commitEdit(li);
    }
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.filter;
      if (next === activeFilter) return;
      activeFilter = /** @type {typeof activeFilter} */ (next);
      saveFilter();
      setActiveFilterButton();
      render();
    });
  });

  clearCompletedBtn.addEventListener('click', clearCompleted);
  toggleAllBtn.addEventListener('click', toggleAll);
  themeToggle.addEventListener('click', toggleTheme);

  /** Initialisation **/
  load();
  setActiveFilterButton();
  applyTheme();
  render();
})();


