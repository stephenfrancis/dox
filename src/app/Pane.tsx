import Debug from "debug";
import * as React from "react";
import Doc from "./Doc";

const debug = Debug("app/Pane");

interface Props {
  doc: Doc;
  highlight_link?: Doc;
}

export const Pane: React.FC<Props> = (props) => {
  const [loadError, setLoadError] = React.useState<string>(undefined);
  const [content, setContent] = React.useState<string>();

  const load = () => {
    const highlight_link_path =
      props.highlight_link && props.highlight_link.getPath();
    props.doc
      .getPromiseHTML(highlight_link_path)
      .then((content) => {
        setLoadError(null);
        setContent(content);
      })
      .catch((err) => {
        setLoadError(String(err));
        setContent(null);
      });
  };

  React.useEffect(() => {
    setLoadError(undefined);
    load();
  }, [props.doc, props.highlight_link]);

  const style: any = {};
  debug("Pane.render() " + props.doc.getPath() + ", " + loadError);
  if (loadError !== null) {
    style.opacity = 0.5;
  }
  const html =
    loadError === undefined
      ? "Loading..."
      : loadError === null
      ? content
      : "<p>Error occurred: " + loadError + "</p>";
  return (
    <div style={style}>
      <p
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      ></p>
    </div>
  );
};
