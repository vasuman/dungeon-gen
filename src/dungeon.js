import * as random from './random.js';
import { Box } from 'webgame-lib/lib/math';

const SPLIT_VAR = 0.2;
const SQUARENESS = 2;
const MIN_ROOMS = 8;
const MIN_DIM = 7;
const MAX_DIM = 16;
const SELECT = 5;

class Room {

  constructor(part, minD) {
    let w = random.i(minD, part.w / 2);
    let h = random.i(minD, part.h / 2);
    let x = part.x + random.i(0, part.w - w);
    let y = part.y + random.i(0, part.h - h);
    this.box = new Box(x, y, w, h);
  }

}

export function splitRec(process, bounds, varf, squareness, depth = 0) {
  let vert = random.bool(bounds.w / bounds.h, squareness);
  let f = random.f(0.5 - varf, 0.5 + varf);

  for (let child of bounds.split(f, vert)) {
    if (process(child.round(), depth)) {
      splitRec(process, child, varf, squareness, depth + 1);
    }
  }
}

export class Dungeon {

  constructor(w, h) {
    this.bounds = new Box(0, 0, w, h);
  }

  buildRooms() {
    this.rooms = [];

    splitRec((part) => {
      if (Math.min(part.w, part.h) < MIN_DIM) {
        // discard
        return false;
      }
      if (Math.max(part.w, part.h) > MAX_DIM) {
        // continue splitting
        return true;
      }
      if (random.bool(SELECT)) {
        // make room
        this.rooms.push(new Room(part.shrink(2), MIN_DIM - 1));
        return false;
      }
      return true;
    }, this.bounds, SPLIT_VAR, SQUARENESS);

    console.log(this.rooms);
  }

  connect() {

    // randomly connect nearby dungeons
    for (let room of this.rooms) {
      let nearest = null;
      for (let others of this.rooms) {
        if (others !== room) {
          let dist = others.box.middle().round()
        }
      }
    }
    // build MST
  }

}

