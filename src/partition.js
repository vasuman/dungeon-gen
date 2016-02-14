import * as random from 'webgame-lib/lib/random';

export default class Partition {

  constructor(rect, params, depth = 0) {
    this.rect = rect;
    this.children = [];
    if (depth > 0) {
      this.split(params, depth);
      this.leaf = false;
    } else {
      this.leaf = true;
    }
  }

  * gen(leaf = true, node = true) {
    if ((this.leaf && leaf) || (!this.leaf && node)) {
      if (yield this) return;
    }
    for (let child of this.children) {
      yield* child.gen(leaf, node);
    }
  }

  [Symbol.iterator]() {
    return this.gen();
  }

  clone() {
    let copy = new Partition(this.rect.clone());
    copy.leaf = this.leaf;
    copy.children = this.children.map((child) => child.clone());
    return copy;
  }

  split({ sqf, varf }, depth) {
    let vert = random.bool(this.rect.w / this.rect.h, sqf);
    let f = random.f(0.5 - varf, 0.5 + varf);
    this.children = this.rect.split(f, vert).map(half => {
      return new Partition(half, { sqf, varf }, depth - 1);
    });
  }

}

