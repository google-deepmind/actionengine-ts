/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Processor} from '../../interfaces.js';
import {textChunk, chunkText} from '../../content/content.js';
import { maybeAuthenticate } from './auth.js';

const DOCS_API = 'https://docs.googleapis.com/v1/documents/';

interface TextRun {
  content?: string;
}

interface Element {
  textRun: TextRun;
}

interface Paragraph {
  elements: Element[];
}

interface Content {
  paragraph?: Paragraph;
}

interface Body {
  content: Content[];
}

interface Document {
  title: string;
  body: Body;
}

function documentToText(document: Document) {
  let documentText = '';
  documentText += document.title + '<br><br>';
  for (const content of document.body.content) {
    if (content.paragraph) {
      for (const element of content.paragraph.elements) {
        if (element.textRun.content) {
          documentText += element.textRun.content;
        }
      }
    }
  }
  return documentText;
}

async function fetchDocument(url: string) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error(`Bad url ${url}`)
  }
  const docsId = match[1];
  const docsApi = `${DOCS_API}${docsId}`;
  const params = JSON.parse(localStorage.getItem('oauth2-test-params') || '');
  const response = await fetch(
    `${docsApi}?access_token=${params['access_token']}`);
  const documentData = await response.json();
  return documentData;
}

/** Converts a docUrl imput to docText. */
export const docToText: Processor<'docUrl', 'docText'> =
    async function*(chunks) {

  maybeAuthenticate();

  for await (const [k, c] of chunks) {
    if (k === 'docUrl') {
      const document = await fetchDocument(chunkText(c));
      const documentText = documentToText(document);
      yield ['docText', textChunk(documentText)];
    } else {
      yield [k, c];
    }
  }
}
