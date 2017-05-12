/**
 * https://github.com/Spikef/react-native-gesture-password
 */
import * as helper from './helper.js'
import React, {PropTypes, Component} from 'react'
import {
  StyleSheet,
  PanResponder,
  View,
  Text
} from 'react-native'
import Line from './line'
import Circle from './circle'

const Width = __WIDTH__
const Height = __HEIGHT__
const Top = (Height - Width) / 2.0 * 1.1
const Radius = Width / 10

export default class GesturePassword extends Component {
  static propTypes = {
    message: PropTypes.string,
    rightColor: PropTypes.string,
    wrongColor: PropTypes.string,
    status: PropTypes.oneOf(['right', 'wrong', 'normal']),
    onStart: PropTypes.func,
    onEnd: PropTypes.func,
    onReset: PropTypes.func,
    interval: PropTypes.number,
    allowCross: PropTypes.bool,
    innerCircle: PropTypes.bool,
    outerCircle: PropTypes.bool,
    type: PropTypes.number.isRequired  // 1设置手势密码  2验证手势密码
  }

  static defaultProps = {
    message: '',
    rightColor: '#5FA8FC',
    wrongColor: '#D93609',
    status: 'normal',
    interval: 0,
    allowCross: false,
    innerCircle: true,
    outerCircle: true,
  }

  percentage = 0.75 //公共偏移系数 触摸 和 键盘
  headerTop = 25 * this.percentage //有头部的时候触摸y轴向上的偏移

  constructor(props) {
    super(props);

    this.timer = null;
    this.lastIndex = -1;
    this.sequence = '';   // 手势结果
    this.isMoving = false;

    // getInitialState
    let circles = [];
    let Margin = Radius;
    for (let i = 0; i < 9; i++) {
      let p = i % 3;
      let q = parseInt(i / 3);
      circles.push({
        isActive: false,
        x: p * (Radius * 2 + Margin) + Margin + Radius,
        y: q * (Radius * 2 + Margin) + Margin + Radius
      });
    }
    const {type} = this.props
    this.state = {
      circles: circles,
      lines: [],
      type: type,
      header: type === 2 ? 0 : this.headerTop,
      status:'normal'
    }
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      // 要求成为响应者：
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onStartShouldSetPanResponderCapture: (event, gestureState) => true,
      onMoveShouldSetPanResponder: (event, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (event, gestureState) => true,

      // 开始手势操作
      onPanResponderGrant: (event, gestureState) => {
        this.onStart(event, gestureState);
      },
      // 移动操作
      onPanResponderMove: (event, gestureState) => {
        this.onMove(event, gestureState);
      },
      // 释放手势
      onPanResponderRelease: (event, gestureState) => {
        this.onEnd(event, gestureState);
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      type:nextProps.type,
      header:nextProps.type === 2 ? 0 : this.headerTop,
      status:nextProps.status,
    })
  }

  render() {
    let color = this.props.status === 'wrong' ? this.props.wrongColor : this.props.rightColor;

    return (
      <View style={[styles.frame, this.props.style, {flex: 1}]}>
        <View style={[styles.message,{top:this.state.type === 2 ? (Top * 0.85) : (Top * 0.65)}]}>
          <Text style={[styles.msgText, this.props.textStyle, {color: '#ff5907'}]}>
            {this.state.message || this.props.message}
          </Text>
        </View>
        <View style={[styles.board,{top: this.state.type === 2 ? Top : Top * this.percentage}]} {...this._panResponder.panHandlers}>
          {this.renderCircles()}
          {this.renderLines()}
          <Line ref='line' color={color} />
        </View>
        {this.props.children}
      </View>
    )
  }

  renderCircles() {
    let that = this
    let array = [], fill, color, inner, outer;
    let { status, wrongColor, rightColor, innerCircle, outerCircle } = this.props;

    this.state.circles.forEach(function (c, i) {
      fill = c.isActive;
      color = that.state.status === 'wrong' ? wrongColor : rightColor;
      inner = !!innerCircle;
      outer = !!outerCircle;

      array.push(
        <Circle key={'c_' + i} fill={fill} color={color} x={c.x} y={c.y} r={Radius} inner={inner} outer={outer}/>
      )
    });

    return array;
  }

