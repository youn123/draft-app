import { React, Component } from 'react';
import Editor from 'draft-js-plugins-editor';
import { EditorState, CompositeDecorator, convertToRaw, convertFromRaw, SelectionState } from 'draft-js';
import { withAITracking } from '@microsoft/applicationinsights-react-js';

import createSketchPlugin from './plugins';
import createMarkdownShortcutsPlugin from 'draft-js-markdown-shortcuts-plugin';

import appInsights, { reactPlugin } from './telemetry';

import './App.css';

const INLINE_CODE_REGEX = /(?:^|\s|\n|[^A-z0-9_*~`])(`)((?!\1).*?)(\1)($|\s|\n|[^A-z0-9_*~`])/g;

const initialContentData = '{"blocks":[{"key":"5r7hh","text":"Directions","type":"header-two","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"aklih","text":"Enter /sketch to create a sketch block like one below. Try drawing on it!","type":"unordered-list-item","depth":0,"inlineStyleRanges":[{"offset":6,"length":7,"style":"CODE"}],"entityRanges":[],"data":{}},{"key":"6af9f","text":"/sketch","type":"atomic","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":0,"length":7,"key":0}],"data":{"height":400,"size":800,"mode":"pen"}},{"key":"3u42f","text":"Markdown shortcuts (not all) are supported. Make words bold by surrounding them with ** .","type":"unordered-list-item","depth":0,"inlineStyleRanges":[{"offset":55,"length":4,"style":"BOLD"},{"offset":85,"length":2,"style":"CODE"}],"entityRanges":[],"data":{}},{"key":"4lv3f","text":"I put this together quick and dirty. There are probably bugs.","type":"unordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"1fda1","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{"0":{"type":"CANVAS","mutability":"IMMUTABLE","data":{"content":""}}}}';

const compositeDecorator = new CompositeDecorator([
  {
    strategy: handleInlineCodeStrategy,
    component: InlineCodeSpan,
  },
]);

function handleInlineCodeStrategy(contentBlock, callback, contentState) {
  findWithRegex(INLINE_CODE_REGEX, contentBlock, callback);
}

function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText();
  let matchArr, start;
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
  }
}

function InlineCodeSpan(props) {
  return (
    <span {...props} style={{backgroundColor: '#E1E5EE', color: 'red', borderRadius: '3px', padding: '0px 2px 0px 2px'}}>
      {props.children}
    </span>
  );
};

const myStyleMap = {
  'CODE': {
    backgroundColor: '#E1E5EE',
    color: 'red',
    borderRadius: '3px',
    padding: '0px 2px 0px 2px'
  }
};

const votedButtonStyle = {
  marginRight: '5px',
  backgroundColor: '#17A398',
  color: 'white' 
};

const sketchPlugin = createSketchPlugin();
const MyCanvasDraw = sketchPlugin.MyCanvasDraw;

const markdownShortcutsPlugin = createMarkdownShortcutsPlugin();

const plugins = [markdownShortcutsPlugin, sketchPlugin];

class App extends Component {
  state = {
    editorState: EditorState.createWithContent(convertFromRaw(JSON.parse(initialContentData))),
    // editorState: EditorState.createEmpty(),
    voted: null
  };

  componentDidMount() {
    this.editor.focus();

    let editorState = this.state.editorState;
    let contentState = editorState.getCurrentContent();
    let block = contentState.getLastBlock();

    let selectionState = new SelectionState({
      anchorKey: block.getKey(),
      anchorOffset: 0,
      focusKey: block.getKey(),
      focusOffset: 0
    });

    this.onChange(EditorState.forceSelection(editorState, selectionState));

    setTimeout(() => {
      appInsights.trackEvent({name: 'Opened'});
    }, 1000);
  }

  onChange = editorState => {
    this.setState({ editorState });

    // Note: need to wait on tick to make sure the DOM node has been create by Draft.js
    // setTimeout(() => {
    //   let node = document.querySelectorAll(`[data-offset-key="${offsetKey}"]`)[0];
    //   console.log(`node top: ${node.getBoundingClientRect().top}`);
    // }, 0);
  }

  onVote = vote => {
    this.setState({voted: vote});

    appInsights.trackEvent({name: 'Voted'}, {
      vote
    });
  }

  render() {
    return (
      <div className="App">
        <Editor
          customStyleMap={myStyleMap}
          editorState={this.state.editorState}
          onChange={this.onChange}
          ref={element => { this.editor = element; }}
          plugins={plugins}
          blockRendererFn={block => {
            let { editorState } = this.state;
            let contentState = editorState.getCurrentContent();

            if (block.getType() === 'atomic') {
              const entityKey = block.getEntityAt(0);

              if (entityKey != null) {
                const entity = contentState.getEntity(entityKey);

                if (entity != null && entity.getType() === 'CANVAS') {
                  return {
                    component: MyCanvasDraw,
                    editable: false
                  };
                }
              }
            }
          }}
        />
        <div style={{marginLeft: '5%'}}>
          <p style={{marginBottom: '10px'}}>Thanks for taking the time to look. It would help if could tell me what you think.</p>
          <div>
            {/* <button onClick={() => {
              console.log(JSON.stringify(convertToRaw(this.state.editorState.getCurrentContent())));
            }}>
              Save
            </button> */}
            <button
              style={this.state.voted !== 'Not interested' ? {marginRight: '5px'} : votedButtonStyle}
              onClick={() => { this.onVote('Not interested'); }}
            >
              Not interested.
            </button>
            <button
              style={this.state.voted !== 'Interested' ? {marginRight: '5px'} : votedButtonStyle}
              onClick={() => { this.onVote('Interested'); }}
            >
              This is interesting.
            </button>
            <button
              style={this.state.voted !== 'Very interested' ? {marginRight: '5px'} : votedButtonStyle}
              onClick={() => { this.onVote('Very interested'); }}
            >
              Just what I need!
            </button>
            {this.state.voted && <p style={{marginTop: '5px'}}>Thanks :)</p>}
          </div>
        </div>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, App);
