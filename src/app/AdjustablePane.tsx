import * as React from "react";

interface Props {}

const WIDTH_STEP = 10;

const getSavedWidth = () => {
  const widthStr = localStorage.getItem("dox_width");
  return widthStr ? parseFloat(widthStr) : null;
};

const setSavedWidth = (newWidth) => {
  localStorage.setItem("dox_width", String(newWidth));
};

const determineWidth = () => {
  let width = 2;
  let maxWidth = 99;
  if (window) {
    maxWidth = Math.floor(window.innerWidth - 100);
    width = maxWidth < 400 ? 0 : maxWidth < 1000 ? maxWidth / 2 : 500;
  }
  const savedWidth = getSavedWidth();
  if (savedWidth !== null) {
    width = savedWidth;
  }
  return [width, maxWidth];
};

export const AdjustablePane: React.FC<Props> = (props) => {
  const [defWidth, maxWidth] = determineWidth();
  const [width, setWidth] = React.useState<number>(defWidth);
  const resizerRef = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    let moving = false;
    const mouseDownListener = (event: MouseEvent) => {
      if (event.target === resizerRef.current) {
        moving = true;
        event.preventDefault(); // prevents text being selected
      }
    };
    window.addEventListener("mousedown", mouseDownListener);
    const mouseUpListener = (event: MouseEvent) => {
      moving = false;
    };
    window.addEventListener("mouseup", mouseUpListener);
    const mouseMoveListener = (event: MouseEvent) => {
      if (moving) {
        let newWidth = Math.ceil(event.clientX / WIDTH_STEP) * WIDTH_STEP;
        if (newWidth > maxWidth) {
          newWidth = maxWidth;
        }
        setWidth(newWidth);
        setSavedWidth(newWidth);
      }
    };
    window.addEventListener("mousemove", mouseMoveListener);
    return () => {
      window.removeEventListener("mousedown", mouseDownListener);
      window.removeEventListener("mouseup", mouseUpListener);
      window.removeEventListener("mousemove", mouseMoveListener);
    };
  }, []);

  const style = {
    width: width + "px",
  };
  return (
    <div id="left_pane" style={style}>
      <div id="left_pane_resizer" ref={resizerRef}></div>
      {width > 0 && props.children}
    </div>
  );
};
