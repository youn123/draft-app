import React from 'react';
import CanvasDraw from "../my-canvas";

import { List, Map } from 'immutable';
import {
  EditorState,
  Modifier,
  SelectionState,
  genKey,
  ContentBlock
} from 'draft-js';

import decorateComponentWithProps from 'decorate-component-with-props';

class MyCanvasDraw extends React.Component {
  state = {
    mode: 'pen'
  };

  onChangeSize = dir => {
    let editorState = this.props.getEditorState();
    let contentState = editorState.getCurrentContent();
    let block = this.props.block;

    let selectionState = new SelectionState({
      anchorKey: block.getKey(),
      anchorOffset: 0,
      focusKey: block.getKey(),
      focusOffset: 0
    });

    let blockData = Map();
    let newHeight = block.getData().get('height');

    if (dir == 'smaller') {
      newHeight = newHeight == 200 ? 200 : newHeight - 100;
    } else {
      newHeight = newHeight == 600 ? 600 : newHeight + 100;
    }

    blockData = blockData.set('height', newHeight);

    let newContentState = Modifier.mergeBlockData(contentState, selectionState, blockData);
    let newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');

    this.props.setEditorState(newEditorState);
  }

  onToggleMode = () => {
    console.log('onToggleMode');
    
    let editorState = this.props.getEditorState();
    let contentState = editorState.getCurrentContent();
    let block = this.props.block;

    this.setState({
      mode: block.getData().get('mode') == 'pen' ? 'eraser' : 'pen'
    });

    let selectionState = new SelectionState({
      anchorKey: block.getKey(),
      anchorOffset: 0,
      focusKey: block.getKey(),
      focusOffset: 0
    });

    let blockData = Map();
    blockData = blockData.set('mode', block.getData().get('mode') == 'pen' ? 'eraser' : 'pen');

    let newContentState = Modifier.mergeBlockData(contentState, selectionState, blockData);
    let newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
    this.props.setEditorState(newEditorState);
  }

  render() {
    let block = this.props.block;
    let height = block.getData().get('height');
    let width = block.getData().get('size');
    let mode = block.getData().get('mode');

    let brush;

    if (mode == 'pen') {
      brush = {
        radius: 1,
        color: 'rgba(0, 0, 0, 1)'
      };
    } else {
      brush = {
        radius: 20,
        color: 'rgba(255, 255, 255, 1)'
      };
    }

    return (
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <CanvasDraw
          brushRadius={brush.radius}
          brushColor={brush.color}
          lazyRadius={0}
          canvasHeight={height}
          canvasWidth={width}
          hideInterface={true}
          gridColor='#7182AD'
          ref={ref => this.canvasRef = ref }
        />
        <div style={{marginLeft: 5, display: 'flex', flexDirection: 'column'}}>
          <button onClick={() => { this.onChangeSize('bigger'); }} style={{marginBottom: '5px'}}>
            Bigger
          </button>
          <button onClick={() => { this.onChangeSize('smaller'); }} style={{marginBottom: '5px'}}>
            Smaller
          </button>
          <button style={mode == 'eraser' ? {backgroundColor: 'orange', color: 'white'} : {}} onClick={() => {
            this.canvasRef && this.canvasRef.undo();
          }}>
            Undo
          </button>
        </div>
      </div>
    );
  }
}

function handleSlashCommand(editorState) {
  let selection = editorState.getSelection();
  let contentState = editorState.getCurrentContent();
  let currentBlock = contentState.getBlockForKey(selection.getStartKey());
  let currentText = currentBlock.getText();

  if (currentText == '/sketch') {
    let selectionState = new SelectionState({
      anchorKey: currentBlock.getKey(),
      anchorOffset: 0,
      focusKey: currentBlock.getKey(),
      focusOffset: currentText.length
    });

    let newContentState = Modifier.setBlockType(contentState, selectionState, 'atomic');

    let blockData = Map();
    blockData = blockData.set('height', 400);
    blockData = blockData.set('size', 800);
    blockData = blockData.set('mode', 'pen');
    newContentState = Modifier.mergeBlockData(newContentState, selectionState, blockData);

    newContentState = newContentState.createEntity('CANVAS', 'IMMUTABLE', {content: ''});
    let entityKey = newContentState.getLastCreatedEntityKey();

    newContentState = Modifier.applyEntity(newContentState, selectionState, entityKey);
  
    let newEditorState = EditorState.push(editorState, newContentState, 'change-block-type');

    const newBlock = new ContentBlock({
      key: genKey(),
      type: 'unstyled',
      text: '',
      characterList: List()
    });

    newContentState = newEditorState.getCurrentContent();
    let newBlockMap = newContentState.getBlockMap().set(newBlock.key, newBlock);

    newContentState = newContentState.merge({
      blockMap: newBlockMap
    });

    newEditorState = EditorState.push(newEditorState, newContentState, 'add-block');

    newEditorState = EditorState.forceSelection(newEditorState, new SelectionState({
        anchorKey: newBlock.getKey(),
        anchorOffset: 0,
        focusKey: newBlock.getKey(),
        focusOffset: 0
      })
    );

    return newEditorState;
  } else {
    return editorState;
  }
}

const createSketchPlugin = config => {
  const store = {};
  return {
    store,
    initialize({ setEditorState, getEditorState }) {
      store.setEditorState = setEditorState;
      store.getEditorState = getEditorState;
    },
    handleBeforeInput(character, editorState) {
      if (character.match(/[A-z-0-9_*~`]/)) {
        return 'not-handled';
      }

      const newEditorState = handleSlashCommand(editorState);

      if (editorState !== newEditorState) {
        store.setEditorState(newEditorState);
        return 'handled';
      }

      return 'not-handled';
    },
    MyCanvasDraw: decorateComponentWithProps(MyCanvasDraw, store)
  };
}

export default createSketchPlugin;