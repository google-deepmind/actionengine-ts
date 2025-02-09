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

export function documentToText(document: Document) {
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


export async function fetchDocument(url: string) {
  const docsId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
  const docsApi = `${DOCS_API}${docsId}`;
  var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
  const response = await fetch(
    `${docsApi}?access_token=${params['access_token']}`);
  const documentData = await response.json();
  return documentData;
}
