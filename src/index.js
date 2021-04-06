const express = require("express");
const cors = require("cors");

const { v4: uuidv4, validate } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (!usernameAlreadyExists) {
    return response.status(404).json({ error: "Username not exists" });
  }

  const user = users.find((user) => user.username === username);

  request.user = user;
  next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  const { user } = request;

  if (!user.pro && user.todos.length >= 10) {
    return response.status(403).json({ error: "plys check plane pro" });
  }

  next();
}

function checksTodoExists(request, response, next) {
  const { username } = request.headers;
  const idTodo = request.params.id;

  if (!validate(idTodo)) {
    return response.status(400).json({ error: "todo not valid" });
  }

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (!usernameAlreadyExists) {
    return response.status(404).json({ error: "Username not exists" });
  }

  const user = users.find((data) => data.username === username);
  const todoExists = user.todos.some((todo) => todo.id === idTodo);
  if (!todoExists) {
    return response.status(404).json({ error: "todo not found" });
  }
  const todo = user.todos.find((todo) => todo.id === idTodo);

  request.user = user;
  request.todo = todo;

  next();
}

function findUserById(request, response, next) {
  const user_id = request.params.id;

  const usernameAlreadyExists = users.some((user) => user.id === user_id);

  if (!usernameAlreadyExists) {
    return response.status(404).json({ error: "Username not exists" });
  }

  const user = users.find((data) => data.id === user_id);
  request.user = user;

  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: "Username already exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/users/:id", findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch("/users/:id/pro", findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response
      .status(400)
      .json({ error: "Pro plan is already activated." });
  }

  user.pro = true;

  return response.json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post(
  "/todos",
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  (request, response) => {
    const { title, deadline } = request.body;
    const { user } = request;

    const newTodo = {
      id: uuidv4(),
      title,
      deadline: new Date(deadline),
      done: false,
      created_at: new Date(),
    };

    user.todos.push(newTodo);

    return response.status(201).json(newTodo);
  }
);

app.put("/todos/:id", checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch("/todos/:id/done", checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksTodoExists,
  (request, response) => {
    const { user, todo } = request;

    const todoIndex = user.todos.indexOf(todo);

    if (todoIndex === -1) {
      return response.status(404).json({ error: "Todo not found" });
    }

    user.todos.splice(todoIndex, 1);

    return response.status(204).send();
  }
);

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById,
};
