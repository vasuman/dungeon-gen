import * as random from 'webgame-lib/lib/random';
import { Rect } from 'webgame-lib/lib/math';
import Partition from './partition.js';

const SPACE = 2;

const MIN_DIM = 7;
const MAX_DIM = 16;

const CUTOFF_SIZE = MIN_DIM + 2 * SPACE;

class Room {

  constructor(bounds) {
    this.bounds = bounds;
  }

}

export class Dungeon {

  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.grid = new Array(w * h);
    for (let i = 0; i < w * h; i++) {
      this.grid[i] = 0;
    }
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
      if (picked) {
        let r = value.rect;
        if (r.w < CUTOFF_SIZE || r.h < CUTOFF_SIZE) continue;
        let w = random.i(MIN_DIM, r.w - SPACE);
        let h = random.i(MIN_DIM, r.h - SPACE);
        let x = r.x + random.i(SPACE, r.w - w);
        let y = r.y + random.i(SPACE, r.h - h);
        this.rooms.push(new Room(new Rect(x, y, w, h)));
      }
    }
    for (let room of this.rooms) {
      let b = room.bounds;
      for (let i = b.x; i < b.x + b.w; i++) {
        for (let j = b.y; j < b.y + b.h; j++) {
          console.log(i, j);
          this.grid[j * this.w + i] = 1;
        }
      }
    }
  }

  connect(roomA, roomB) {
    // get split plane
    // merge
  }

  findNearest(room) {
    let minDist = Infinity;
    let candidate = null;
    let center = room.bounds.center();
    for (let other of this.rooms) {
      if (other !== room) {
        let dist = other.bounds.center().blockDist(center);
        if (dist < minDist) {
          minDist = dist;
          candidate = other;
        }
      }
    }
    return candidate;
  }

  buildCorridors() {
    // randomly connect nearby dungeons
    this.corridors = new Map();
    for (let room of this.rooms) {
      let nearest = this.findNearest(room);
      let pair = new Set([room, nearest]);
      if (!this.corridors.has(pair)) {
        this.connect(room, nearest);
        this.corridors.set(pair, 1);
      }
    }
  }

  forEach(f) {
    for (let i = 0; i < this.w; i++) {
      for (let j = 0; j < this.h; j++) {
        f(i, j, this.grid[j * this.w + i]);
      }
    }
  }

}

