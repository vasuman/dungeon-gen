import { Box } from 'webgame-lib/lib/math';
import { Dungeon, splitRec } from './dungeon.js';

let can, ctx, container;

const W = 800;
const H = 600;
const T = 20;

function drawBox(b) {
  ctx.fillRect(b.x * T, b.y * T, b.w * T, b.h * T);
}

function showPartition() {
  ctx.clearRect(0, 0, W, H);

  splitRec((b, d) => {
    if (d == 3) {
      ctx.fillStyle = Math.random() < 0.5 ? 'gray' : 'black';
      drawBox(b.shrink(1));
      return false;
    }
    return true;
  }, new Box(0, 0, W / T, H / T), 0.1, 1.2);
}

function showRooms() {
  ctx.clearRect(0, 0, W, H);
  let d = new Dungeon(W / T, H / T);
  d.buildRooms();

  for (let room of d.rooms) {
    drawBox(room.box);
  }
}

window.addEventListener('load', () => {
  console.clear();
  can = document.createElement('canvas');
  ctx = can.getContext('2d');
  can.width = W;
  can.height = H;
  container = document.createElement('div');
  container.appendChild(can);
  document.body.appendChild(container);
  container.addEventListener('click', showRooms);
});