  renderLines() {
    let array = [], color;
    let {status, wrongColor, rightColor} = this.props;

    this.state.lines.forEach(function (l, i) {
      color = status === 'wrong' ? wrongColor : rightColor;
      array.push(
        <Line key={'l_' + i} color={color} start={l.start} end={l.end}/>
      )
    });

    return array;
  }

  setActive(index) {
    this.state.circles[index].isActive = true;

    let circles = this.state.circles;
    this.setState({circles});
  }

  resetActive() {
    this.state.lines = [];
    for (let i = 0; i < 9; i++) {
      this.state.circles[i].isActive = false;
    }

    let circles = this.state.circles;
    this.setState({circles});
    this.props.onReset && this.props.onReset();
  }

  getTouchChar(touch) {
    let x = touch.x;
    let y = touch.y;

    for (let i = 0; i < 9; i++) {
      if (helper.isPointInCircle({x, y}, this.state.circles[i], Radius)) {
        return String(i);
      }
    }

    return false;
  }

  getCrossChar(char) {
    let middles = '13457', last = String(this.lastIndex);

    if (middles.indexOf(char) > -1 || middles.indexOf(last) > -1) return false;

    let point = helper.getMiddlePoint(this.state.circles[last], this.state.circles[char]);

    for (let i = 0; i < middles.length; i++) {
      let index = middles[i];
      if (helper.isEquals(point, this.state.circles[index])) {
        return String(index);
      }
    }

    return false;
  }

  onStart(e, g) {
    let x = e.nativeEvent.pageX;
    let y = e.nativeEvent.pageY - Top - this.state.header;

    let lastChar = this.getTouchChar({x, y});
    if (lastChar) {
      this.isMoving = true;
      this.lastIndex = Number(lastChar);
      this.sequence = lastChar;
      this.resetActive();
      this.setActive(this.lastIndex);

      let point = {
        x: this.state.circles[this.lastIndex].x,
        y: this.state.circles[this.lastIndex].y
      };

      this.refs.line.setNativeProps({start: point, end: point});

      this.props.onStart && this.props.onStart();

      if (this.props.interval > 0) {
        clearTimeout(this.timer);
      }
    }
  }

  onMove(e, g) {
    let x = e.nativeEvent.pageX;
    let y = e.nativeEvent.pageY - Top - this.state.header;

    if (this.isMoving) {
      this.refs.line.setNativeProps({end: {x, y}});

      let lastChar = null;

      if (!helper.isPointInCircle({x, y}, this.state.circles[this.lastIndex], Radius)) {
        lastChar = this.getTouchChar({x, y});
      }

      if (lastChar && this.sequence.indexOf(lastChar) === -1) {
        if (!this.props.allowCross) {
          let crossChar = this.getCrossChar(lastChar);

          if (crossChar && this.sequence.indexOf(crossChar) === -1) {
            this.sequence += crossChar;
            this.setActive(Number(crossChar));
          }
        }

        let lastIndex = this.lastIndex;
        let thisIndex = Number(lastChar);

        this.state.lines.push({
          start: {
            x: this.state.circles[lastIndex].x,
            y: this.state.circles[lastIndex].y
          },
          end: {
            x: this.state.circles[thisIndex].x,
            y: this.state.circles[thisIndex].y
          }
        });

        this.lastIndex = Number(lastChar);
        this.sequence += lastChar;

        this.setActive(this.lastIndex);

        let point = {
          x: this.state.circles[this.lastIndex].x,
          y: this.state.circles[this.lastIndex].y
        };

        this.refs.line.setNativeProps({start: point});
      }
    }

    if (this.sequence.length === 9) this.onEnd();
  }

  onEnd(e, g) {
    if (this.isMoving) {
      let password = helper.getRealPassword(this.sequence);
      this.sequence = '';
      this.lastIndex = -1;
      this.isMoving = false;

      let origin = {x: 0, y: 0};
      this.refs.line.setNativeProps({start: origin, end: origin});

      this.props.onEnd && this.props.onEnd(password);

      if (this.props.interval > 0) {
        this.timer = setTimeout(() => this.resetActive(), this.props.interval);
      }
    }
  }
}


const styles = StyleSheet.create({
  frame: {
    backgroundColor: 'white',
  },
  board: {
    position: 'absolute',
    left: 0,
    top: Top,
    width: Width,
    height: Height,
  },
  message: {
    position: 'absolute',
    left: 0,
    top: Top * 0.85,
    width: Width,
    height: Top / 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  msgText: {
    fontSize: 14
  }
});

module.exports = GesturePassword;