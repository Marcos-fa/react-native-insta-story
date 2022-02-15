import React, {Fragment, useRef, useState, useEffect, useContext} from "react";
import {LogBox, Dimensions, View, Platform, StatusBar} from "react-native";
import Modal from "react-native-modalbox";
import StoryListItem from "./StoryListItem";
import StoryCircleListView from "./StoryCircleListView";
import {isNullOrWhitespace} from "./helpers/ValidationHelpers";
import type {IUserStory} from "./interfaces/IUserStory";
import AndroidCubeEffect from "./AndroidCubeEffect";
import CubeNavigationHorizontal from "./CubeNavigationHorizontal";
import colors from "../../../styles/colors";
import {getLimit, increaseLimit} from '../../../src/api/stories';
import { BackContext } from "../../../context/back.context";
// import { useEffect } from "react/cjs/react.development";

type Props = {
    data: IUserStory[],
    style?: any,
    unPressedBorderColor?: string,
    pressedBorderColor?: string,
    onClose?: function,
    onStart?: function,
    duration?: number,
    swipeText?: string,
    customSwipeUpComponent?: any,
    customCloseComponent?: any,
    avatarSize?: number,
};

LogBox.ignoreLogs(['Warning: componentWillReceiveProps']); // Ignore log notification by message

export const Story = (props: Props) => {

    const {stories} = useContext(BackContext)

    const {
        data,
        unPressedBorderColor,
        pressedBorderColor,
        style,
        onStart,
        onClose,
        duration,
        swipeText,
        customSwipeUpComponent,
        customCloseComponent,
        avatarSize
    } = props;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedData, setSelectedData] = useState([]);
    const cube = useRef();

    // Component Functions
    const _handleStoryItemPress = (item, index) => {
        const newData = stories.slice(index);
        if (onStart) {
            onStart(item)
        }

        setCurrentPage(0);
        setSelectedData(newData);
        setIsModalOpen(true);
        console.log('this is the index: ', index, stories.length)
        if (stories.length - 11 <= index) {
            console.log('se tendrian que pedir mas: ', index, stories.length, stories.length - 11);
            increaseLimit()
        }
    };

    function onStoryFinish(state) {
        try {
            console.log('onStoryFinish datalength: ', currentPage, stories.length)
            setSelectedData(stories);
            if (!isNullOrWhitespace(state)) {
                if (state == "next") {
                    const newPage = currentPage + 1;
                    if (newPage < stories.length) {
                        console.log('aqui entra cuando se acaban las de 1 user: ', newPage, stories[newPage + 3])
                        setCurrentPage(newPage);
                            cube?.current?.scrollTo(newPage);
                    } else {
                        console.log('este no se ejecuta hasta el final')
                        setIsModalOpen(false);
                        setCurrentPage(0);
                        if (onClose) {
                            onClose(stories[stories.length - 1]);
                        }
                    }
                } else if (state == "previous") {
                    const newPage = currentPage - 1;
                    if (newPage < 0) {
                        setIsModalOpen(false);
                        setCurrentPage(0);
                    } else {
                        setCurrentPage(newPage);
                        cube?.current?.scrollTo(newPage);
                    }
                }
            }
        } catch (error) {
            console.log('error: ', error.message)
        }
    }

    /*const renderStoryList = (history) => history.map((x, i) => {
        // console.log('renderStoryList: ', x.full_name, i)
        return (<StoryListItem duration={duration * 1000}
                               key={i}
                               profileName={x.full_name}
                               profileImage={x.profile_pic_url}
                               stories={x.stories}
                               currentPage={currentPage}
                               onFinish={onStoryFinish}
                               swipeText={swipeText}
                               customSwipeUpComponent={customSwipeUpComponent}
                               customCloseComponent={customCloseComponent}
                               onClosePress={() => {
                                   setIsModalOpen(false);
                                   if (onClose) {
                                       onClose(x);
                                   }
                               }}
                               index={i}/>)
    })*/

    const renderStoryList = (histories) => {
        let index = 0;
        let x, i;
        const histories2 = []
        while(index < histories.length){
            i = index;

            x = stories[i];
            index ++;
            console.log(index)
            histories2.push(<StoryListItem duration={duration * 1000}
                key={i}
                profileName={x.full_name}
                profileImage={x.profile_pic_url}
                stories={x.stories}
                currentPage={currentPage}
                onFinish={onStoryFinish}
                swipeText={swipeText}
                customSwipeUpComponent={customSwipeUpComponent}
                customCloseComponent={customCloseComponent}
                onClosePress={() => {
                    setIsModalOpen(false);
                    if (onClose) {
                        onClose(x);
                    }
                }}
                index={i}/>
            )
            
        }
        return histories2
    }

    const renderCube = () => {
        // console.log('aqui es render cube')
        if (Platform.OS == 'ios') {
            return (
                <CubeNavigationHorizontal
                    ref={cube}
                    callBackAfterSwipe={(x) => {
                        if (x != currentPage) {
                            setCurrentPage(parseInt(x));
                        }
                    }}
                >
                    {renderStoryList()}
                </CubeNavigationHorizontal>
            )
        } else {
            return (<AndroidCubeEffect
                ref={cube}
                callBackAfterSwipe={(x) => {
                    if (x != currentPage) {
                        setCurrentPage(parseInt(x));
                    }
                }}
            >
                {renderStoryList([...stories])}
            </AndroidCubeEffect>)
        }
    }

    return (
        <Fragment>
            <StatusBar 
               animated={true}
               translucent={true}
               hidden={Platform.OS == 'ios' && isModalOpen? true : false}
               backgroundColor={colors.backGroundColor}
               barStyle={'light-content'}
               showHideTransition={true}
            />
            <View style={style}>
                <StoryCircleListView
                    handleStoryItemPress={_handleStoryItemPress}
                    data={stories}
                    avatarSize={avatarSize}
                    unPressedBorderColor={unPressedBorderColor}
                    pressedBorderColor={pressedBorderColor}
                />
            </View>
            <Modal
                style={{
                    flex: 1,
                    height: Dimensions.get("window").height,
                    width: Dimensions.get("window").width
                }}
                isOpen={isModalOpen}
                onClosed={() => setIsModalOpen(false)}
                position="center"
                swipeToClose
                swipeArea={250}
                backButtonClose
                coverScreen={true}
                presentationStyle={'overFullScreen'}
            >
                {renderCube()}
            </Modal>
        </Fragment>
    );
};
export default Story;
