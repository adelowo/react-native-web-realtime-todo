import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Button,
  TextInput,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import Alert from './Alert';
import Pusher from 'pusher-js/react-native';

const APP_KEY = 'b738d32478149fc5b339';
const APP_CLUSTER = 'eu';

export default class App extends Component {
  state = {
    tasks: [],
    text: '',
    initiator: false,
  };

  changeTextHandler = text => {
    this.setState({ text: text });
  };

  addTask = () => {
    if (this.state.text.length <= 5) {
      Alert('Todo item cannot be less than 5 characters');
      return;
    }

    axios
      .post('http://localhost:5200/items', { title: this.state.text })
      .then(res => {
        if (res.data.status) {
          this.setState(prevState => {
            const item = {
              text: prevState.text,
              completed: false,
            };

            return {
              tasks: [...prevState.tasks, item],
              text: '',
              initiator: true,
            };
          });

          return;
        }

        Alert('Could not add TODO item');
      })
      .catch(err => {
        let msg = err;

        if (err.response) {
          msg = err.response.data.message;
        }

        Alert(msg);
      });
  };

  markComplete = i => {
    axios
      .post('http://localhost:5200/items/complete', { index: i })
      .then(res => {
        if (res.data.status) {
          this.setState(prevState => {
            prevState.tasks[i].completed = true;
            return { tasks: [...prevState.tasks] };
          });
        }
      });
  };

  componentDidMount() {
    axios.get('http://localhost:5200/items', {}).then(res => {
      this.setState({
        tasks: res.data.tasks || [],
        text: '',
      });
    });

    const socket = new Pusher(APP_KEY, {
      cluster: APP_CLUSTER,
    });

    const channel = socket.subscribe('todo');

    channel.bind('items', data => {
      if (!this.state.initiator) {
        this.setState(prevState => {
          return { tasks: [...prevState.tasks, data] };
        });
      } else {
        this.setState({
          initiator: false,
        });
      }
    });

    channel.bind('complete', data => {
      if (!this.state.initiator) {
        this.setState(prevState => {
          prevState.tasks[data.index].completed = true;
          return { tasks: [...prevState.tasks] };
        });
      } else {
        this.setState({
          initiator: false,
        });
      }
    });
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5FCFF' }}>
        <View style={[styles.container]}>
          <FlatList
            style={styles.list}
            data={this.state.tasks}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View>
                <View style={styles.listItemCont}>
                  <Text
                    style={[
                      styles.listItem,
                      item.completed && { textDecorationLine: 'line-through' },
                    ]}
                  >
                    {item.text}
                  </Text>
                  {!item.completed && (
                    <Button
                      title="✔"
                      onPress={() => this.markComplete(index)}
                    />
                  )}
                </View>
                <View style={styles.hr} />
              </View>
            )}
          />

          <TextInput
            style={styles.textInput}
            onChangeText={this.changeTextHandler}
            onSubmitEditing={this.addTask}
            value={this.state.text}
            placeholder="Add Tasks"
            returnKeyType="done"
            returnKeyLabel="done"
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingTop: 20,
    height: '100%',
  },
  list: {
    width: '100%',
  },
  listItem: {
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 18,
  },
  hr: {
    height: 1,
    backgroundColor: 'gray',
  },
  listItemCont: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    height: 40,
    paddingRight: 10,
    borderColor: 'gray',
    width: '100%',
  },
});
