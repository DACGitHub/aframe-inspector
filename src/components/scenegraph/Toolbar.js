import classnames from 'classnames';
import React from 'react';
import Events from '../../lib/Events.js';
import { saveBlob, saveString } from '../../lib/utils';

const LOCALSTORAGE_MOCAP_UI = 'aframeinspectormocapuienabled';

function filterHelpers(scene, visible) {
  scene.traverse(o => {
    if (o.userData.source === 'INSPECTOR') {
      o.visible = visible;
    }
  });
}

function getSceneName(scene) {
  return scene.id || slugify(window.location.host + window.location.pathname);
}

/**
 * Slugify the string removing non-word chars and spaces
 * @param  {string} text String to slugify
 * @return {string}      Slugified string
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '-') // Replace all non-word chars with -
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Tools and actions.
 */
export default class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isPlaying: false
    };
  }

  // exportSceneToGLTF() {
  //   ga('send', 'event', 'SceneGraph', 'exportGLTF');
  //   const sceneName = getSceneName(AFRAME.scenes[0]);
  //   const scene = AFRAME.scenes[0].object3D;
  //   filterHelpers(scene, false);
  //   AFRAME.INSPECTOR.exporters.gltf.parse(
  //     scene,
  //     function(buffer) {
  //       filterHelpers(scene, true);
  //       const blob = new Blob([buffer], { type: 'application/octet-stream' });
  //       saveBlob(blob, sceneName + '.glb');
  //     },
  //     { binary: true }
  //   );
  // }

  addEntity() {
    Events.emit('entitycreate', { element: 'a-entity', components: {} });
  }

  /**
   * Try to write changes with aframe-inspector-watcher.
   */
  writeChanges = () => {
    // const xhr = new XMLHttpRequest();
    // xhr.open('POST', 'http://localhost:51234/save');
    // xhr.onerror = () => {
    //   alert('aframe-watcher not running. This feature requires a companion service running locally. npm install aframe-watcher to save changes back to file. Read more at supermedium.com/aframe-watcher');
    // };
    // xhr.setRequestHeader('Content-Type', 'application/json');
    // xhr.send(JSON.stringify(AFRAME.INSPECTOR.history.updates));


    var password = prompt("Please enter password to save changes", "password");

    if (password == 'grays_@$$@_') {
      // make sure all changes are flushed to dom
      document.querySelector('a-scene').flushToDOM(true);

      var parser = new window.DOMParser();
      // var xmlDoc = document.querySelector('a-scene');
      var xmlDoc = parser.parseFromString(document.documentElement.innerHTML, 'text/html');

      // Remove all the components that are being injected by aframe-inspector or aframe
      // @todo Use custom class to prevent this hack
      var elementsToRemove = xmlDoc.querySelectorAll([
      // Injected by the inspector
      '[data-aframe-inspector]', 'script[src$="aframe-inspector.js"]', 'style[type="text/css"]','[data-aframe-canvas]',
      // Injected by aframe
      '[aframe-injected]', 'style[data-href$="aframe.css"]','.a-loader-title',
      // Injected by stats
      '.rs-base', 'style[data-href$="rStats.css"]'].join(','));
      for (var i = 0; i < elementsToRemove.length; i++) {
        var el = elementsToRemove[i];
        el.parentNode.removeChild(el);
      }


      var xmlString;
      var dom;
      // IE
      if (window.ActiveXObject) {
        dom = xmlDoc.xml;
      } else {
        // Mozilla, Firefox, Opera, etc.
        dom = new window.XMLSerializer().serializeToString(xmlDoc);
      }

      console.log(dom);
      console.log(typeof dom);
      var changes = {'dom': dom, 'password':password };
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/save');
      xhr.onerror = function () {
        alert('Changes not saved. Error with server. :(');
      };
      xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            alert("Changes saved :)");
          } else if (xhr.status == 400) {
            alert("Changes failed to save.");
          } else {
            alert("Saving changes.");
          }
      }
      xhr.setRequestHeader('Content-Type', 'application/json');
      // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhr.send(JSON.stringify(changes));
    } else {
      alert("Password incorrect. Changes not saved");
    }

  };

  toggleScenePlaying = () => {
    if (this.state.isPlaying) {
      AFRAME.scenes[0].pause();
      this.setState({isPlaying: false});
      AFRAME.scenes[0].isPlaying = true;
      document.getElementById('aframeInspectorMouseCursor').play();
      return;
    }
    AFRAME.scenes[0].isPlaying = false;
    AFRAME.scenes[0].play();
    this.setState({isPlaying: true});
  }

  render() {
    const watcherClassNames = classnames({
      button: true,
      fa: true,
      'fa-save': true
    });
    const watcherTitle = 'Write changes with aframe-watcher.';

    return (
      <div id="toolbar">
        <div className="toolbarActions">
          <a
            className="button fa fa-plus"
            title="Add a new entity"
            onClick={this.addEntity}
          />
          <a
            id="playPauseScene"
            className={'button fa ' + (this.state.isPlaying ? 'fa-pause' : 'fa-play')}
            title={this.state.isPlaying ? 'Pause scene' : 'Resume scene'}
            onClick={this.toggleScenePlaying}>
          </a>
          {/* <a
            className="gltfIcon"
            title="Export to GLTF"
            onClick={this.exportSceneToGLTF}>
            <img src={process.env.NODE_ENV === 'production' ? 'https://aframe.io/aframe-inspector/assets/gltf.svg' : '../assets/gltf.svg'} />
          </a> */}
          <a
            className={watcherClassNames}
            title={watcherTitle}
            onClick={this.writeChanges}
          />
        </div>
      </div>
    );
  }
}
