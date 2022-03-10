import React, {Fragment, useRef, useState, useContext, useEffect} from "react";
import {LogBox, Dimensions, View, Platform, StatusBar} from "react-native";
import Modal from "react-native-modalbox";
import StoryListItem from "./StoryListItem";
import StoryCircleListView from "./StoryCircleListView";
import {isNullOrWhitespace} from "./helpers/ValidationHelpers";
import type {IUserStory} from "./interfaces/IUserStory";
import AndroidCubeEffect from "./AndroidCubeEffect";
import CubeNavigationHorizontal from "./CubeNavigationHorizontal";
import { ThemeContext } from "../../../context/theme.context";
import {getLimit, increaseLimit} from '../../../src/api/stories';
import { BackContext } from "../../../context/back.context";

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
    const {stories} = useContext(BackContext);
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
    const {theme, darkMode} = useContext(ThemeContext)
    let [isModalOpen, setIsModalOpen] = useState(false);
    let [currentPage, setCurrentPage] = useState(0);
    let [indexPage, setIndexPage] = useState(0);
    let [selectedData, setSelectedData] = useState([]);
    const cube = useRef();

    // Component Functions
    const _handleStoryItemPress = (item, index) => {
        const newData = stories.slice(index);
        if (onStart) {
            onStart(item)
        }
        setCurrentPage(0);
        setIndexPage(index);
        setSelectedData(newData);
        setIsModalOpen(true);
    };

    useEffect(()=>{
        if (stories.length  && indexPage >= (stories.length - 4) && getLimit() === stories.length) {
            increaseLimit();
        }
    },[indexPage]);

    useEffect(()=>{
        if(stories?.length){
            const newData = stories.slice(currentPage);
            setSelectedData(newData);
        }
    }, [stories]);

    const onStoryFinish = (state) => {
        if (!isNullOrWhitespace(state)) {
            if (state == "next") {
                const newPage = currentPage + 1;
                if (newPage < selectedData.length) {
                    setCurrentPage(newPage);
                    setIndexPage(indexPage + 1);
                    cube?.current?.scrollTo(newPage);
                } else {
                    setIsModalOpen(false);
                    setCurrentPage(0);
                    if (onClose) {
                        onClose(selectedData[selectedData.length - 1]);
                    }
                }
            } else if (state == "previous") {
                const newPage = currentPage - 1;
                if (newPage < 0) {
                    setIsModalOpen(false);
                    setCurrentPage(0);
                } else {
                    setIndexPage(indexPage - 1);
                    setCurrentPage(newPage);
                    cube?.current?.scrollTo(newPage);
                }
            }
        }
    }

    const renderStoryList = (histories) => {
        let index = 0;
        let x, i;
        const histories2 = []
        while(index < histories.length){
            i = index;
            x = selectedData[i];
            index ++;
            histories2.push(
                <StoryListItem duration={duration * 1000}
                               key={i}
                               profileName={x.username}
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
                               index={i}
                />
            )
        }
        return histories2
    }

    const renderCube = () => {
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
                    {renderStoryList(selectedData)}
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
                {renderStoryList()}
            </AndroidCubeEffect>)
        }
    }

    return (
        <Fragment>
            <StatusBar
                animated={true}
                translucent={true}
                hidden={Platform.OS == 'ios' && isModalOpen? true : false}
                barStyle={darkMode? 'light-content' : 'dark-content'}
                backgroundColor={theme.backgroundColor}
                showHideTransition={'fade'}
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
            >
                {renderCube()}
            </Modal>
        </Fragment>
    );
};
export default Story;
