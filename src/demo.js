import { Rect } from 'webgame-lib/lib/math';
import { random } from 'webgame-lib/lib/random';
import { Screen } from 'webgame-lib/lib/screen';
import Partition from './partition.js';
import { Dungeon, splitRec } from './dungeon.js';

const W = 800;
const H = 640;
const T = 16;

let options = {
  depth: 3,
  varf: 0.2,
  sqf: 1,
  gap: 10,
  partDelay: 200,
  spanDelay: 1000,
  fillDelay: 50,
  grid: true,
  spans: true,
};

let i = 0;

function tick(f, secs) {
  let cur = i;
  let timer = setInterval(() => {
    if (cur !== i || f()) {
      clearInterval(timer);
    }
  }, secs);
}

function showPartitions(ctx, root) {

  function drawRect(rect) {
    ctx.fillStyle = random.color();
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, W, H);
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
  }, options.partDelay);
}

function drawRooms(ctx, rooms, t) {
  for (let room of rooms) {
    ctx.fillStyle = 'black';
    let r = room.bounds;
    ctx.fillRect(r.x * t, r.y * t, r.w * t, r.h * t);
  }
}

function drawGrid(ctx, w, h, t) {
  // draw grid
  let x = Math.floor(w / t);
  let y = Math.floor(h / t);
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 0.75;
  for (let i = 0; i <= x; i++) {
    ctx.beginPath();
    ctx.moveTo(i * t, 0);
    ctx.lineTo(i * t, h);
    ctx.closePath();
    ctx.stroke();
  }
  for (let j = 0; j <= y; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * t);
    ctx.lineTo(w, j * t);
    ctx.closePath();
    ctx.stroke();
  }
}

function showRooms(ctx, dungeon, t) {

  function drawSpan(edge) {
    let [a, b] = edge.map(r => r.bounds.center());
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x * t, a.y * t);
    ctx.lineTo(b.x * t, b.y * t);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.clearRect(0, 0, W, H);
  drawRooms(ctx, dungeon.rooms, t);

  if (options.grid) {
    drawGrid(ctx, W, H, t);
  }

  if (options.spans) {
    // draw spans
    let spans = dungeon.corridors.keys()[Symbol.iterator]();
    tick(() => {
      let { value, done } = spans.next();
      if (done) return true;
      drawSpan([...value]);
      return false;
    }, options.spanDelay);
  }
}

function showCorridors(ctx, dungeon, t) {
  drawRooms(ctx, dungeon.rooms, t);

  if (options.grid) {
    drawGrid(ctx, W, H, t);
  }

  tick(() => {
  });
}

function getContext(hide) {
  let screen = new Screen(W, H);
  if (!hide) {
    document.body.appendChild(screen.container);
  }
  let ctx = screen.can.getContext('2d');
  return ctx;
}

window.addEventListener('load', () => {
  console.clear();

  let bounds = new Rect(0, 0, W, H);
  let root = new Partition(bounds, options, options.depth);

  showPartitions(getContext(false), root.clone());

  for (let part of root) {
    part.rect.scale(1 / T).round();
  }

  let w = Math.floor(W / T);
  let h = Math.floor(H / T);
  let dungeon = new Dungeon(w, h);
  dungeon.buildRooms(root);
  dungeon.buildCorridors();

  showRooms(getContext(), dungeon, T);

  showCorridors(getContext(), dungeon, T);
  require('webgame-lib/src/screen.css');

});
