import * as random from 'webgame-lib/lib/random';
import { Rect } from 'webgame-lib/lib/math';
import Partition from './partition.js';

const SPACE = 1;

const MIN_DIM = 7;
const MAX_DIM = 16;

class Room {

  constructor(part, minD) {
    let w = random.i(minD, part.w / 2);
    let h = random.i(minD, part.h / 2);
    let x = part.x + random.i(0, part.w - w);
    let y = part.y + random.i(0, part.h - h);
    this.bounds = new Rect(x, y, w, h);
  }

}

export class Dungeon {

  constructor(w, h) {
    this.bounds = new Rect(0, 0, w, h);
  }

  buildRooms(root) {
    this.rooms = [];
    let gen = root.gen();
    let picked = false;
    while (true) {
      let { value, done } = gen.next(picked);
      if (done) {
        break;
      }
      picked = value.leaf;
      if (!picked) {
        this.rooms.push(new Room(value.rect, MIN_DIM));
      }
    }
  }

  connect() {
    // randomly connect nearby dungeons
    for (let room of this.rooms) {
      let nearest = null;
      for (let others of this.rooms) {
        if (others !== room) {
        }
      }
    }
    // build MST
  }

}

