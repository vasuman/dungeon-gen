import { Rect } from 'webgame-lib/lib/math';
import * as random from 'webgame-lib/lib/random';
import Partition from './partition.js';
import { Dungeon, splitRec } from './dungeon.js';

const W = 800;
const H = 640;
const T = 16;

const PART_OPTIONS = {
  depth: 3,
  varf: 0.2,
  sqf: 1,
  gap: 10,
  delay: 50
};

const DUNGEON_OPTIONS = {
  grid: true,
  spans: true,
  ids: true
};

function showPartitions(ctx, options) {

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

function showDungeon(ctx, root, t, options) {

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

  // draw rooms
  for (let room of d.rooms) {
    ctx.fillStyle = 'black';
    let r = room.bounds;
    ctx.fillRect(r.x * t, r.y * t, r.w * t, r.h * t);
  }

  if (options.grid) {
    // draw grid
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;
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

  if (options.spans) {
    // draw spans
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    for (let edge of d.corridors.keys()) {
      let [a, b] = [...edge].map(r => r.bounds.center());
      ctx.beginPath();
      ctx.moveTo(a.x * t, a.y * t);
      ctx.lineTo(b.x * t, b.y * t);
      ctx.closePath();
      ctx.stroke();
    }
  }

  if (options.ids) {
    // draw identifiers
    for (let room of d.rooms) {
      let c = room.bounds.center();
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(room.id, c.x * t, c.y * t);
    }
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
  ctx.font = '18px Arial';
  return ctx;
}

window.addEventListener('load', () => {
  console.clear();
  random.seed(Math.random());
  let partCtx = getContext();
  let root = showPartitions(partCtx, PART_OPTIONS);
  let roomCtx = getContext();
  showDungeon(roomCtx, root.clone(), T, DUNGEON_OPTIONS);
  // document.body.style.position = 'relative';
});
