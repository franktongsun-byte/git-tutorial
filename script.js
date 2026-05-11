(function () {
    'use strict';

    const STORAGE_KEY = 'todoapp.items.v1';

    const todoForm = document.getElementById('todoForm');
    const todoInput = document.getElementById('todoInput');
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    const totalCount = document.getElementById('totalCount');
    const activeCount = document.getElementById('activeCount');
    const completedCount = document.getElementById('completedCount');
    const clearBtn = document.getElementById('clearCompleted');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const dateDisplay = document.getElementById('dateDisplay');

    let todos = loadTodos();
    let currentFilter = 'all';

    function loadTodos() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveTodos() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        } catch (e) {
            console.warn('保存失败', e);
        }
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function addTodo(text) {
        const trimmed = text.trim();
        if (!trimmed) return;
        todos.unshift({
            id: generateId(),
            text: trimmed,
            completed: false,
            createdAt: Date.now()
        });
        saveTodos();
        render();
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            render();
        }
    }

    function deleteTodo(id) {
        const item = todoList.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.classList.add('removing');
            setTimeout(() => {
                todos = todos.filter(t => t.id !== id);
                saveTodos();
                render();
            }, 280);
        }
    }

    function updateTodo(id, newText) {
        const trimmed = newText.trim();
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        if (!trimmed) {
            deleteTodo(id);
            return;
        }
        todo.text = trimmed;
        saveTodos();
        render();
    }

    function clearCompleted() {
        const hasCompleted = todos.some(t => t.completed);
        if (!hasCompleted) return;
        todos = todos.filter(t => !t.completed);
        saveTodos();
        render();
    }

    function getFilteredTodos() {
        switch (currentFilter) {
            case 'active':
                return todos.filter(t => !t.completed);
            case 'completed':
                return todos.filter(t => t.completed);
            default:
                return todos;
        }
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const active = total - completed;

        totalCount.textContent = total;
        activeCount.textContent = active;
        completedCount.textContent = completed;
    }

    function createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.completed ? ' completed' : '');
        li.dataset.id = todo.id;

        const checkbox = document.createElement('div');
        checkbox.className = 'todo-checkbox' + (todo.completed ? ' checked' : '');
        checkbox.setAttribute('role', 'checkbox');
        checkbox.setAttribute('aria-checked', String(todo.completed));
        checkbox.addEventListener('click', () => toggleTodo(todo.id));

        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;
        text.title = '双击编辑';
        text.addEventListener('dblclick', () => startEdit(li, todo));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.setAttribute('aria-label', '删除任务');
        deleteBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
            </svg>
        `;
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        li.appendChild(checkbox);
        li.appendChild(text);
        li.appendChild(deleteBtn);

        return li;
    }

    function startEdit(li, todo) {
        const textEl = li.querySelector('.todo-text');
        if (!textEl) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'todo-text-edit';
        input.value = todo.text;
        input.maxLength = 100;

        li.replaceChild(input, textEl);
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);

        let committed = false;
        const commit = () => {
            if (committed) return;
            committed = true;
            updateTodo(todo.id, input.value);
        };

        const cancel = () => {
            if (committed) return;
            committed = true;
            render();
        };

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });
    }

    function render() {
        const filtered = getFilteredTodos();
        todoList.innerHTML = '';

        if (todos.length === 0) {
            emptyState.classList.add('show');
            emptyState.querySelector('.empty-text').textContent = '还没有任务';
            emptyState.querySelector('.empty-hint').textContent = '在上方输入框中添加你的第一个任务吧！';
        } else if (filtered.length === 0) {
            emptyState.classList.add('show');
            const labels = { active: '进行中', completed: '已完成' };
            emptyState.querySelector('.empty-text').textContent = `没有${labels[currentFilter] || ''}的任务`;
            emptyState.querySelector('.empty-hint').textContent = '切换其他筛选条件查看更多';
        } else {
            emptyState.classList.remove('show');
            const fragment = document.createDocumentFragment();
            filtered.forEach(todo => fragment.appendChild(createTodoElement(todo)));
            todoList.appendChild(fragment);
        }

        updateStats();
    }

    function updateDate() {
        const now = new Date();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const formatted = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · ${weekdays[now.getDay()]}`;
        dateDisplay.textContent = formatted;
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(todoInput.value);
        todoInput.value = '';
        todoInput.focus();
    });

    clearBtn.addEventListener('click', clearCompleted);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
            e.preventDefault();
            todoInput.focus();
        }
    });

    updateDate();
    render();
})();
