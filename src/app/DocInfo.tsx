import Debug from "debug";
import * as React from "react";
import Doc from "./Doc";

const debug = Debug("app/DocInfo");

interface Props {
  doc: Doc;
}

export const DocInfo: React.FC<Props> = (props) => {
  const [loadError, setLoadError] = React.useState<string>(undefined);

  React.useEffect(() => {
    setLoadError(undefined);
  }, [props.doc]);

  props.doc
    .getPromiseMarkdown()
    .then(() => {
      debug(
        `DocInfo ${props.doc.getPath()} promise returned, ${props.doc.isLoaded()}`
      );
      setLoadError(null);
    })
    .catch((err) => {
      setLoadError(String(err));
    });

  const renderChildren = () => {
    const children = props.doc
      .getChildDocs()
      .map((doc) => <DocInfo doc={doc} key={doc.getName()} />);
    return <ul>{children}</ul>;
  };

  const renderFailed = () => {
    return (
      <li className="error">
        failed to load: {props.doc.getName()}, error: {loadError}
      </li>
    );
  };

  const renderReady = () => {
    return (
      <li>
        <a href={props.doc.getHash()}>{props.doc.getTitle()}</a>
        <span className="lowkey"> {props.doc.getName()}</span>
        {props.doc.hasChildren() && renderChildren()}
      </li>
    );
  };

  const renderUnready = () => {
    return <li>loading: {props.doc.getName()}</li>;
  };

  switch (loadError) {
    case undefined:
      return renderUnready();
    case null:
      return renderReady();
    default:
      return renderFailed();
  }
};
