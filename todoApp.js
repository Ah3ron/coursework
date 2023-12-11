class UIElement {
  constructor(elementType, className) {
    this.element = document.createElement(elementType);
    if (className) this.element.className = className;
  }

  render(parentElement) {
    parentElement.appendChild(this.element);
  }
}

export class TodoApp {
  constructor() {
    this.todoList = [];
    this.appContainer = document.querySelector("#app");

    this.renderHeader();
    this.loadTasksFromLocalStorage(); // Load tasks from localStorage

    this.renderTaskForm();
    this.renderTaskPanel();
    this.renderTaskList();
  }

  renderHeader() {
    const header = new UIElement("h1", "app-header");
    header.element.textContent = "Todo App";
    this.appContainer.appendChild(header.element);
  }
  renderTaskForm() {
    const form = new TaskForm(
      this.addTask.bind(this),
      this.appContainer
    );
    form.render(this.appContainer);
  }

  renderTaskList() {
    const oldList = document.querySelector(".todo-list") || null;
    const newList = new TodoList(
      this.todoList,
      this.deleteTask.bind(this),
      this.editTask.bind(this),
      this.toggleComplete.bind(this)
    );

    if (oldList !== null) {
      oldList.remove();
    }
    newList.render(this.appContainer);
  }

  renderTaskPanel() {
    const panel = document.querySelector(".todo-panel") || null;
    if (panel !== null) {
      panel.remove();
    }

    const taskPanel = new TaskPanel(this.todoList);
    taskPanel.render(this.appContainer);
  }

  addTask(task) {
    this.todoList.push(task);
    this.saveTasksToLocalStorage(); // Save tasks to localStorage
    this.renderTaskPanel();
    this.renderTaskList();
  }

  deleteTask(index) {
    this.todoList.splice(index, 1);
    this.saveTasksToLocalStorage(); // Save tasks to localStorage
    this.renderTaskPanel();
    this.renderTaskList();
  }

  toggleComplete(index) {
    this.todoList[index].isCompleted = !this.todoList[index].isCompleted;
    this.saveTasksToLocalStorage(); // Save tasks to localStorage
    this.renderTaskPanel();
    this.renderTaskList();
  }

  editTask(index) {
    const editContainer = new EditContainer(
      this.todoList[index].description,
      (newDescription) => this.handleEdit(index, newDescription)
    );
    editContainer.show();
    this.saveTasksToLocalStorage(); // Save tasks to localStorage
    this.renderTaskList();
  }

  handleEdit(index, newDescription) {
    this.todoList[index].description = newDescription;
    this.renderTaskList();
  }

  saveTasksToLocalStorage() {
    localStorage.setItem('todoList', JSON.stringify(this.todoList));
  }

  loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('todoList');
    if (storedTasks) {
      this.todoList = JSON.parse(storedTasks);
      this.renderTaskList();
      this.renderTaskPanel();
    }
  }
}

class TaskFormUI extends UIElement {
  constructor(onSubmit, appContainer, className) {
    super("div", className);
    this.input = new UIElement("input", "input-text").element;
    this.input.placeholder = "Enter a new task";
    this.onSubmit = onSubmit;
    this.appContainer = appContainer;

    this.element.appendChild(this.input);

    const addButton = new Button("Add", () => this.handleFormSubmit(), "button form__button-submit");
    addButton.render(this.element);
  }

  handleFormSubmit() {
    const description = this.input.value.trim();
    if (description !== "") {
      this.onSubmit(new Task(description));
      this.input.value = "";
    }
  }
}

class TaskForm extends TaskFormUI {
  constructor(onSubmit, appContainer) {
    super(onSubmit, appContainer, "form");
  }

  render(parentElement) {
    super.render(parentElement);
    this.appContainer.appendChild(this.element);
  }
}

class TaskPanel extends UIElement {
  constructor(todoList, className) {
    super("div", className);
    this.todoList = todoList;
    this.renderPanel();
  }

