/* eslint-env browser */

import { Rect } from 'webgame-lib/lib/geom';
import { random } from 'webgame-lib/lib/random';
import Screen from 'webgame-lib/lib/screen';
import Partition from './partition.js';
import { Dungeon } from './dungeon.js';

const options = {
  width: 800,
  height: 600,
  varf: 0.2,
  sqf: 1,
  gap: 10,
  partDelay: 200,
  spanDelay: 400,
  fillDelay: 100,
  grid: true,
  minDim: 8,
  maxDim: 15,
  straightBias: 1,
  spans: true
};

class Demo {
  constructor(screen, func) {
    this.screen = screen;
    this.func = func;
  }

  render() {
    let ctx = this.screen.can.getContext('2d');
    this.screen.clear();
    this.func(ctx);
  }
}

let dungeon, bsp;

let i = 0;

function $(sel) {
  let ret = document.querySelectorAll(sel);
  return sel.startsWith('#') ? ret[0] : Array.from(ret);
}

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
  let [a, b] = edge.map(r => r.bounds.center);
  ctx.strokeStyle = 'blue';
  ctx.fillStyle = 'blue';
  ctx.lineWidth = 4;
  drawLine(ctx, a, b, options.tile);
  drawCircle(ctx, a, 8, options.tile);
  drawCircle(ctx, b, 8, options.tile);
}

function drawRooms(ctx, rooms) {
  for (let room of rooms) {
    let r = room.bounds;
    ctx.fillStyle = 'green';
    drawRect(ctx, r, options.tile);
    r = r.clone().shrink(2);
    ctx.fillStyle = 'lightgreen';
    drawRect(ctx, r, options.tile);
  }
}

function drawGrid(ctx) {
  let x = Math.floor(options.width / options.tile);
  let y = Math.floor(options.height / options.tile);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= x; i++) {
    ctx.beginPath();
    ctx.moveTo(i * options.tile, 0);
    ctx.lineTo(i * options.tile, options.height);
    ctx.closePath();
    ctx.stroke();
  }
  for (let j = 0; j <= y; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * options.tile);
    ctx.lineTo(options.width, j * options.tile);
    ctx.closePath();
    ctx.stroke();
  }
}

function showPartitions(ctx) {
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, options.width, options.height);
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
  drawRooms(ctx, dungeon.rooms);

  if (options.grid) {
    drawGrid(ctx);
  }
}

function showSpans(ctx) {
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
      ctx.fillRect(block.x * options.tile + 1,
                   block.y * options.tile + 1,
                   options.tile - 1, options.tile - 1);
      trace.idx += 1;
    });
    return traces.map(x => x.done).reduce((a, b) => a && b);
  }, options.fillDelay);
}

/* eslint-disable no-console */
window.addEventListener('load', () => {
  console.clear();

  function getScreen(container) {
    let screen = new Screen(options.width, options.height);
    container.appendChild(screen.container);
    container.addEventListener('click', redraw);
    return screen;
  }

  let demos = [
    new Demo(getScreen($('#partitions-container')), showPartitions),
    new Demo(getScreen($('#rooms-container')), showRooms),
    new Demo(getScreen($('#spans-container')), showSpans),
    new Demo(getScreen($('#corridors-container')), showCorridors)
  ];

  function redraw() {
    cancel();
    for (let demo of demos) {
      demo.render();
    }
  }

  function init() {
    if (window.matchMedia('(max-device-width: 500px)').matches) {
      Object.assign(options, {
        tile: 16,
        depth: 3
      });
    } else {
      Object.assign(options, {
        tile: 8,
        depth: 4
      });
    }
    let bounds = new Rect(0, 0, options.width, options.height);
    let root = new Partition(bounds, options, options.depth);
    bsp = root.clone();
    for (let part of root) {
      part.rect.scale(1 / options.tile).round();
    }
    let w = Math.floor(options.width / options.tile);
    let h = Math.floor(options.height / options.tile);
    dungeon = new Dungeon(w, h, options);
    dungeon.buildRooms(root);
    dungeon.buildCorridors();
  }


  function setupControls() {
    function attachSlider(id, prop, isInt = false) {
      let slide = $(`#${id}-slider`);
      slide.addEventListener('change', (e) => {
        let parse = (isInt === false) ? parseFloat : parseInt;
        options[prop] =  parse(e.target.value);
        console.log(prop, e.target.value);
      });
    }
    $('.gen-button').forEach(btn => btn.addEventListener('click', () => {
      init();
      redraw();
    }));
    attachSlider('squariness', 'sqf');
    attachSlider('split-var', 'varf');
    attachSlider('min-dim', 'minDim');
    attachSlider('max-dim', 'maxDim');
    attachSlider('stag-bias', 'straightBias');
  }
  setupControls();
  init();
  redraw();
});
