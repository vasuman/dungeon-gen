import { Rect } from 'webgame-lib/lib/math';
import * as random from 'webgame-lib/lib/random';
import Partition from './partition.js';
import { Dungeon, splitRec } from './dungeon.js';

const W = 800;
const H = 600;
const T = 16;

const PART_OPTIONS = {
  depth: 3,
  varf: 0.2,
  sqf: 1,
  gap: 10,
  delay: 50
};

function partitions(ctx, options) {

  function drawRect(rect) {
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
      clearInterval(timer);
      drawRect(right.rect);
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
  for (let part of root) {
    part.rect.scale(1 / t).round();
  }
  let w = ~~(W / t);
  let h = ~~(H / t);
  let d = new Dungeon(w, h);
  d.buildRooms(root);
  d.buildCorridors();
  for (let room of d.rooms) {
    let r = room.bounds;
    ctx.fillRect(r.x * t, r.y * t, r.w * t, r.h * t);
  }
  ctx.strokeStyle = 'green';
  for (let i = 0; i <= w; i++) {
      ctx.beginPath();
      ctx.moveTo(i * t, 0);
      ctx.lineTo(i * t, H);
      ctx.closePath();
      ctx.stroke();
  }
  for (let j = 0; j <= h; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * t);
      ctx.lineTo(W, j * t);
      ctx.closePath();
      ctx.stroke();
  }
}

function getContext() {
  let can = document.createElement('canvas');
  let ctx = can.getContext('2d');
  can.width = W;
  can.height = H;
  let container = document.createElement('div');
  // container.style.position = 'absolute';
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
  rooms(roomCtx, root.clone(), T);
  // document.body.style.position = 'relative';
});
