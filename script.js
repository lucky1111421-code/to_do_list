document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#taskForm");
  const input = document.querySelector("#taskInput");
  const prioritySelect = document.querySelector("#prioritySelect");
  const searchInput = document.querySelector("#searchInput");
  const list = document.querySelector("#taskList");
  const empty = document.querySelector("#empty");
  const countEl = document.querySelector("#count");
  const remainingEl = document.querySelector("#remaining");
  const clearDoneBtn = document.querySelector("#clearDone");
  const resetDefaultsBtn = document.querySelector("#resetDefaults");
  const todayEl = document.querySelector("#today");

  // Date banner
  if (todayEl) {
    todayEl.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    }).format(new Date());
  }

  // Pre-fed sample default tasks
  const DEFAULT_TASKS = [
    {
      id: 1,
      text: "Finish Ayush's portfolio showcase & responsive styling",
      priority: "high",
      done: true,
      createdAt: Date.now() - 3600000 * 5
    },
    {
      id: 2,
      text: "Solve daily LeetCode medium problem on trees/graphs",
      priority: "high",
      done: false,
      createdAt: Date.now() - 3600000 * 3
    },
    {
      id: 3,
      text: "Build movie discovery app with pre-fed catalog",
      priority: "medium",
      done: true,
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: 4,
      text: "Review Node.js REST API routes and MongoDB aggregation pipeline",
      priority: "medium",
      done: false,
      createdAt: Date.now() - 3600000 * 1
    },
    {
      id: 5,
      text: "Design AI chatbot conversational prompt flows",
      priority: "low",
      done: false,
      createdAt: Date.now()
    }
  ];

  const STORAGE_KEY = "taskflow-tasks-v2";

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
      return [...DEFAULT_TASKS];
    }
    try {
      return JSON.parse(raw) || [];
    } catch {
      return [...DEFAULT_TASKS];
    }
  }

  let tasks = loadTasks();
  let currentFilter = "all";
  let searchQuery = "";
  let editingTaskId = null;

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    render();
  }

  function render() {
    list.innerHTML = "";

    const filtered = tasks.filter((t) => {
      const matchesFilter =
        currentFilter === "all" ||
        (currentFilter === "active" && !t.done) ||
        (currentFilter === "done" && t.done);

      const matchesSearch =
        !searchQuery ||
        t.text.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });

    filtered.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.done ? "done" : ""}`;
      li.dataset.id = task.id;

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", "Mark task as completed");
      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        save();
      });

      if (editingTaskId === task.id) {
        // Edit mode
        const editInput = document.createElement("input");
        editInput.type = "text";
        editInput.className = "edit-input";
        editInput.value = task.text;
        editInput.maxLength = 120;

        function commitEdit() {
          const val = editInput.value.trim();
          if (val) {
            task.text = val;
          }
          editingTaskId = null;
          save();
        }

        editInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") {
            editingTaskId = null;
            render();
          }
        });

        editInput.addEventListener("blur", commitEdit);

        li.append(checkbox, editInput);
        setTimeout(() => editInput.focus(), 10);
      } else {
        // Normal mode
        const span = document.createElement("span");
        span.className = "task-content";
        span.textContent = task.text;
        span.title = "Double-click to edit";
        span.addEventListener("dblclick", () => {
          editingTaskId = task.id;
          render();
        });

        // Priority tag
        const priorityTag = document.createElement("span");
        priorityTag.className = `priority-tag priority-${task.priority || "medium"}`;
        priorityTag.textContent = task.priority || "medium";

        // Actions
        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "icon-btn";
        editBtn.textContent = "✏️";
        editBtn.title = "Edit task";
        editBtn.setAttribute("aria-label", "Edit task");
        editBtn.addEventListener("click", () => {
          editingTaskId = task.id;
          render();
        });

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "icon-btn delete-btn";
        delBtn.textContent = "🗑";
        delBtn.title = "Delete task";
        delBtn.setAttribute("aria-label", "Delete task");
        delBtn.addEventListener("click", () => {
          tasks = tasks.filter((x) => x.id !== task.id);
          save();
        });

        actions.append(editBtn, delBtn);
        li.append(checkbox, span, priorityTag, actions);
      }

      list.append(li);
    });

    // Update empty state
    empty.hidden = filtered.length > 0;

    // Update count labels
    const activeCount = tasks.filter((t) => !t.done).length;
    countEl.textContent = `${filtered.length} task${filtered.length === 1 ? "" : "s"}`;
    remainingEl.textContent = `${activeCount} item${activeCount === 1 ? "" : "s"} left`;
  }

  // Add task submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    tasks.unshift({
      id: Date.now(),
      text,
      priority: prioritySelect.value || "medium",
      done: false,
      createdAt: Date.now()
    });

    input.value = "";
    save();
  });

  // Filter tabs
  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll(".filter").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      render();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      render();
    });
  }

  // Clear completed
  clearDoneBtn.addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.done);
    save();
  });

  // Reset to default sample tasks
  resetDefaultsBtn.addEventListener("click", () => {
    tasks = [...DEFAULT_TASKS];
    save();
  });

  render();
});