import { random } from 'webgame-lib/lib/random';
import { Rect, Axis, Vec } from 'webgame-lib/lib/geom';

class Room {

  constructor(bounds) {
    this.id = random.letters(3);
    this.bounds = bounds;
    this.doors = [];
  }

  dist(other) {
    return this.bounds.center.blockDist(other.bounds.center);
  }
}

const CLIFF_GAP = 2;
const MIN_STAG_LEN = 4;
const ROOM_SPACE = 2;

export class Dungeon {

  constructor(w, h, { minDim, maxDim, straightBias }) {
    this.w = w;
    this.h = h;
    this.minDim = minDim;
    this.maxDim = maxDim;
    this.straightBias = straightBias;
    this.grid = new Array(w * h);
    for (let i = 0; i < w * h; i++) {
      this.grid[i] = 0;
    }
  }

  buildRooms(root) {
    this.rooms = [];
    let gen = root.gen();
    let cuttoff = this.minDim + ROOM_SPACE * 2;
    let picked = false;
    let finished = false;
    while (!finished) {
      let next = gen.next(picked);
      let part = next.value;
      finished = next.done;
      if (!finished) {
        picked = part.leaf;
        if (picked) {
          let r = part.rect;
          if (r.w < cuttoff || r.h < cuttoff) continue;
          let w = random.nextInt(this.minDim, Math.min(r.w - ROOM_SPACE, this.maxDim));
          let h = random.nextInt(this.minDim, Math.min(r.h - ROOM_SPACE, this.maxDim));
          let x = r.x + random.nextInt(ROOM_SPACE, r.w - w);
          let y = r.y + random.nextInt(ROOM_SPACE, r.h - h);
          this.rooms.push(new Room(new Rect(x, y, w, h)));
        }
      }
    }
    for (let room of this.rooms) {
      this._fillGrid(room.bounds, 1);
    }
  }

  _fillGrid(b, v) {
    for (let i = b.x; i < b.x + b.w; i++) {
      for (let j = b.y; j < b.y + b.h; j++) {
        this.grid[j * this.w + i] = v;
      }
    }
  }

  makeCorridor(roomA, roomB) {
    let bA = roomA.bounds.clone().shrink(2);
    let bB = roomB.bounds.clone().shrink(2);
    function roomOf(b) {
      return b === bA ? roomA : roomB;
    }

    let axes = bA.seperationAxis(bB);
    let from = new Vec();
    let to = new Vec();
    let min, max, segments;
    if (axes.length === 1) {
      let [axis] = axes;
      let comp = Axis.complement(axis);
      let aD = Axis.dimension(axis);
      let cD = Axis.dimension(comp);
      [min, max] = bA.order(bB, axis);
      from[axis] = min[axis] + min[aD];
      to[axis] = max[axis] - 1;
      let hasStagLen = (max[comp] + max[cD]) - min[comp] > MIN_STAG_LEN;
      let hasCliffGap = to[axis] - from[axis] >= 2 * CLIFF_GAP;
      if (!hasStagLen || !hasCliffGap || random.choice(this.straightBias)) {
        // straight
        let overlap = bA.overlap(bB, comp);
        let at = random.nextInt(...overlap);
        from[comp] = to[comp] = at;
        segments = [[from, to]];
      } else {
        // staggard
        do {
          from[comp] = random.nextInt(min[comp], min[comp] + min[cD] - 1);
          to[comp] = random.nextInt(max[comp], max[comp] + max[cD] - 1);
        } while (Math.abs(from[comp] - to[comp]) < MIN_STAG_LEN);
        let cliff = random.nextInt(from[axis] + CLIFF_GAP, to[axis] - CLIFF_GAP);
        let x = new Vec();
        let y = new Vec();
        x[comp] = from[comp];
        y[comp] = to[comp];
        y[axis] = x[axis] = cliff;
        segments = [
          [from, x],
          [x, y],
          [y, to]
        ];
      }
    } else {
      // right angled
      let axis = random.select(axes);
      let comp = Axis.complement(axis);
      let aD = Axis.dimension(axis);
      let cD = Axis.dimension(comp);
      [min, max] = bA.order(bB, axis);
      from[axis] = random.nextInt(min[axis], min[axis] + min[aD] - 1);
      to[comp] = random.nextInt(max[comp], max[comp] + max[cD] - 1);
      to[axis] = max[axis] - 1;
      if (to[comp] < min[comp]) {
        from[comp] = min[comp] - 1;
      } else {
        from[comp] = min[comp] + min[cD];
      }
      let sec = new Vec();
      sec[axis] = from[axis];
      sec[comp] = to[comp];
      segments = [
        [from, sec],
        [sec, to]
      ];
    }
    roomOf(min).doors.push(from);
    roomOf(max).doors.push(to);
    return {segments};
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
        let cor = this.makeCorridor(room, nearest);
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
