/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from 'aiae';
import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

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


@customElement('live-demo')
export class LiveDemo extends LitElement {
  @state() accessor mic = false;
  @query('.audio-out') accessor audioOut!: HTMLAudioElement;

  private micStream?: MediaStream;
  private session = aiae.sessions.local();
  private micIn = this.session.createPipe<aiae.content.AudioChunk>();
  private liveAction = new aiae.actions.google.genai.Live(apiKey(), 'gemini-2.0-flash-exp');
  private outputs = this.session.run(this.liveAction, {audio: this.micIn}, ['audio']);

  override firstUpdated(props: PropertyValueMap<unknown>): void {
    super.firstUpdated(props);
    const media = aiae.content.audioChunksToMediaStream(this.outputs.audio);
    this.audioOut.srcObject = media.stream;
  }
  private async micOn() {
    this.mic = true;
    void this.audioOut.play();
    this.micStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    const audioChunks = aiae.content.mediaStreamToAudioChunks(this.micStream);
    await this.micIn.write(audioChunks);
  }

  private micOff() {
    this.mic = false;
    console.log('mic off', this.mic);
    this.micStream?.getTracks().forEach(t => { t.stop(); });
  }

  protected override render() {
    console.log('audio out', this.audioOut);

    const micCb = () => { if (this.mic) this.micOff(); else void this.micOn(); }

    return html`<div class="container">
      <div class="inputs">
        <audio class="audio-out"></audio>
        <video class="screen-out"></video>
        <video class="video-out"></video>
        <div class="text-out"></div>
      </div>
      <div class="input_controls">
          <button @click="${micCb}" class="material-symbols-outlined mic button">mic</button>
          <button class="material-symbols-outlined video button">videocam</button>
          <button class="material-symbols-outlined screen button">devices</button>
      </div>
    </div>`;
  }
  
  static override styles = css`
    .container {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      height: 100vh;
    }
    .input_controls {
      padding: 1rem;
      padding-bottom: 4rem;
    }
    .mic {
      background-color: #2a4bcf;
    }
    .video {
      background-color: #a81a1a
    }
    .screen {
      background-color: #aeb107;
    }
    .button {
      color: white;
      margin: 1rem;
      border: none;
    }
    .material-symbols-outlined {
      font-family: "Material Symbols Outlined";
      font-size: 24px;
    }
  `;

}

function main() {
  const el = document.createElement('live-demo');
  document.body.appendChild(el);
}

main();
