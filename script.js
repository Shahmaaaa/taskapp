// =============================================
// Taskify — Dynamic To-Do Application
// =============================================

(function () {
  'use strict';

  // ---- DOM References ----
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const appFooter = document.getElementById('app-footer');
  const itemsLeftEl = document.getElementById('items-left');
  const clearCompletedBtn = document.getElementById('clear-completed');

  const statTotal = document.querySelector('#stat-total .stat-number');
  const statActive = document.querySelector('#stat-active .stat-number');
  const statCompleted = document.querySelector('#stat-completed .stat-number');

  const filterButtons = document.querySelectorAll('.filter-btn');

  // ---- State ----
  const STORAGE_KEY = 'taskify_tasks';
  let tasks = loadTasks();
  let currentFilter = 'all';

  // ---- Local Storage ----
  function loadTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // ---- Unique ID Generator ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---- Format Time ----
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ---- Add Task ----
  function addTask(text) {
    const task = {
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
  }

  // ---- Delete Task ----
  function deleteTask(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.classList.add('removing');
      el.addEventListener('animationend', () => {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
      });
    } else {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      renderTasks();
      updateStats();
    }
  }

  // ---- Toggle Task Completion ----
  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
      updateStats();
    }
  }

  // ---- Clear Completed Tasks ----
  function clearCompleted() {
    const completedEls = document.querySelectorAll('.task-item.completed');
    if (completedEls.length === 0) return;

    completedEls.forEach((el) => el.classList.add('removing'));

    // Wait for animations to finish
    setTimeout(() => {
      tasks = tasks.filter((t) => !t.completed);
      saveTasks();
      renderTasks();
      updateStats();
    }, 350);
  }

  // ---- Filter Tasks ----
  function getFilteredTasks() {
    switch (currentFilter) {
      case 'active':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  }

  // ---- Render Tasks ----
  function renderTasks() {
    const filtered = getFilteredTasks();

    taskList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      taskList.style.display = 'none';
    } else {
      emptyState.classList.add('hidden');
      taskList.style.display = 'flex';
    }

    filtered.forEach((task, index) => {
      const li = document.createElement('li');
      li.className = `task-item${task.completed ? ' completed' : ''}`;
      li.dataset.id = task.id;
      li.style.animationDelay = `${index * 0.04}s`;

      li.innerHTML = `
        <label class="task-checkbox">
          <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as ${task.completed ? 'active' : 'completed'}" />
          <span class="checkmark"></span>
        </label>
        <span class="task-text">${escapeHTML(task.text)}</span>
        <span class="task-time">${formatTime(task.createdAt)}</span>
        <button class="delete-btn" aria-label="Delete task" title="Delete task">✕</button>
      `;

      // Event: Toggle completion
      const checkbox = li.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => toggleTask(task.id));

      // Event: Delete
      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      taskList.appendChild(li);
    });

    // Show/hide footer
    if (tasks.length === 0) {
      appFooter.classList.add('hidden');
    } else {
      appFooter.classList.remove('hidden');
    }

    // Update items left
    const activeCount = tasks.filter((t) => !t.completed).length;
    itemsLeftEl.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
  }

  // ---- Update Stats with animation ----
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;

    animateStat(statTotal, total);
    animateStat(statActive, active);
    animateStat(statCompleted, completed);
  }

  function animateStat(el, value) {
    const current = parseInt(el.textContent, 10);
    if (current !== value) {
      el.textContent = value;
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 300);
    }
  }

  // ---- Escape HTML ----
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Event Listeners ----

  // Form submit — add task
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    addTask(text);
    taskInput.value = '';
    taskInput.focus();
  });

  // Filter tabs
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Clear completed
  clearCompletedBtn.addEventListener('click', clearCompleted);

  // ---- Initial Render ----
  renderTasks();
  updateStats();
})();
