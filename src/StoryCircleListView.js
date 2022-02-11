import React, {Component, useEffect} from "react";
import {View, FlatList} from "react-native";
import FastImage from "react-native-fast-image";
import StoryCircleListItem from "./StoryCircleListItem";
import {getLimit, increaseLimit} from '../../../src/api/stories';
class StoryCircleListView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            catchedProfiles: [],
        };
    }

    componentDidUpdate(prevProps) {
        if ((this.props?.data?.length !== prevProps?.data?.length) && this.props?.data?.length > 0) {
            this.props.data.forEach(({username, stories}) => {
                
                if (this.state.catchedProfiles.indexOf(username) !== -1) {
                    //Profile has been catched 
                    
                } else {
                    //Profile has NOT been catched 
                    FastImage.preload(stories.map(({story_image}) => {
                        return {uri: story_image}
                    }))
                    this.setState({catchedProfiles: this.state.catchedProfiles.concat(username)})
                }
            })
        }
    }

    
    render() {
        const {
            data,
            handleStoryItemPress,
            unPressedBorderColor,
            pressedBorderColor,
            avatarSize
        } = this.props;

        return (
            <View>
                <FlatList
                    onEndReached={()=> data.length == getLimit() ? increaseLimit() : null}
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
