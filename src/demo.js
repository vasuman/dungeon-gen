import { Rect } from 'webgame-lib/lib/geom';
import { random } from 'webgame-lib/lib/random';
import { Screen } from 'webgame-lib/lib/screen';
import Partition from './partition.js';
import { Dungeon, splitRec } from './dungeon.js';

import 'webgame-lib/css/screen.css';

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
  fillDelay: 100,
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

function drawRect(ctx, rect) {
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function drawCircle(ctx, {x, y}, r, t) {
  ctx.beginPath();
  ctx.arc(x * t, y * t, r, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
}

function drawLine(ctx, {x: sX, y: sY}, {x: dX, y: dY}, t) {
  ctx.beginPath();
  ctx.moveTo(sX * t, sY * t);
  ctx.lineTo(dX * t, dY * t);
  ctx.closePath();
  ctx.stroke();
}

function drawRooms(ctx, rooms, t) {
  for (let room of rooms) {
    let r = room.bounds;
    ctx.fillStyle = 'green';
    ctx.fillRect(r.x * t, r.y * t, r.w * t, r.h * t);
    r = r.clone().shrink(2);
    ctx.fillStyle = 'blue';
    ctx.fillRect(r.x * t, r.y * t, r.w * t, r.h * t);
  }
}

function drawGrid(ctx, w, h, t) {
  // draw grid
  let x = Math.floor(w / t);
  let y = Math.floor(h / t);
  ctx.strokeStyle = 'black';
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

function showPartitions(ctx, root) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, W, H);
  let gen = root.gen(false);
  let left, right;
  tick(() => {
    ctx.fillStyle = random.color();
    let { value, done } = gen.next(false);
    if (done) {
      drawRect(ctx, right.rect);
      return true;
    }
    [ left, right ] = value.children;
    drawRect(ctx, left.rect);
    return false;
  }, options.partDelay);
}

function showRooms(ctx, dungeon, t) {
  function drawSpan(edge) {
    let [a, b] = edge.map(r => r.bounds.center());
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.lineWidth = 4;
    drawLine(ctx, a, b, t);
    drawCircle(ctx, a, 8, t);
    drawCircle(ctx, b, 8, t);
  }

  drawRooms(ctx, dungeon.rooms, t);

  if (options.grid) {
    drawGrid(ctx, W, H, t);
  }

  if (options.spans) {
    // draw spans
    let spans = dungeon.corridors.keys()[Symbol.iterator]();
    tick(() => {
      let { value: span, done } = spans.next();
      if (done) return true;
      drawSpan([...span]);
      return false;
    }, options.spanDelay);
  }
}

function showCorridors(ctx, dungeon, t) {
  function getBlock(segments, idx) {
    // FIXME!!
    if (!segments) {
      return null;
    }
    for (let [a, b] of segments) {
      let length = a.blockDist(b);
      if (idx <= length) {
        return b.interpolate(idx / length, a).round();
      }
      idx -= length;
    }
    return null;
  }

  drawRooms(ctx, dungeon.rooms, t);

  if (options.grid) {
    drawGrid(ctx, W, H, t);
  }

  let traces = [];
  for (let corridor of dungeon.corridors.values()) {
    traces.push({
      idx: 0,
      segments: corridor.segments,
      done: false
    });
  }

  tick(() => {
    traces.forEach(trace => {
      if (trace.done) {
        return;
      }
      let block = getBlock(trace.segments, trace.idx);
      if (block === null) {
        trace.done = true;
        return;
      }
      // draw block
      ctx.fillStyle = 'red';
      ctx.fillRect(block.x * t + 1, block.y * t + 1, t - 1, t - 1);
      trace.idx += 1;
    });
    return traces.map(x => x.done).reduce((a, b) => a && b);
  }, options.fillDelay);
}

function getContext(hide = false) {
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

  // showPartitions(getContext(), root.clone());

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

});
