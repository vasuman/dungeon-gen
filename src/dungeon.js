import { random } from 'webgame-lib/lib/random';
import { Rect } from 'webgame-lib/lib/math';
import Partition from './partition.js';

const SPACE = 2;

const MIN_DIM = 5;
const MAX_DIM = 16;

const CUTOFF_SIZE = MIN_DIM + 2 * SPACE;

class Room {

  constructor(bounds) {
    this.id = random.letters(3);
    this.bounds = bounds;
  }

  dist(other) {
    return this.bounds.center().blockDist(other.bounds.center());
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
      if (done) break;
      picked = value.leaf;
      if (picked) {
        let r = value.rect;
        if (r.w < CUTOFF_SIZE || r.h < CUTOFF_SIZE) continue;
        let w = random.nextInt(MIN_DIM, r.w - SPACE);
        let h = random.nextInt(MIN_DIM, r.h - SPACE);
        let x = r.x + random.nextInt(SPACE, r.w - w);
        let y = r.y + random.nextInt(SPACE, r.h - h);
        this.rooms.push(new Room(new Rect(x, y, w, h)));
      }
    }
    for (let room of this.rooms) {
      let b = room.bounds;
      for (let i = b.x; i < b.x + b.w; i++) {
        for (let j = b.y; j < b.y + b.h; j++) {
          this.grid[j * this.w + i] = 1;
        }
      }
    }
  }

  connect(roomA, roomB) {
    let v = roomA.bounds.center().sub(roomB.bounds.center());
    // get split plane
    let dim = (Math.abs(v.x) > Math.abs(v.y)) ? 'x' : 'y';
    let orth = (dim === 'x') ? 'y' : 'x';
    // projection
    let [first, second] = [roomA, roomB].sort((a, b) => a[dim] - b[dim]);
    // staggered or straight
    // merge
    // fill
    return 1;
  }

  findNearest(connected, remaining) {
    let minDist = Infinity;
    let from, candidate;
    for (let a of connected) {
      for (let b of remaining) {
        let dist = a.dist(b);
        if (dist < minDist) {
          minDist = dist;
          from = a;
          candidate = b;
        }
      }
    }
    return [from, candidate];
  }

  buildCorridors() {
    this.corridors = new Map();
    // find the minimum spanning tree
    let connected = new Set(this.rooms.slice(0, 1));
    let remaining = new Set(this.rooms.slice(1));
    while (remaining.size != 0) {
      let [room, nearest] = this.findNearest(connected, remaining);
      let pair = new Set([room, nearest]);
      if (!this.corridors.has(pair)) {
        let cor = this.connect(room, nearest);
        this.corridors.set(pair, cor);
        remaining.delete(nearest);
        connected.add(nearest);
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

