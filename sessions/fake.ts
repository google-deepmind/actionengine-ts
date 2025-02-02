/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input, Output, ROLE, Session } from "../interfaces.js";
import { sessionWithActions } from "./session.js";
import { textChunk } from "../content/content.js";
import { local } from "./local.js";
import { ReverseContent, GenerateContent } from "../actions/index.js";

class FakeGenerateContent extends GenerateContent {
    async run(session: Session, inputs: { prompt: Input }, outputs: { response: Output }): Promise<void> {
        outputs.response.write(textChunk("How does that make you feel?", { role: ROLE.ASSISTANT }))
    }
}

export const fake = sessionWithActions(local, [[GenerateContent, FakeGenerateContent], [ReverseContent, ReverseContent]]);