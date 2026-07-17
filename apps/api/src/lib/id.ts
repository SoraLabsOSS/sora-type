import { customAlphabet } from "nanoid";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 8;

const nanoid = customAlphabet(ALPHABET, ID_LENGTH);

export function generateSessionId(): string {
  return nanoid();
}
