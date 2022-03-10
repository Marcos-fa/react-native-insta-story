import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    Animated,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    ActivityIndicator,
    View,
    Platform,
    Share,
    Linking,
    ToastAndroid,
    PermissionsAndroid,
    android,
    Easing
} from "react-native";
import FastImage from "react-native-fast-image";
import { initialWindowSafeAreaInsets } from "react-native-safe-area-context";
import type { IUserStoryItem } from "./interfaces/IUserStory";
import { usePrevious } from "./helpers/StateHelpers";
import { isNullOrWhitespace } from "./helpers/ValidationHelpers";
import GestureRecognizer from 'react-native-swipe-gestures';
import Download from '../../../images/download.svg'
import ShareSvg from '../../../images/share.svg'
import Eclipse from '../../../images/Eclipse2.svg'
import { MainContext } from '../../../context/main.context';
import colors from '../../../styles/colors';
import PremiumContainer from '../../../container/premium.container';
import CameraRoll from "@react-native-community/cameraroll";
import RNFetchBlob from 'rn-fetch-blob'
import Video from 'react-native-video';
import { conditionalExpression } from '@babel/types';

const { width, height } = Dimensions.get('window');


type Props = {
    profileName: string,
    profileImage: string,
    duration?: number,
    onFinish?: function,
    onClosePress: function,
    key: number,
    swipeText?: string,
    customSwipeUpComponent?: any,
    customCloseComponent?: any,
    stories: IUserStoryItem[]
};

