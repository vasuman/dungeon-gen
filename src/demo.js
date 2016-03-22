/* eslint-env browser */

import { Rect } from 'webgame-lib/lib/geom';
import { random } from 'webgame-lib/lib/random';
import { Screen } from 'webgame-lib/lib/screen';
import Partition from './partition.js';
import { Dungeon } from './dungeon.js';

import 'webgame-lib/css/screen.css';

const W = 800;
const H = 640;
const T = 16;

const options = {
  depth: 3,
  varf: 0.2,
  sqf: 1,
  gap: 10,
  partDelay: 200,
  spanDelay: 400,
  fillDelay: 100,
  grid: true,
  spans: true
};

let dungeon, bsp;

let i = 0;

function tick(f, secs) {
  let cur = i;
  let timer = setInterval(() => {
    if (cur !== i || f()) {
      clearInterval(timer);
    }
  }, secs);
}

function cancel() {
  i++;
}

// draw functions

function drawRect(ctx, rect, scl = 1) {
  ctx.fillRect(rect.x * scl, rect.y * scl, rect.w * scl, rect.h * scl);
}

function drawCircle(ctx, {x, y}, r, scl = 1) {
  ctx.beginPath();
  ctx.arc(x * scl, y * scl, r, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
}

function drawLine(ctx, {x: sX, y: sY}, {x: dX, y: dY}, scl = 1) {
  ctx.beginPath();
  ctx.moveTo(sX * scl, sY * scl);
  ctx.lineTo(dX * scl, dY * scl);
  ctx.closePath();
  ctx.stroke();
}

function drawSpan(ctx, edge) {
  let [a, b] = edge.map(r => r.bounds.center());
  ctx.strokeStyle = 'red';
  ctx.fillStyle = 'red';
  ctx.lineWidth = 4;
  drawLine(ctx, a, b, T);
  drawCircle(ctx, a, 8, T);
  drawCircle(ctx, b, 8, T);
}

function drawRooms(ctx, rooms) {
  for (let room of rooms) {
    let r = room.bounds;
    ctx.fillStyle = 'green';
    drawRect(ctx, r, T);
    r = r.clone().shrink(2);
    ctx.fillStyle = 'blue';
    drawRect(ctx, r, T);
  }
}

function drawGrid(ctx) {
  let x = Math.floor(W / T);
  let y = Math.floor(H / T);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.75;
  for (let i = 0; i <= x; i++) {
    ctx.beginPath();
    ctx.moveTo(i * T, 0);
    ctx.lineTo(i * T, H);
    ctx.closePath();
    ctx.stroke();
  }
  for (let j = 0; j <= y; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * T);
    ctx.lineTo(W, j * T);
    ctx.closePath();
    ctx.stroke();
  }
}

function showPartitions(ctx) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, W, H);
  let gen = bsp.gen(false);
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

function showRooms(ctx) {
  ctx.clearRect(0, 0, W, H);
  drawRooms(ctx, dungeon.rooms);

  if (options.grid) {
    drawGrid(ctx);
  }

  if (options.spans) {
    // draw spans
    let spans = dungeon.corridors.keys()[Symbol.iterator]();
    tick(() => {
      let { value: span, done } = spans.next();
      if (done) return true;
      drawSpan(ctx, [...span]);
      return false;
    }, options.spanDelay);
  }
}

function showCorridors(ctx) {
  ctx.clearRect(0, 0, W, H);

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

  drawRooms(ctx, dungeon.rooms);

  if (options.grid) {
    drawGrid(ctx);
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
      ctx.fillRect(block.x * T + 1, block.y * T + 1, T - 1, T - 1);
      trace.idx += 1;
    });
    return traces.map(x => x.done).reduce((a, b) => a && b);
  }, options.fillDelay);
}

window.addEventListener('load', () => {
  console.clear(); // eslint-disable-line no-console

  let partScreen, roomScreen, corScreen;

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    let bounds = new Rect(0, 0, W, H);
    let root = new Partition(bounds, options, options.depth);
    bsp = root.clone();
    for (let part of root) {
      part.rect.scale(1 / T).round();
    }
    let w = Math.floor(W / T);
    let h = Math.floor(H / T);
    dungeon = new Dungeon(w, h);
    dungeon.buildRooms(root);
    dungeon.buildCorridors();
  }

  function redraw() {
    function render(screen, func) {
      let ctx = screen.can.getContext('2d');
      func(ctx);
    }

    cancel();
    render(partScreen, showPartitions);
    render(roomScreen, showRooms);
    render(corScreen, showCorridors);
  }

  function getScreen(container) {
    let screen = new Screen(W, H);
    container.appendChild(screen.container);
    container.addEventListener('click', redraw);
    return screen;
  }

  function setupControls() {
    $('gen-button').addEventListener('click', () => {
      init();
      redraw();
    });
    let sqSlide = $('squariness-slider');
    sqSlide.addEventListener('change', () => {
      options.sqf = parseFloat(sqSlide.value);
    });
    let spvSlide = $('split-var-slider');
    spvSlide.addEventListener('change', () => {
      options.varf = parseFloat(spvSlide.value);
    });
  }

  init();
  partScreen = getScreen($('partitions'));
  roomScreen = getScreen($('rooms'));
  corScreen = getScreen($('corridors'));
  setupControls();
  redraw();

});
