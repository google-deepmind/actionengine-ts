/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LitElement, PropertyValueMap } from 'lit';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
export declare class LiveDemo extends LitElement {
    accessor mic: boolean;
    accessor video: boolean;
    accessor screen: boolean;
    accessor extra: boolean;
    accessor audioOut: HTMLAudioElement;
    accessor videoOut: HTMLVideoElement;
    accessor screenOut: HTMLVideoElement;
    accessor extraOut: HTMLDivElement;
    private micStream?;
    private videoStream?;
    private screenStream?;
    private session;
    private micIn;
    private videoIn;
    private screenIn;
    private liveAction;
    private outputs;
    firstUpdated(props: PropertyValueMap<unknown>): void;
    private micOn;
    private micOff;
    private videoOn;
    private videoOff;
    private screenOn;
    private screenOff;
    private extraOn;
    private extraOff;
    protected render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