  renderPanel() {
    this.element.className = "todo-panel";
    const totalTasks = this.todoList.length;
    const completedTasks = this.todoList.filter(task => task.isCompleted).length;

    const panelText = `Total Tasks: ${totalTasks} | Completed Tasks: ${completedTasks}`;
    this.element.textContent = panelText;
  }

  render(parentElement) {
    this.renderPanel();
    parentElement.appendChild(this.element);
  }
}

class TodoListUI extends UIElement {
  constructor(className) {
    super("div", className);
  }
}

class TodoList extends TodoListUI {
  constructor(todoList, onDelete, onEdit, onToggleComplete) {
    super("todo-list");

    todoList.forEach((task, index) => {
      const todoItem = new TodoItem(task, index, onDelete, onEdit, onToggleComplete);
      this.element.appendChild(todoItem.element);
    });
  }
}

class TodoItemUI extends UIElement {
  constructor(className) {
    super("div", className);
  }
}

class TodoItem extends TodoItemUI {
  constructor(task, index, onDelete, onEdit, onToggleComplete) {
    super("todo-item");

    const completeCheckbox = new Checkbox(
      task.isCompleted,
      () => onToggleComplete(index),
      "checkbox todo-item__complete-button"
    );
    completeCheckbox.render(this.element);

    if (task.isCompleted) {
      this.element.classList.add("todo-item__completed");
    }

    const descriptionElement = new UIElement("span", "todo-item__text");
    descriptionElement.element.textContent = task.description;
    this.element.appendChild(descriptionElement.element);

    const controls = new UIElement("div", "todo-item__controls");
    this.element.appendChild(controls.element);

    const editButton = new Button("Edit", () => onEdit(index), "button todo-item__edit-button");
    const deleteButton = new Button("Delete", () => onDelete(index), "button todo-item__delete-button");

    // Disable buttons for completed tasks
    if (task.isCompleted) {
      editButton.element.disabled = true;
    }

    editButton.render(controls.element);
    deleteButton.render(controls.element);
  }
}

class EditContainer {
  constructor(initialValue, onSubmit) {
    // Create a background overlay
    this.overlay = document.createElement("div");
    this.overlay.className = "edit-overlay";
    document.body.appendChild(this.overlay);

    // Create the edit container
    this.container = document.createElement("div");
    this.container.className = "edit-dialog";

    this.input = document.createElement("input");
    this.input.className = "input-text edit-dialog__input";
    this.input.value = initialValue;

    this.submitButton = new Button("Save", () => this.handleSubmit(), "button edit-dialog__submit-button");
    this.cancelButton = new Button("Cancel", () => this.hide(), "button edit-dialog__cancel-button");

    this.onSubmit = onSubmit;

    this.container.appendChild(this.input);

    const controls = document.createElement("div");
    controls.className = "edit-dialog__controls";

    controls.appendChild(this.cancelButton.element);
    controls.appendChild(this.submitButton.element);
    this.container.appendChild(controls);

    document.body.appendChild(this.container);

    this.show();
  }

  show() {
    this.overlay.style.display = "block";
    this.container.style.display = "flex";
  }

  hide() {
    this.overlay.style.display = "none";
    this.container.style.display = "none";
    this.remove();
  }

  remove() {
    this.overlay.remove();
    this.container.remove();
  }

  handleSubmit() {
    const newDescription = this.input.value.trim();
    if (newDescription !== "") {
      this.onSubmit(newDescription);
    }
    this.remove();
  }
}

class Button extends UIElement {
  constructor(label, onClick, className) {
    super("button", className);
    this.element.textContent = label;
    this.onClick = onClick;
    this.element.addEventListener("click", () => this.onClick());
  }
}

class Checkbox extends UIElement {
  constructor(isChecked, onChange, className) {
    super("input", className);
    this.element.type = "checkbox";
    this.element.checked = isChecked;
    this.onChange = onChange;
    this.element.addEventListener("change", () => this.onChange());
  }
}

class Task {
  constructor(description) {
    this.description = description;
    this.isCompleted = false;
  }
}