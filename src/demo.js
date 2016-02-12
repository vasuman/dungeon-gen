import { Rect } from 'webgame-lib/lib/math';
import * as random from 'webgame-lib/lib/random';
import Partition from './partition.js';
import { Dungeon, splitRec } from './dungeon.js';

const W = 800;
const H = 600;
const T = 10;

const PART_OPTIONS = {
  depth: 4,
  varf: 0.15,
  sqf: 0.7,
  gap: 10,
  delay: 400
};

function partitions(ctx, options) {

  function drawRect(rect) {
    rect.round();
    console.log(rect);
    ctx.fillStyle = random.color();
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, W, H);
  let bounds = new Rect(0, 0, W, H);
  let root = new Partition(bounds, options, options.depth);
  let gen = root.gen(false);
  let left, right;

  let timer = setInterval(() => {
    let { value, done } = gen.next(false);
    if (done) {
      drawRect(right.rect);
      clearInterval(timer);
      return;
    }
    [ left, right ] = value.children;
    drawRect(left.rect);
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
