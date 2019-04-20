require('dotenv').config({ path: 'variable.env' });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  useTLS: true,
});

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/pusher/auth', function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

const todos = [];

app.get('/items', (req, res) => {
  res.status(200).send({ tasks: todos });
});

app.post('/items', (req, res) => {
  const title = req.body.title;

  if (title === undefined) {
    res
      .status(400)
      .send({ message: 'Please provide your todo item', status: false });
    return;
  }

  if (title.length <= 5) {
    res.status(400).send({
      message: 'Todo item should be more than 5 characters',
      status: false,
    });
    return;
  }

  const index = todos.findIndex(element => {
    return element.text === title.trim();
  });

  if (index >= 0) {
    res
      .status(400)
      .send({ message: 'TODO item already exists', status: false });
    return;
  }

  const item = {
    text: title.trim(),
    completed: false,
  };

  todos.push(item);

  pusher.trigger('todo', 'items', item);

  res
    .status(200)
    .send({ message: 'TODO item was successfully created', status: true });
});

app.post('/items/complete', (req, res) => {
  const idx = req.body.index;

  todos[idx].completed = true;

  pusher.trigger('todo', 'complete', { index: idx });

  res.status(200).send({
    status: true,
  });
});

app.set('port', process.env.PORT || 5200);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running on port ${server.address().port}`);
});
