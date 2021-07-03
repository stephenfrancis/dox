
import * as React from "react";
// import * as RootLog from "loglevel";


interface Props {}

interface State {
  width: number;
}


export default class AdjustablePane extends React.Component<Props, State> {
  private max_width: number;

  constructor(props) {
    super(props);
    this.max_width = 6;
    this.state = {
      width: this.determineWidth(), // 0 = minimized, 1, 2, etc = pixels/200
    };
  }


  determineWidth() {
    var width = 2;
    if (window) {
      width = Math.floor(window.innerWidth / 450);
      this.max_width = Math.floor(window.innerWidth / 350);
    }
    return width;
  }


  render() {
    const style = {
      position: "relative",
      width: (this.state.width * 200) + "px",
    } as any;
    if (this.state.width === 0) {
      style.width = "20px";
      style.padding = "5px";
    }
    return (
      <div id="left_pane" style={style}>
        {this.renderAdusterIcons()}
        {this.state.width > 0 && this.props.children}
      </div>
    );
  }


  renderAdusterIcons() {
    return (
      <div style={{
        position: "absolute",
        fontSize: "16px",
        cursor: "pointer",
        left: "5px",
        top: "5px",
      }}>
        {(this.state.width > 0) && this.renderWidthSmaller()}
        {(this.state.width < this.max_width) && this.renderWidthLarger()}
      </div>
    );
  }


  renderWidthSmaller() {
    const that = this;
    function handler() {
      if (that.state.width < 1) {
        return;
      }
      that.setState({
        width: that.state.width - 1,
      });
    }
    return (
      <span onClick={handler}>❮</span>
    );
  }


  renderWidthLarger() {
    const that = this;
    function handler() {
      if (that.state.width >= that.max_width) {
        return;
      }
      that.setState({
        width: that.state.width + 1,
      });
    }
    return (
      <span onClick={handler}>❯</span>
    );
  }

}
