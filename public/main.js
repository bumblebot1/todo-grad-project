var todoList = document.getElementById("todo-list");
var todoListPlaceholder = document.getElementById("todo-list-placeholder");
var form = document.getElementById("todo-form");
var todoTitle = document.getElementById("new-todo");
var error = document.getElementById("error");
var completeCounter = document.getElementById("count-label");
var deleteComplete = document.getElementById("delete-complete");
var all = document.getElementById("all");
var active = document.getElementById("active");
var completed = document.getElementById("completed");
var displayMessage = document.getElementById("display-message");
var messages = [
    "Displaying all todo items.",
    "Displaying only currently active todo items.",
    "Displaying only completed todo items."
];
var ALL_VALUES = 0;
var ACTIVE_VALUES = 1;
var COMPLETE_VALUES = 2;
var mode;
//this refreshes the page and initialises display mode to show all items in list
setMode(ALL_VALUES);

all.onclick = function() {
    setMode(ALL_VALUES);
};

active.onclick = function() {
    setMode(ACTIVE_VALUES);
};

completed.onclick = function() {
    setMode(COMPLETE_VALUES);
};

function setMode(newMode) {
    mode = newMode;
    displayMessage.innerHTML = messages[mode];
    reloadTodoList();
}

form.onsubmit = function(event) {
    var title = todoTitle.value;
    createTodo(title, function() {
        reloadTodoList();
    });
    todoTitle.value = "";
    event.preventDefault();
};

function createTodo(title, callback) {
    var createRequest = new XMLHttpRequest();
    createRequest.open("POST", "/api/todo");
    createRequest.setRequestHeader("Content-type", "application/json");
    createRequest.send(JSON.stringify({
        title: title,
        complete: false
    }));
    createRequest.onload = onLoadFactory(createRequest, "Failed to create item. Server returned ",
                           201, callback);
}

function getTodoList(callback) {

    fetch('/api/todo')
        .then(function(response){
            var status = response.status;
            response.json().then(function(data) {
                if(status === 200){
                    callback(data);
                }
                else {
                    error.textContent = "Failed to get list. Server returned " + response.status + " - " + JSON.stringify(data);
                }
            });
        });
}

function reloadTodoList() {
    while (todoList.firstChild) {
        todoList.removeChild(todoList.firstChild);
    }
    todoListPlaceholder.style.display = "block";
    getTodoList(function(todos) {
        todoListPlaceholder.style.display = "none";
        var count = 0;
        var completeList = [];
        todos.forEach(function(todo) {
            if (!filterTodoElements(todo, mode)) {
                return;
            }
            if (!todo.complete) {
                count++;
            }
            else {
                completeList.push(todo);
            }
            var listItem = document.createElement("li");
            listItem.textContent = todo.title;
            listItem.className = todo.complete ? "complete" : "incomplete";

            var deleteButton = buttonFactory("delete", deleteEntry, todo);

            var completeButton = buttonFactory("complete", completeEntry, todo);

            listItem.appendChild(deleteButton);
            listItem.appendChild(completeButton);
            todoList.appendChild(listItem);
        });
        var classes = nameFilter(completeCounter);
        completeCounter.textContent = count;
        completeCounter.className = classes;
        if (count === 0) {
            completeCounter.className += " hidden";
        }
        classes = nameFilter(deleteComplete);
        deleteComplete.className = classes;
        if (completeList.length === 0) {
            deleteComplete.className += " hidden";
        }
        deleteComplete.onclick = function() {
            deleteList(completeList);
            return;
        };
    });
}

function filterTodoElements(value, mode) {
    switch (mode){
        case ALL_VALUES:
            return true;
        case ACTIVE_VALUES:
            return !value.complete;
        case COMPLETE_VALUES:
            return value.complete;
    }
}

function nameFilter(item) {
    return item.className.split(" ").filter(function(value) {
        return value !== "hidden";
    }).join(" ");
}

function deleteList(todoList) {
    var executed = 0;
    var listener = function() {
        if (executed < 2) {
            reloadTodoList();
        }
        else {
            executed--;
        }
    };
    for (var i = 0; i < todoList.length; i++) {
        executed++;
        deleteEntry(todoList[i], listener);
    }
}

function deleteEntry(todo, callback) {
    callback = callback || reloadTodoList;
    var createRequest = new XMLHttpRequest();
    createRequest.open("DELETE", "/api/todo/" + todo.id);
    createRequest.setRequestHeader("Content-type", "application/json");
    createRequest.onload = onLoadFactory(createRequest, "Failed to delete. Server returned ", 200,
                           callback);
    createRequest.send();
}

function completeEntry(todo) {
    var createRequest = new XMLHttpRequest();
    createRequest.open("PUT", "/api/todo/");
    createRequest.setRequestHeader("Content-type", "application/json");
    createRequest.onload = onLoadFactory(createRequest, "Failed to update. Server returned ", 200,
                           reloadTodoList);
    createRequest.send(JSON.stringify({
        id: todo.id,
        complete: true
    }));
}

function buttonFactory(name, listener, todo) {
    var button = document.createElement("button");
    button.textContent = name;
    button.className = "button";
    button.addEventListener("click", function() {
        listener(todo);
    });
    return button;
}

function onLoadFactory(req, err, status, callback, func, prop) {
    return function() {
        if (this.status === status) {
            if (func === undefined) {
                callback();
            }
            else {
                callback(func(req[prop]));
            }
        }
        else {
            error.textContent = err + req.status + " - " + req.responseText;
        }
    };
}

reloadTodoList();
