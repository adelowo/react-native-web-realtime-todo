import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Button,
  TextInput,
} from 'react-native';
import axios from 'axios';
import Alert from './Alert';

export default class App extends Component {
  state = {
    tasks: [],
    text: '',
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

  componentDidMount() {}

  render() {
    return (
      <View style={[styles.container]}>
        <FlatList
          style={styles.list}
          data={this.state.tasks}
          renderItem={({ item, index }) => (
            <View>
              <View style={styles.listItemCont}>
                <Text
                  style={[
                    styles.listItem,
                    item.completed && { textDecoration: 'line-through' },
                  ]}
                >
                  {item.text}
                </Text>
                {!item.completed && (
                  <Button
                    title="✔️ "
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
    paddingLeft: 10,
    borderColor: 'gray',
    width: '100%',
  },
});
