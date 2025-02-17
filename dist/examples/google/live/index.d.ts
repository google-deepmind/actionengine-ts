/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
declare class LiveDemo extends HTMLElement {
    static readonly observedAttributes: never[];
    private audioEl;
    private statusEl;
    private outputTextEl;
    connectedCallback(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'live-demo': LiveDemo;
    }
}
export {};
