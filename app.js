const format = require('date-fns/format')
var isValid = require('date-fns/isValid')
const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')

let db = null

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Runnning on http://localhost/3000/')
    })
  } catch (e) {
    console.log(`DB error:${e.meassage}`)
    process.exit(1)
  }
}

initilizeDBAndServer()

const hasPriorityAndStatusProperities = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndStatusProperities = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperities = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasdueDateProperty = requestQuery => {
  return requestQuery.date !== undefined
}

const convertDBobjectAndResponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}
app.get('/todos/', async (request, response) => {
  const {search_q = '', category, priority, status, date} = request.query

  let getToDoQuery = ''
  switch (true) {
    case hasPriorityAndStatusProperities(request.query):
      getToDoQuery = `
         SELECT
          *
          FROM
            todo
          WHERE
          todo LIKE '%${search_q}%' 
          AND status = '${status}'
          AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      const priorityArr = ['HIGH', 'MEDIUM', 'LOW']

      const result1 = priorityArr.includes(priority)
      if (result1) {
        getToDoQuery = `
          SELECT
            *
            FROM
              todo
            WHERE
            todo LIKE '%${search_q}%' 
            AND priority = '${priority}';`
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatusProperty(request.query):
      const statusArr = ['TO DO', 'IN PROGRESS', 'DONE']

      const result2 = statusArr.includes(status)
      if (result2) {
        getToDoQuery = `
         SELECT
          *
          FROM
            todo
          WHERE
          todo LIKE '%${search_q}%' 
          AND status = '${status}';`
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasCategoryProperty(request.query):
      const categoryArr = ['WORK', 'HOME', 'LEARNING']
      const result3 = categoryArr.includes(category)
      if (result3) {
        getToDoQuery = `
         SELECT
          *
          FROM
            todo
          WHERE
          todo LIKE '%${search_q}%' 
          AND category = '${category}';`
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasdueDateProperty(request.query):
      const requestDate = new Date(date)
      const result4 = isValid(new Date(date))
      console.log(result4)
      if (result4) {
        let formatDate = format(
          new Date(
            requestDate.getFullYear(),
            requestDate.getMonth(),
            requestDate.getDate(),
          ),
          'yyyy-MM-dd',
        )
        console.log(formatDate)
        getToDoQuery = `
         SELECT
          *
          FROM
            todo
          WHERE
          todo LIKE '%${search_q}%' 
          AND due_date = '${formatDate}';`
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    case hasCategoryAndStatusProperities(request.query):
      getToDoQuery = `
         SELECT
          *
          FROM
            todo
          WHERE
          todo LIKE '%${search_q}%' 
          AND category = '${category}'
          AND status = '${status}';`
      break
    case hasCategoryAndPriorityProperities(request.query):
      getToDoQuery = `
         SELECT
          *
          FROM
            todo
          WHERE
          todo LIKE '%${search_q}%' 
          AND category = '${category}'
          AND priority = '${priority}';`
      break
    default:
      getToDoQuery = `
          SELECT
            *
          FROM
            todo 
          WHERE
            todo LIKE '%${search_q}%';`
  }
  const dbResponse = await db.all(getToDoQuery)
  response.send(dbResponse)
})

//GET API 2 todo table
app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getToDoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE 
            id =${todoId};`
  const dbResponse = await db.all(getToDoQuery)
  const result = dbResponse.map(eachItem =>
    convertDBobjectAndResponseObject(eachItem),
  )
  response.send(result[0])
})

//GET API 2 agenda
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const requestDate = new Date(date)

  let formatDate = format(
    new Date(
      requestDate.getFullYear(),
      requestDate.getMonth(),
      requestDate.getDate(),
    ),
    'yyyy-MM-dd',
  )
  console.log(formatDate)
  const agendaDateValid = isValid(new Date(formatDate))
  if (agendaDateValid) {
    const getToDoQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
               due_date = '${formatDate}';`

    const dbResponse = await db.all(getToDoQuery)
    response.send(dbResponse)
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//POST API 3 Create New todo
app.post('/todos/', async (request, response) => {
  const requestBody = request.body
  const {id, todo, category, status, priority, dueDate} = requestBody

  const date = dueDate
  const priorityArr = ['HIGH', 'MEDIUM', 'LOW']
  const statusArr = ['TO DO', 'IN PROGRESS', 'DONE']
  const categoryArr = ['WORK', 'HOME', 'LEARNING']

  let validQuery = []

  switch (true) {
    case requestBody.status !== undefined:
      const statusPostValid = statusArr.includes(requestBody.status)
      if (statusPostValid === false) {
        validQuery.push('false')
        response.status(400)
        response.send('Invalid Todo Status')
      }
    case requestBody.priority !== undefined:
      const priorityPostValid = priorityArr.includes(priority)
      if (priorityPostValid === false) {
        validQuery.push('false')
        response.status(400)
        response.send('Invalid Todo Priority')
      }
    case requestBody.category !== undefined:
      const categoryPostValid = categoryArr.includes(category)
      if (categoryPostValid === false) {
        validQuery.push('false')
        response.status(400)
        response.send('Invalid Todo Category')
      }
    case requestBody.dueDate !== undefined:
      const dueDatePostValid = isValid(new Date(dueDate))
      if (dueDatePostValid === false) {
        validQuery.push('false')
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
  const postResult = validQuery.includes('false')
  if (postResult === false) {
    const getToDoQuery = `
        INSERT INTO 
            todo(id,todo,category,status,priority,due_date)
          VALUES(
            ${id},
            '${todo}',
            '${category}',
            '${status}',
            '${priority}',
            '${date}');`
    const dbResponse = await db.run(getToDoQuery)
    response.send('Todo Successfully Added')
  }
})

// PUT API 4 Update todo
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const requestBody = request.body
  const {todo, category, status, priority, dueDate} = requestBody

  const priorityArr = ['HIGH', 'MEDIUM', 'LOW']
  const statusArr = ['TO DO', 'IN PROGRESS', 'DONE']
  const categoryArr = ['WORK', 'HOME', 'LEARNING']

  let updatedQuery = ''
  switch (true) {
    case requestBody.status !== undefined:
      const statusValid = statusArr.includes(status)
      if (statusValid) {
        updatedQuery = 'Status'
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case requestBody.priority !== undefined:
      const priorityValid = priorityArr.includes(priority)
      if (priorityValid) {
        updatedQuery = 'Priority'
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case requestBody.todo !== undefined:
      updatedQuery = 'Todo'
      break
    case requestBody.category !== undefined:
      const categoryValid = categoryArr.includes(category)
      if (categoryValid) {
        updatedQuery = 'Category'
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case requestBody.dueDate !== undefined:
      const dateValid = isValid(new Date(dueDate))
      if (dateValid) {
        updatedQuery = 'Due Date'
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }

      break
  }

  if (updatedQuery !== undefined) {
    const getToDoQuery = `
          UPDATE
            todo
          SET
            todo = '${todo}',
            category = '${category}',
            status = '${status}',
            priority = '${priority}',
            due_date = '${dueDate}'
          WHERE
            id = ${todoId};`
    const dbResponse = await db.run(getToDoQuery)
    response.send(`${updatedQuery} Updated`)
  }
})

//DELETE todo table API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getToDoQuery = `
          DELETE FROM
            todo
          WHERE
            id = ${todoId};`
  const dbResponse = await db.run(getToDoQuery)
  response.send('Todo Deleted')
})

module.exports = app
