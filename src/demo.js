import { Rect } from 'webgame-lib/lib/math';
import { random } from 'webgame-lib/lib/random';
import Partition from './partition.js';
import { Dungeon, splitRec } from './dungeon.js';

const W = 800;
const H = 640;
const T = 16;

let partOptions = {
  depth: 3,
  varf: 0.2,
  sqf: 1,
  gap: 10,
  delay: 100
};

let roomOptions = {
  grid: true,
  spans: true,
  delay: 1000
};

let corridorOptions = {
  delay: 100
};

function tick(f, secs) {
  let timer = setInterval(() => {
    if (f()) {
      clearInterval(timer);
    }
  }, secs);
}

function showCorridors(ctx, dungeon, t) {
  ctx.fillRect(0, 0, W, H);
}

function showPartitions(ctx) {

  function drawRect(rect) {
    ctx.fillStyle = random.color();
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, W, H);
  let bounds = new Rect(0, 0, W, H);
  let root = new Partition(bounds, partOptions, partOptions.depth);
  let gen = root.gen(false);
  let left, right;
  tick(() => {
    let { value, done } = gen.next(false);
    if (done) {
      drawRect(right.rect);
      return true;
    }
    [ left, right ] = value.children;
    drawRect(left.rect);
    return false;
  }, partOptions.delay);
  return root;
}

function showRooms(ctx, root, t) {

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = random.color();
  for (let part of root) {
    part.rect.scale(1 / t).round();
  }
  let w = Math.floor(W / t);
  let h = Math.floor(H / t);
  let d = new Dungeon(w, h);
  d.buildRooms(root);
  d.buildCorridors();

  // draw rooms
  for (let room of d.rooms) {
    ctx.fillStyle = 'black';
    let r = room.bounds;
    ctx.fillRect(r.x * t, r.y * t, r.w * t, r.h * t);
  }

  if (roomOptions.grid) {
    // draw grid
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 0.75;
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

  if (roomOptions.spans) {
    // draw spans
    let spans = d.corridors.keys()[Symbol.iterator]();
    tick(() => {
      let { value, done } = spans.next();
      if (done) return true;
      let [a, b] = [...value].map(r => r.bounds.center());
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x * t, a.y * t);
      ctx.lineTo(b.x * t, b.y * t);
      ctx.closePath();
      ctx.stroke();
      return false;
    }, roomOptions.delay);
  }
}

function getContext(hide) {
  let can = document.createElement('canvas');
  let ctx = can.getContext('2d');
  can.width = W;
  can.height = H;
  let container = document.createElement('div');
  container.style.display = hide ? 'none' : 'inline-block';
  container.appendChild(can);
  document.body.appendChild(container);
  ctx.font = '18px Arial';
  return ctx;
}

window.addEventListener('load', () => {
  console.clear();
  let partCtx = getContext(true);
  let root = showPartitions(partCtx);
  let roomCtx = getContext();
  let dungeon = showRooms(roomCtx, root.clone(), T);
  let corCtx = getContext();
  showCorridors(corCtx, dungeon, T);
  // document.body.style.position = 'relative';
});
