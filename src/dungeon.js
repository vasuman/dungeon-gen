import { random } from 'webgame-lib/lib/random';
import { Rect } from 'webgame-lib/lib/math';
import Partition from './partition.js';

class Room {

  constructor(bounds) {
    this.id = random.letters(3);
    this.bounds = bounds;
  }

  dist(other) {
    return this.bounds.center().blockDist(other.bounds.center());
  }
}

const DEFAULT_OPTIONS = {
  space: 2,
  minDim: 5,
  maxDim: 16,
  pathSize: 2,
}

export class Dungeon {

  constructor(w, h, options = DEFAULT_OPTIONS) {
    this.w = w;
    this.h = h;
    this.options = options;
    this.grid = new Array(w * h);
    for (let i = 0; i < w * h; i++) {
      this.grid[i] = 0;
    }
  }

  buildRooms(root) {
    this.rooms = [];
    let gen = root.gen();
    let picked = false;
    let cuttoff = this.options.minDim + this.options.space * 2;
    while (true) {
      let { value, done } = gen.next(picked);
      if (done) break;
      picked = value.leaf;
      if (picked) {
        let r = value.rect;
        if (r.w < cuttoff || r.h < cuttoff) continue;
        let w = random.nextInt(this.options.minDim, r.w - this.options.space);
        let h = random.nextInt(this.options.minDim, r.h - this.options.space);
        let x = r.x + random.nextInt(this.options.space, r.w - w);
        let y = r.y + random.nextInt(this.options.space, r.h - h);
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
    let overlapY = roomA.bounds.overlap(roomB.bounds, true);
    if (overlapY !== null && random.choice()) {
      return 1;
    }
    let overlapX = roomA.bounds.overlap(roomB.bounds, false);
    if (overlapX !== null && random.choice()) {
      return 1;
    }

    if (random.choice()) {
      // straight or staggered
      let width = this.options.pathSize;
      if (random.choice()) {
        // straight
      } else {
        // staggered
      }
    } else {

    }
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