export const StoryListItem = (props: Props) => {
    const stories = props.stories;
    const { isPremium } = useContext(MainContext);
    const [premiumVisible, setPremiumVisible] = useState(false);
    const [downShare, setDownShare] = useState(0)
    const [load, setLoad] = useState(true);
    const [pressed, setPressed] = useState(false);
    const [content, setContent] = useState(
        stories.map((x) => {
            return {
                image: x.story_image,
                media_type: x.media_type,
                onPress: x.onPress,
                finish: 0
            }
        }));

    const [current, setCurrent] = useState(0);

    const progress = useRef(new Animated.Value(0)).current;

    let spinValue = new Animated.Value(0);
    // First set up animation 
    Animated.loop(
        Animated.timing(
            spinValue,
            {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear, // Easing is an additional import from react-native
                useNativeDriver: true  // To make use of native driver for performance
            }
        )
    ).start()

    // Next, interpolate beginning and end values (in this case 0 and 1)
    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    })

    useEffect(() => {
        setCurrent(0);
        if (props.currentPage != 0) {
            let data = [...content];
            data.map((x, i) => {
                x.finish = 0;
            })
            setContent(data)
        }
    }, [props.currentPage]);

    continueStory = (value) => {
        if (value) {
            startAnimation();
            setPressed(false);
        } else {
            progress.stopAnimation();
            setPressed(true);
        }
    }

    const prevCurrent = usePrevious(current);

    useEffect(() => {
        if (!isNullOrWhitespace(prevCurrent)) {
            if (current > prevCurrent && content[current - 1].image == content[current].image) {
                start();
            } else if (current < prevCurrent && content[current + 1].image == content[current].image) {
                start();
            }
        }

    }, [current]);

    function start() {
        setLoad(false);
        progress.setValue(0);
        startAnimation();
    }

    function startAnimation() {
        Animated.timing(progress, {
            toValue: 1,
            duration: props.duration,
            useNativeDriver: false
        }).start(({ finished }) => {
            if (finished) {
                next();
            }
        });
    }

    function onSwipeUp() {
        if (props.onClosePress) {
            props.onClosePress();
        }
        if (content[current].onPress) {
            content[current].onPress();
        }
    }

    function onSwipeDown() {
        props?.onClosePress();
    }

    const config = {
        velocityThreshold: 0.3,
        directionalOffsetThreshold: 80
    };

    function next() {
        // check if the next content is not empty
        setLoad(true);
        if (current !== content.length - 1) {
            let data = [...content];
            data[current].finish = 1;
            setContent(data);
            setCurrent(current + 1);
            progress.setValue(0);
        } else {
            // the next content is empty
            close('next');
        }
    }

    function previous() {
        // checking if the previous content is not empty
        setLoad(true);
        if (current - 1 >= 0) {
            let data = [...content];
            data[current].finish = 0;
            setContent(data);
            setCurrent(current - 1);
            progress.setValue(0);
        } else {
            // the previous content is empty
            close('previous');
        }
    }

    function close(state) {
        let data = [...content];
        data.map(x => x.finish = 0);
        setContent(data);
        progress.setValue(0);
        if (props.currentPage == props.index) {
            if (props.onFinish) {
                props.onFinish(state);
            }
        }
    }

    const onShare = async (story_image) => {
        setDownShare(2)
        setLoad(false)
        setPressed(true), progress.stopAnimation()
        RNFetchBlob.config({
            fileCache: true,
            appendExt: content[current].media_type == 'IMAGE' || content[current].media_type === "IMAGEN" ? 'png' : 'mp4'
        })
            .fetch("GET", story_image, {})
            .then(async (res) => {
                await Share.share({
                    url: 'file://' + res.path(),
                    message: Platform.OS == 'ios' ? '' : story_image,
                    type: content[current].media_type == 'IMAGE' || content[current].media_type === "IMAGEN" ? 'image/png' : 'video/mp4',
                })
                    // share.share(shareOptions)
                    .then((res) => { setPressed(false), startAnimation() })
                    .catch((err) => { setPressed(false), startAnimation() })
                setDownShare(0)
            });
    }

    const saveToCameraRoll = async (REMOTE_IMAGE_PATH) => {
        setDownShare(1)
        setPressed(true), progress.stopAnimation()
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                );
                if (granted == 'granted') {
                    saveStory(REMOTE_IMAGE_PATH)
                } else {
                    alert("Storage not permited")
                    setPressed(false);
                    startAnimation();
                    setDownShare(0)
                }
            } else { saveStory(REMOTE_IMAGE_PATH) }
        } catch (error) {
            console.log(error.message)
            setPressed(false);
            startAnimation();
            setDownShare(0)
        }
    }

    const saveStory = async (REMOTE_IMAGE_PATH) => {
        let url = REMOTE_IMAGE_PATH;
        try {
            RNFetchBlob
                .config({
                    fileCache: true,
                    appendExt: content[current].media_type === 'IMAGE' || content[current].media_type === "IMAGEN" ? 'png' : 'mp4'
                })
                .fetch('GET', url)
                .then((res) => {
                    CameraRoll.save(res.path())
                        .then((res) => {
                            alert('Success', 'Photo added to camera roll!')
                            setPressed(false);
                            startAnimation();
                            setDownShare(0)
                        }).catch((error) => {
                            alert("Ops! Operation Failed")
                            setPressed(false)
                            startAnimation();
                            setDownShare(0)
                            console.log(error)
                        })
                })
        } catch (error) {
            console.log(error.message)
        }
    }

    return (
        <React.Fragment>
            <View style={{ position: 'absolute' }}>
                <PremiumContainer premiumVisible={premiumVisible} setPremiumVisible={setPremiumVisible} continueStory={continueStory} />
            </View>
            <GestureRecognizer
                onSwipeUp={(state) => downShare > 0 ? console.log('is downloading or sharing: ', downShare) : onSwipeUp(state)}
                onSwipeDown={(state) => downShare > 0 ? console.log('is downloading or sharing: ', downShare) : onSwipeDown(state)}
                config={config}
                style={{
                    flex: 1,
                    backgroundColor: 'black'
                }}
            >
                {props.index == props.currentPage ?
                    <View style={styles.backgroundContainer}>
                        {content[current].media_type == 'IMAGE' ?
                            <FastImage onLoadEnd={() => { props.duration = 5000, start() }}
                                source={{ uri: content[current].image, priority: FastImage.priority.high }}
                                style={styles.image}
                                resizeMode={FastImage.resizeMode.contain}
                            />
                            :
                            <Video onLoad={(data) => { props.duration = data.duration * 1000 }} onReadyForDisplay={() => start()}
                                source={{ uri: content[current].image }}   // Can be a URL or a local file.
                                ref={(ref) => {
                                    this.player = ref
                                }}                                      // Store reference
                                onBuffer={this.onBuffer}                // Callback when remote video is buffering
                                onError={this.videoError}               // Callback when video cannot be loaded
                                paused={pressed}
                                resizeMode={"contain"}
                                style={styles.backgroundVideo} />
                        }
                        {load && <View style={styles.spinnerContainer}>
                            <ActivityIndicator size="large" color={'white'} />
                        </View>}
                    </View> : null
                }
                <View style={{ flexDirection: 'column', flex: 1, }}>
                    <View style={styles.animationBarContainer}>
                        {content.map((index, key) => {
                            return (
                                <View key={key} style={styles.animationBackground}>
                                    <Animated.View
                                        style={{
                                            flex: current == key ? progress : content[key].finish,
                                            height: 2,
                                            backgroundColor: 'white',
                                        }}
                                    />
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.userSection}>
                        <View style={styles.userContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FastImage style={styles.avatarImage}
                                    source={{ uri: props.profileImage }}
                                />
                                <Text style={styles.avatarText}>{props.profileName}</Text>
                            </View>
                            {/*
                            <View style={styles.storyOptions} >
                                <TouchableOpacity disabled={downShare > 0} onPress={() => !isPremium ? setPremiumVisible(true) : saveToCameraRoll(content[current].image)} style={[styles.downloadSvg, { opacity: downShare > 0 ? 0.5 : 1 }]}
                                    onPressIn={() => progress.stopAnimation()}
                                    onLongPress={() => setPressed(true)}
                                >
                                    <Download />
                                    {!isPremium ?
                                        <View style={{ backgroundColor: colors.vipBtn, paddingHorizontal: 7, marginTop: 5, borderRadius: 20 }} >
                                            <Text style={styles.vipBtn}>VIP</Text>
                                        </View>
                                        : null}
                                </TouchableOpacity>
                                <TouchableOpacity disabled={downShare > 0} style={[styles.sharingSvg, { opacity: downShare > 0 ? 0.5 : 1 }]} onPress={() => !isPremium ?
                                    [setPremiumVisible(true), progress.stopAnimation(), setPressed(true)
                                    ] : onShare(content[current].image)
                                }
                                >
                                    {downShare > 0 ?
                                        <Animated.View style={{ transform: [{ rotate: spin }], position: 'absolute', bottom: -17, right: downShare == 1 ? 22 : -20 }}>
                                            <Eclipse width={55} height={55} />
                                        </Animated.View>
                                        :
                                        null
                                    }
                                    <ShareSvg />
                                    {!isPremium ?
                                        <View style={{ backgroundColor: colors.vipBtn, paddingHorizontal: 7, marginTop: 5, borderRadius: 20 }} >
                                            <Text style={styles.vipBtn}>VIP</Text>
                                        </View>
                                        : null}
                                </TouchableOpacity>
                            </View>
                            */}
                            {/* <TouchableOpacity onPress={() => {
                            if (props.onClosePress) {
                                props.onClosePress();
                            }
                        }}>
                            <View style={styles.closeIconContainer}>
                                {props.customCloseComponent ?
                                    props.customCloseComponent :
                                    <Text style={{color: 'white'}}>X</Text>
                                }
                            </View>
                        </TouchableOpacity> */}
                        </View>
                    </View>
                    <View style={styles.pressContainer}>
                        <TouchableWithoutFeedback
                            disabled={downShare > 0}
                            onPressIn={() => progress.stopAnimation()}
                            onLongPress={() => setPressed(true)}
                            onPressOut={() => {
                                setPressed(false);
                                startAnimation();
                            }}
                            onPress={() => {
                                if (!pressed && !load) {
                                    previous()
                                }
                            }}
                        >
                            <View style={{ flex: 1 }} />
                        </TouchableWithoutFeedback>
                        <TouchableWithoutFeedback
                            disabled={downShare > 0}
                            onPressIn={() => progress.stopAnimation()}
                            onLongPress={() => setPressed(true)}
                            onPressOut={() => {
                                setPressed(false);
                                startAnimation();
                            }}
                            onPress={() => {
                                if (!pressed && !load) {
                                    next()
                                }
                            }}>
                            <View style={{ flex: 1 }} />
                        </TouchableWithoutFeedback>
                    </View>
                </View>
                {/* {content[current].onPress &&
            <TouchableOpacity activeOpacity={1}
                              onPress={onSwipeUp}
                              style={styles.swipeUpBtn}>
                {props.customSwipeUpComponent ?
                    props.customSwipeUpComponent :
                    <>
                        <Text style={{color: 'white', marginTop: 5}}></Text>
                        <Text style={{color: 'white', marginTop: 5}}>{props.swipeText ?? 'Swipe Up'}</Text>
                    </>
                }
            </TouchableOpacity>} */}
            </GestureRecognizer>
        </React.Fragment>
    )
}


export default StoryListItem;

StoryListItem.defaultProps = {
    duration: 10000
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        marginLeft: 40
    },
    image: {
        width: width,
        height: height,
        resizeMode: 'cover'
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    spinnerContainer: {
        zIndex: -100,
        position: "absolute",
        justifyContent: 'center',
        backgroundColor: 'black',
        alignSelf: 'center',
        width: width,
        height: height,
    },
    animationBarContainer: {
        flexDirection: 'row',
        paddingTop: initialWindowSafeAreaInsets?.top ?
            initialWindowSafeAreaInsets.top == 0 ? 10 : (initialWindowSafeAreaInsets.top + 10) : 15,
        paddingHorizontal: 10,
    },
    animationBackground: {
        height: 2,
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(117, 117, 117, 0.5)',
        marginHorizontal: 2,
    },
    userSection: {
        backgroundColor: '#rgba(85, 85, 85, .40)',
        position: 'absolute',
        right: 0,
        left: 0,
        // alignItems: 'center',
        bottom: 0,
        paddingTop: 20,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        // opacity: 0.3
    },
    userContainer: {
        // position:'absolute',
        // bottom:0,
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    storyOptions: {
        flexDirection: 'row',
        // justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 20
    },
    avatarImage: {
        height: 30,
        width: 30,
        borderRadius: 100
    },
    avatarText: {
        // fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 21.94,
        color: 'white',
        paddingLeft: 10,
    },
    closeIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        paddingHorizontal: 15,
    },
    pressContainer: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: Platform.OS == 'ios' ? 70 : 100,
    },
    swipeUpBtn: {
        position: 'absolute',
        right: 0,
        left: 0,
        alignItems: 'center',
        bottom: Platform.OS == 'ios' ? 20 : 50
    },
    vipBtn: {
        fontSize: 9,
        fontWeight: '700',
        lineHeight: 11,
        letterSpacing: 0,
    },
    downloadSvg: {
        marginRight: 20,
        alignItems: 'center'
    },
    sharingSvg: {
        alignItems: 'center',
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
});