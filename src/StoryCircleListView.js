import React, {Component, useEffect} from "react";
import {View, FlatList} from "react-native";
import StoryCircleListItem from "./StoryCircleListItem";
import {increaseLimit} from '../../../src/api/stories'

class StoryCircleListView extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        // this.onEndReachedCalledDuringMomentum = true;
    }
    
    // onEndReached = ({ distanceFromEnd }) => {
    //     if(!this.onEndReachedCalledDuringMomentum){
    //         console.log('llego al final');
    //         increaseLimit()
    //         this.onEndReachedCalledDuringMomentum = true;
    //     }else{
    //         console.log('nose xd');
    //     }
    // }


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

                    onEndReached={()=> data.length >= 10? increaseLimit() : console.log('nel')}



                    // onEndReached={this.onEndReached.bind(this)}
                    // onEndReachedThreshold={0.5}
                    // onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}


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
