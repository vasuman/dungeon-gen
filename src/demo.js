import { Rect } from 'webgame-lib/lib/math';
import * as random from 'webgame-lib/lib/random';
import Partition from './partition.js';
import { Dungeon, splitRec } from './dungeon.js';

const W = 800;
const H = 600;
const T = 10;

const PART_OPTIONS = {
  depth: 1,
  varf: 0.2,
  sqf: 1,
  gap: 10,
  delay: 50
};

Object.assign(ROOM_OPTIONS, PART_OPTIONS);

function partitions(ctx, options) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, W, H);
  let bounds = new Rect(0, 0, W, H);
  let root = new Partition(bounds, options, options.depth);
  let gen = root.gen(false);
  let timer = setInterval(() => {
    let { value, done } = gen.next();
    if (done) {
      clearInterval(timer);
      return;
    }
    let rect = value.children[0].rect;
    ctx.fillStyle = random.color();
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }, options.delay);
  return root;
}

function rooms(ctx, root, t) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'black';
  let d = new Dungeon(W / t, H / t);
  d.buildRooms(root);
  for (let room of d.rooms) {
    let r = room.bounds;
    console.log(r);
    ctx.fillRect(r.x * t, r.y * t, r.w * t, r.h * t);
  }
}

function getContext() {
  let can = document.createElement('canvas');
  let ctx = can.getContext('2d');
  can.width = W;
  can.height = H;
  let container = document.createElement('div');
  container.style.display = 'inline-block';
  container.appendChild(can);
  document.body.appendChild(container);
  return ctx;
}

window.addEventListener('load', () => {
  console.clear();
  let partCtx = getContext();
  let root = partitions(partCtx, PART_OPTIONS);
  let roomCtx = getContext();
  rooms(roomCtx, root, T);
});
