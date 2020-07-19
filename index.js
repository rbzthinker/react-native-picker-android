'use strict';

import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    Dimensions,
    PixelRatio,
    PanResponder,
    ViewPropTypes
} from 'react-native';
import PropTypes from 'prop-types';
class PickerAndroidItem extends Component {

    static propTypes = {
        value: PropTypes.any,
        label: PropTypes.any,
        image: PropTypes.any
    };

    constructor(props, context) {
        super(props, context);
    }

    render() {
        return null;
    }
}

export default class PickerAndroid extends Component {
    static Item = PickerAndroidItem;

    static propTypes = {
        //picker's style
        pickerStyle: ViewPropTypes.style,
        //picker item's style
        itemStyle: Text.propTypes.style,
        //picked value changed then call this function
        onValueChange: PropTypes.func,
        //default to be selected value
        selectedValue: PropTypes.any
    };

    constructor(props, context) {
        super(props, context);
        this.state = PickerAndroid._stateFromProps(this.props);

        this._panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderRelease: this._handlePanResponderRelease.bind(this),
            onPanResponderMove: this._handlePanResponderMove.bind(this)
        });

        this.isMoving = false;
        this.index = this.state.selectedIndex;
    }

    static getDerivedStateFromProps(props, state) {
        
        if (props.selectedValue != state.selectedValue)
        return PickerAndroid._stateFromProps(props)
        
        return null
    }


    shouldComponentUpdate(nextProps, nextState, context) {
        return JSON.stringify([{
                selectedIndex: nextState.selectedIndex,
                items: nextState.items,
                pickerStyle: nextState.pickerStyle,
                itemStyle: nextState.itemStyle,
                onValueChange: nextState.onValueChange
            }, context]) !== JSON.stringify([{
                selectedIndex: this.state.selectedIndex,
                items: this.state.items,
                pickerStyle: this.state.pickerStyle,
                itemStyle: this.state.itemStyle,
                onValueChange: this.state.onValueChange
            }, this.context]);
    }

    static _stateFromProps(props) {
        let selectedIndex = 0;
        let items = [];
        let pickerStyle = props.pickerStyle;
        let itemStyle = props.itemStyle;
        let onValueChange = props.onValueChange;
        let selectedValue = props.selectedValue
        React.Children.forEach(props.children, (child, index) => {
            child.props.value === selectedValue && ( selectedIndex = index );
            items.push({value: child.props.value, label: child.props.label, image: child.props.image});
        });
        //fix issue#https://github.com/beefe/react-native-picker/issues/51
        return {
            selectedValue,
            selectedIndex,
            items,
            pickerStyle,
            itemStyle,
            onValueChange
        };
    }

    _move(dy) {
        let index = this.index;
        this.middleHeight = Math.abs(-index * 40 + dy);
        this.up && this.up.setNativeProps({
            style: {
                marginTop: (3 - index) * 30 + dy * .75,
            },
        });
        this.middle && this.middle.setNativeProps({
            style: {
                marginTop: -index * 40 + dy,
            },
        });
        this.down && this.down.setNativeProps({
            style: {
                marginTop: (-index - 1) * 30 + dy * .75,
            },
        });
    }

    _moveTo(index) {
        let _index = this.index;
        let diff = _index - index;
        let marginValue;
        let that = this;
        if (diff && !this.isMoving) {
            marginValue = diff * 40;
            this._move(marginValue);
            this.index = index;
            this._onValueChange();
        }
    }

    //cascade mode will reset the wheel position
    moveTo(index) {
        this._moveTo(index);
    }

    moveUp() {
        this._moveTo(Math.max(this.state.items.index - 1, 0));
    }

    moveDown() {
        this._moveTo(Math.min(this.index + 1, this.state.items.length - 1));
    }

    _handlePanResponderMove(evt, gestureState) {
        let dy = gestureState.dy;
        if (this.isMoving) {
            return;
        }
        // turn down
        if (dy > 0) {
            this._move(dy > this.index * 40 ? this.index * 40 : dy);
        } else {
            this._move(dy < (this.index - this.state.items.length + 1) * 40 ? (this.index - this.state.items.length + 1) * 40 : dy);
        }
    }

    _handlePanResponderRelease(evt, gestureState) {
        let middleHeight = this.middleHeight;
        this.index = (middleHeight % 40 >= 20 ? Math.ceil(middleHeight / 40) : Math.floor(middleHeight / 40)) || 0;
        this._move(0);
        this._onValueChange();
    }

    componentWillUnmount() {
        this.timer && clearInterval(this.timer);
    }

    _renderItems(items) {
        //value was used to watch the change of picker
        //label was used to display
        let upItems = [], middleItems = [], downItems = [];
        items.forEach((item, index) => {

            upItems[index] = (<View key={'viewUp'+index} style={{flexDirection:'row',alignItems:'center'}}>
              {item.image?<Image style={{marginRight:5, width:18, height:14}} key={'imageUp'+index} source={item.image}/>:null}
                  <Text
                    key={'up'+index}
                    style={[styles.upText, this.state.itemStyle]}
                    onPress={() => {
                      this._moveTo(index);
                    }}>
                    {item.label}
                </Text>
            </View>);

            middleItems[index] = (<View key={'viewMid'+index} style={{flexDirection:'row',alignItems:'center'}}>
                {item.image?<Image style={{marginRight:5, width:26, height:20}} resizeMode={'stretch'} key={'imageMid'+index} source={item.image}/>:null}
                <Text
                  key={'mid'+index}
                  style={[styles.middleText, this.state.itemStyle]}>{item.label}
                </Text>
            </View>);

            downItems[index] = (<View key={'viewDown'+index} style={{flexDirection:'row',alignItems:'center'}}>
                {item.image?<Image style={{marginRight:5, width:18, height:14}} key={'imageDown'+index} source={item.image}/>:null}
                <Text
                  key={'down'+index}
                  style={[styles.downText, this.state.itemStyle]}
                  onPress={() => {
                    this._moveTo(index);
                  }}>
                  {item.label}
                </Text>
            </View>);

        });
        return {upItems, middleItems, downItems,};
    }

    _onValueChange() {
        //the current picked label was more expected to be passed,
        //but PickerIOS only passed value, so we set label to be the second argument
        //add by zooble @2015-12-10
        var curItem = this.state.items[this.index];
        this.state.onValueChange && this.state.onValueChange(curItem.value, curItem.label);
    }

    render() {
        let index = this.state.selectedIndex;
        let length = this.state.items.length;
        let items = this._renderItems(this.state.items);

        let upViewStyle = {
            marginTop: (3 - index) * 30,
            height: length * 30,
        };
        let middleViewStyle = {
            marginTop: -index * 40,
        };
        let downViewStyle = {
            marginTop: (-index - 1) * 30,
            height: length * 30,
        };

        return (
            //total to be 90*2+40=220 height
            <View style={[styles.container, this.state.pickerStyle]} {...this._panResponder.panHandlers}>

                <View style={styles.up}>
                    <View style={[styles.upView, upViewStyle]} ref={(up) => { this.up = up }}>
                        { items.upItems }
                    </View>
                </View>

                <View style={styles.middle}>
                    <View style={[styles.middleView, middleViewStyle]} ref={(middle) => { this.middle = middle }}>
                        { items.middleItems }
                    </View>
                </View>

                <View style={styles.down}>
                    <View style={[styles.downView, downViewStyle]} ref={(down) => { this.down = down }}>
                        { items.downItems }
                    </View>
                </View>
            </View>
        );
    }
}

let width = Dimensions.get('window').width;
let ratio = PixelRatio.get();
let styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        //this is very important
        backgroundColor: null
    },
    up: {
        height: 90,
        overflow: 'hidden',
        zIndex: 0
    },
    upView: {
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    upText: {
        paddingTop: 0,
        height: 30,
        fontSize: 20,
        color: '#000',
        opacity: .5,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0
    },
    middle: {
        height: 40,
        width: width,
        overflow: 'hidden',
        borderColor: '#aaa',
        borderTopWidth: 1 / ratio,
        borderBottomWidth: 1 / ratio,
        zIndex: 2
    },
    middleView: {
        height: 40,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    middleText: {
        paddingTop: 0,
        height: 40,
        color: '#000',
        fontSize: 28,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0
    },
    down: {
        height: 90,
        overflow: 'hidden',
        zIndex: 1
    },
    downView: {
        overflow: 'hidden',
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    downText: {
        paddingTop: 0,
        height: 30,
        fontSize: 16,
        color: '#000',
        opacity: .5,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0
    }

});
