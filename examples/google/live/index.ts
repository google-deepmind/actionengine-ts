/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from 'aiae';
import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
// import '@material/web/all.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

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
  @state() accessor video = false;
  @state() accessor screen = false;
  @state() accessor files = false;

  @query('.audio-out') accessor audioOut!: HTMLAudioElement;
  @query('.video-out') accessor videoOut!: HTMLVideoElement;
  @query('.screen-out') accessor screenOut!: HTMLVideoElement;
  @query('.files-out') accessor filesOut!: HTMLDivElement;

  private micStream?: MediaStream;
  private videoStream?: MediaStream;
  private screenStream?: MediaStream;

  private session = aiae.sessions.local();
  private micIn = this.session.createPipe<aiae.content.AudioChunk>();
  private videoIn = this.session.createPipe<aiae.content.ImageChunk>();
  private screenIn = this.session.createPipe<aiae.content.ImageChunk>();
  private liveAction = new aiae.actions.google.genai.Live(apiKey(), 'gemini-2.0-flash-exp');
  private outputs = this.session.run(this.liveAction, { audio: this.micIn, video: this.videoIn, screen: this.screenIn, }, ['audio']);

  override firstUpdated(props: PropertyValueMap<unknown>): void {
    super.firstUpdated(props);
    const media = aiae.content.audioChunksToMediaStream(this.outputs.audio);
    this.audioOut.srcObject = media;
    // First interaction trigger playing audio.
    this.shadowRoot?.children[0].addEventListener('click', () => {
      void this.audioOut.play();
    }, { once: true });
  }
  private async micOn() {
    this.mic = true;
    this.micStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    const audioChunks = aiae.content.mediaStreamToAudioChunks(this.micStream);
    await this.micIn.write(audioChunks);
  }

  private micOff() {
    this.mic = false;
    this.micStream?.getTracks().forEach(t => { t.stop(); });
  }

  private async videoOn() {
    this.video = true;
    this.videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    this.videoOut.srcObject = this.videoStream;
    this.videoOut.style.display = "flex";
    const videoChunks = aiae.content.mediaStreamToImageChunks(this.videoStream);
    await this.videoIn.write(videoChunks);
  }

  private videoOff() {
    this.video = false;
    this.videoOut.style.display = "none";
    this.videoStream?.getTracks().forEach(t => { t.stop(); });
  }

  private async screenOn() {
    this.screen = true;
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    this.screenOut.srcObject = this.screenStream;
    this.screenOut.style.display = "flex";
    const screenChunks = aiae.content.mediaStreamToImageChunks(this.screenStream);
    await this.screenIn.write(screenChunks);
  }

  private screenOff() {
    this.screen = false;
    this.screenOut.style.display = "none";
    this.screenStream?.getTracks().forEach(t => { t.stop(); });
  }

  private filesOn() {
    this.files = true;
    this.filesOut.style.display = 'flex';
  }

  private filesOff() {
    this.files = false;
    this.filesOut.style.display = 'none';
  }

  protected override render() {

    const micCb = () => { if (this.mic) this.micOff(); else void this.micOn(); }
    const videoCb = () => { if (this.video) this.videoOff(); else void this.videoOn(); }
    const screenCb = () => { if (this.screen) this.screenOff(); else void this.screenOn(); }
    const filesCb = () => { if (this.files) this.filesOff(); else this.filesOn(); }

    return html`<div class="container">
      <div class="inputs">
        <audio class="audio-out"></audio>
        <video autoplay muted class="screen-out"></video>
        <video autoplay muted class="video-out"></video>
        <div class="files-out">lorem ipsum hello world</div>
      </div>
      <div class="input_controls">
          <md-icon-button @click="${micCb}" toggle>
            <md-icon>mic</md-icon>
            <md-icon slot="selected">mic_off</md-icon>
          </md-icon-button>
          <md-icon-button @click="${videoCb}" toggle>
            <md-icon>videocam</md-icon>
            <md-icon slot="selected">videocam_off</md-icon>
          </md-icon-button>
          <md-icon-button @click="${screenCb}" toggle>
            <md-icon>devices</md-icon>
            <md-icon slot="selected">devices_off</md-icon>
          </md-icon-button>
          <md-icon-button @click="${filesCb}" toggle>
            <md-icon>attach_file</md-icon>
            <md-icon slot="selected">attach_file_off</md-icon>
          </md-icon-button>
      </div>
    </div>`;
  }

  static override styles = css`
    .container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      justify-content: center;
    }
    .input_controls {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      padding-bottom: 4rem;
    }
    .inputs {
      display: flex;
      justify-content: space-evenly;
      overflow: hidden;
    }
    .inputs > * {
      display: none;
      object-fit: contain;
      width: 100%;
      height: 100%;
    }
    .files-out {
      justify-content: center;
      align-items: center;
    }
  `;

}

function main() {
  const el = document.createElement('live-demo');
  document.body.appendChild(el);
}

main();
