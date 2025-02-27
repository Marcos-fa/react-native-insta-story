import React, { Component } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import FastImage from "react-native-fast-image";
import crashlytics from '@react-native-firebase/crashlytics';

// Constants
import DEFAULT_AVATAR from "./assets/images/no_avatar.png";

// Components
class StoryCircleListItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPressed: this.props?.item?.seen,
      imageLoaded: false
    };
  }

  // Component Functions
  _handleItemPress = (item) => {
    try {
      const { handleStoryItemPress } = this.props;

      if (handleStoryItemPress) handleStoryItemPress(item);

      // this.setState({ isPressed: true }); //Function to check as watched.
    } catch (error) {
      crashlytics().recordError(error, 'error instaStory _handleItemPress = (item) StoryCircleListItem');
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    try {
      if (prevProps.item.seen != this.props.item.seen) {
        this.setState({ isPressed: this.props.item.seen });
      }
    } catch (error) {
      crashlytics().recordError(error, 'error instaStory componentDidUpdate(prevProps, prevState, snapshot) StoryCircleListItem');
    }
  }

  render() {
    const { item, unPressedBorderColor, pressedBorderColor, avatarSize } =
      this.props;
    const { isPressed } = this.state;
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => this._handleItemPress(item)}
          style={[
            styles.avatarWrapper,
            {
              height: avatarSize ? avatarSize + 4 : 64,
              width: avatarSize ? avatarSize + 4 : 64,
            },
            !isPressed
              ? {
                borderColor: unPressedBorderColor
                  ? unPressedBorderColor
                  : "red",
              }
              : {
                borderColor: pressedBorderColor ? pressedBorderColor : "grey",
              },
          ]}
        >
          {/* <Image
                        style={{
                            height: avatarSize ?? 60,
                            width: avatarSize ?? 60,
                            borderRadius: 100,
                            borderWidth: 3,
                            borderColor: '#121212'
                        }}
                        source={{ uri: item.profile_pic_url }}
                        defaultSource={Platform.OS === 'ios' ? DEFAULT_AVATAR : null}
                    /> */}
          {!this.state.imageLoaded && (
            <FastImage
              style={{
                height: avatarSize ?? 55,
                width: avatarSize ?? 55,
                borderRadius: 100,
                position: 'absolute'
              }}
              source={DEFAULT_AVATAR}
              resizeMode={FastImage.resizeMode.contain}
            />
          )}

          <FastImage
            style={{
              height: avatarSize ?? 55,
              width: avatarSize ?? 55,
              borderRadius: 100,
            }}
            source={{
              uri: item.profile_pic_url,
              priority: FastImage.priority.high,
            }}
            resizeMode={FastImage.resizeMode.contain}
            onLoadEnd={() => this.setState({ imageLoaded: true })}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

export default StoryCircleListItem;

const styles = StyleSheet.create({
  container: {
    marginRight: 10,
  },
  unPressedAvatar: {
    borderColor: "red",
  },
  pressedAvatar: {
    borderColor: "grey",
  },
  avatarWrapper: {
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "red",
    borderRadius: 100,
    height: 64,
    width: 64,
  },
  avatar: {
    height: 60,
    width: 60,
    borderRadius: 100,
  },
  itemText: {
    textAlign: "center",
    fontSize: 9,
  },
});
