import React, {Component, useEffect} from "react";
import {View, FlatList} from "react-native";
import StoryCircleListItem from "./StoryCircleListItem";
import {increaseLimit} from '../../../src/api/stories'

class StoryCircleListView extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const {
            data,
            handleStoryItemPress,
            unPressedBorderColor,
            pressedBorderColor,
            avatarSize
        } = this.props;
        let limit = 10;

        const getMoreStories = () => {
            limit = increaseLimit() //increase limit and return the new limit
        }

        return (
            <View>
                <FlatList
                    onEndReached={()=> data.length == limit? getMoreStories() : console.log('all stories showed')}
                    extraData={data}
                    keyExtractor={(item, index) => index.toString()}
                    progressViewOffset={9}
                    data={data}
                    horizontal
                    style={{paddingLeft: 12}}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    ListFooterComponent={<View style={{flex: 1, width: 8}}/>}
                    renderItem={({item, index}) => (
                        <StoryCircleListItem
                            avatarSize={avatarSize}
                            handleStoryItemPress={() =>
                                handleStoryItemPress && handleStoryItemPress(item, index)
                            }
                            unPressedBorderColor={unPressedBorderColor}
                            pressedBorderColor={pressedBorderColor}
                            item={item}
                        />
                    )}
                />
            </View>
        );
    }
}

export default StoryCircleListView;
