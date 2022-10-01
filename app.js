const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const filePath = path.join(__dirname, "todoApplication.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format, isExists } = require("date-fns");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDatabaseObjectToResponseObject = (eachTodo) => {
  return {
    id: eachTodo.id,
    todo: eachTodo.todo,
    priority: eachTodo.priority,
    status: eachTodo.status,
    category: eachTodo.category,
    dueDate: eachTodo.due_date,
  };
};

const validatingQueryParams = (request, response, next) => {
  const { status, priority, category, date } = request.query;

  let year = 2002,
    month = 3,
    day = 3;

  if (date !== undefined) {
    const newDate = date.split("-");
    year = parseInt(newDate[0]);
    month = parseInt(newDate[1]) - 1;
    day = parseInt(newDate[2]);
  }

  if (
    status !== undefined &&
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE"
  ) {
    console.log(status);
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== undefined &&
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    console.log(priority);
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== undefined &&
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    console.log(category);
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (date !== undefined && !isExists(year, month, day)) {
    response.status(400);
    response.send("Invalid Due Date");
  } else if (date !== undefined && isExists(year, month, day)) {
    request.newDate = format(new Date(year, month, day), "yyyy-MM-dd");
    next();
  } else {
    next();
  }
};

const validatingBodyParams = (request, response, next) => {
  const { status, priority, category, dueDate } = request.body;

  let year = 2002,
    month = 3,
    day = 3;

  if (dueDate !== undefined) {
    const newDate = dueDate.split("-");
    year = parseInt(newDate[0]);
    month = parseInt(newDate[1]) - 1;
    day = parseInt(newDate[2]);
  }

  if (
    status !== undefined &&
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE"
  ) {
    console.log(status);
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== undefined &&
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    console.log(priority);
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== undefined &&
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    console.log(category);
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate !== undefined && !isExists(year, month, day)) {
    response.status(400);
    response.send("Invalid Due Date");
  } else if (dueDate !== undefined && isExists(year, month, day)) {
    request.newDate = format(new Date(year, month, day), "yyyy-MM-dd");
    next();
  } else {
    next();
  }
};

const getTodoStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const getTodoPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const getTodoStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const getCategoryAndTodoStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const getCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const getCategoryAndTodoPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

// API - 1

app.get("/todos/", validatingQueryParams, async (request, response) => {
  const { search_q = "", category, status, priority } = request.query;

  let getTodos = null;

  switch (true) {
    case getCategoryAndTodoPriority(request.query):
      getTodos = `
            SELECT 
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%' AND category = '${category}' AND priority='${priority}'; 
        `;
      break;
    case getTodoStatusAndPriority(request.query):
      getTodos = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}';
    `;
      break;
    case getCategoryAndTodoStatus(request.query):
      getTodos = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            todo LIKE '%${search_q}%' AND category = '${category}' AND status = '${status}';
    `;
      break;
    case getTodoStatus(request.query):
      getTodos = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            todo LIKE '%${search_q}%' AND status = '${status}';
    `;
      break;
    case getTodoPriority(request.query):
      getTodos = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            todo LIKE '%${search_q}%' AND priority = '${priority}';
    `;
      break;
    case getCategory(request.query):
      getTodos = `
        SELECT 
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%' AND category = '${category}';    
        `;
      break;
    default:
      getTodos = `
        SELECT 
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%';
    `;
      break;
  }
  const todoItems = await db.all(getTodos);
  response.send(
    todoItems.map((eachTodo) => convertDatabaseObjectToResponseObject(eachTodo))
  );
});

// API - 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const specificTodo = `
    SELECT 
        *
    FROM
        todo
    WHERE
        id = ${todoId};
  `;

  const todoItem = await db.get(specificTodo);
  response.send(convertDatabaseObjectToResponseObject(todoItem));
});

// API - 3

app.get("/agenda/", validatingQueryParams, async (request, response) => {
  const specifiedDate = request.newDate;
  //   console.log(specifiedDate);

  const getDatesQuery = `
    SELECT 
        *
    FROM
        todo
    WHERE
        due_date LIKE '${specifiedDate}';
  `;

  let todoItems = await db.all(getDatesQuery);
  response.send(
    todoItems.map((eachTodo) => convertDatabaseObjectToResponseObject(eachTodo))
  );
});

// API - 4

app.post("/todos/", validatingBodyParams, async (request, response) => {
  const { id, todo, priority, status, category } = request.body;
  const formattedDate = request.newDate;

  const addTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES
        (  ${id},
           '${todo}',
           '${priority}',
           '${status}',
           '${category}',
           '${formattedDate}'
        );
    `;

  const dbResponse = await db.run(addTodoQuery);
  const newTodoId = dbResponse.lastID;
  response.send("Todo Successfully Added");
});

// API - 5

app.put("/todos/:todoId/", validatingBodyParams, async (request, response) => {
  let updateStatus;
  const { todoId } = request.params;
  let formattedDate = request.newDate;

  console.log(formattedDate);

  switch (true) {
    case request.body.status !== undefined:
      updateStatus = "Status Updated";
      break;
    case request.body.priority !== undefined:
      updateStatus = "Priority Updated";
      break;
    case request.body.todo !== undefined:
      updateStatus = "Todo Updated";
      break;
    case request.body.category !== undefined:
      updateStatus = "Category Updated";
      break;
    case request.body.dueDate !== undefined:
      updateStatus = "Due Date Updated";
      break;
  }

  console.log(updateStatus);

  const todoQuery = `
    SELECT 
        *
    FROM
        todo
    WHERE
        id = ${todoId};
  `;

  const todoDetails = await db.get(todoQuery);

  console.log(todoDetails);

  const {
    status = todoDetails.status,
    priority = todoDetails.priority,
    todo = todoDetails.todo,
    category = todoDetails.category,
  } = request.body;

  let { dueDate = todoDetails.due_date } = request.body;

  if (request.body.dueDate !== undefined) {
    dueDate = formattedDate;
  }

  const updateTodoQuery = `
    UPDATE todo
    SET
        status = '${status}',
        priority = '${priority}',
        todo = '${todo}',
        category = '${category}',
        due_date = '${dueDate}'
    WHERE
        id = ${todoId};    
  `;

  await db.run(updateTodoQuery);
  response.send(updateStatus);
});

// API - 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};
  `;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
