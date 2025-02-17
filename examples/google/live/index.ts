/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from 'aiae';

function apiKey(): string {
    const STORAGE_KEY = 'GENAI_API_KEY';
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
        key = prompt('API KEY') ?? '';
        if (key) {
            localStorage.setItem(STORAGE_KEY, key);
        }
    }
    return key;
}


class LiveDemo extends HTMLElement {
    static readonly observedAttributes = [];
  
    private audioEl = new Audio();
    private statusEl = document.createElement('div');
    private outputTextEl = document.createElement('div');
  
    connectedCallback() {
      const shadow = this.attachShadow({mode: 'open'});
  
      shadow.appendChild(this.audioEl);
  
      this.statusEl.innerText = 'Hold key to speak';
      shadow.appendChild(this.statusEl);
  
      let stream: MediaStream | null = null;
  
      let firstKeyDown = true;

      const session = aiae.sessions.local();

      const audioIn = session.createPipe<aiae.content.AudioChunk>();
    
      const liveAction = new aiae.actions.google.genai.Live(apiKey(), 'gemini-2.0-flash-exp');

      const outputs = session.run(liveAction, {audio: audioIn}, ['audio']);

      const turnOnMic = async () => {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        const audioChunks = aiae.content.mediaStreamToAudioChunks(stream);
        await audioIn.write(audioChunks);
      };
  
      const keydown = (event: KeyboardEvent) => {
        if (event.altKey || event.metaKey || event.ctrlKey) {
          // Don't trigger on alt-tab, etc.
          document.addEventListener('keydown', keydown, {once: true});
          return;
        }
        this.statusEl.innerText = 'Mic is live';
        void turnOnMic();

        if (firstKeyDown) {
          firstKeyDown = false;
          void this.audioEl.play();
        }
      };
  
      document.addEventListener('keydown', keydown, {once: true});
      document.addEventListener('keyup', () => {
        this.statusEl.innerText = 'Hold key to speak';
        if (stream) {
          // Stop recording.
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          stream = null;
        }
        document.addEventListener('keydown', keydown, {once: true});
      });

      const mediaOut = aiae.content.audioChunksToMediaStream(outputs.audio);
      this.audioEl.srcObject = mediaOut.stream;
  
      this.outputTextEl.style.fontFamily = 'monospace';
      shadow.appendChild(this.outputTextEl);
  
    }
  }
  
  customElements.define('live-demo', LiveDemo);
  
  declare global {
    interface HTMLElementTagNameMap {
      'live-demo': LiveDemo;
    }
  }

function main() {
    const el = document.createElement('live-demo');
    document.body.appendChild(el);
}

main();
