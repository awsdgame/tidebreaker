// Tidebreaker - a simple boat game
    const cvs = document.getElementById('game');
    const ctx = cvs.getContext('2d');
    const W = cvs.width, H = cvs.height;

    // Player boat
    const boat = { x:120, y:H*0.6, vx:0, vy:0, speed:3.5, hull:100, lives:3, width:44, height:18 };
    let distance=0;
    let obstacles = []; // rocks, other boats
    let enemies = []; // ramming enemies
    let debris = [];
    let frames = 0;

    const keys = new Set();
    addEventListener('keydown', e=>{ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); keys.add(e.key); });
    addEventListener('keyup', e=> keys.delete(e.key));

    function spawnObstacle(){
      const laneY = H*0.45 + Math.random()*(H*0.4);
      const type = Math.random()<0.7? 'rock':'buoy';
      const size = type==='rock'? 18 + Math.random()*12 : 10;
      obstacles.push({ x: W+40, y: laneY, r: size, type });
    }
    function spawnEnemy(){
      const y = H*0.4 + Math.random()*(H*0.45);
      enemies.push({ x: W+60, y, r:18, vx: -2.2 - Math.random()*1.4 });
    }

    setInterval(spawnObstacle, 900);
    setInterval(spawnEnemy, 2400);

    function update(){
      frames++;
      // Input: accelerate/brake, up/down steer, space to ram
      const up = keys.has('ArrowUp'); const dn = keys.has('ArrowDown');
      const lt = keys.has('ArrowLeft'); const rt = keys.has('ArrowRight'); const ram = keys.has(' ');

      // Speed control
      if(up) boat.speed = Math.min(7, boat.speed + 0.04);
      else if(dn) boat.speed = Math.max(1.6, boat.speed - 0.06);
      else boat.speed += (3.5 - boat.speed) * 0.005; // drift to cruise

      // Vertical movement
      if(lt) boat.y -= 2.8; if(rt) boat.y += 2.8;
      boat.y = Math.max(80, Math.min(H-50, boat.y));

      // World scroll
      const scroll = boat.speed * 0.9;
      distance += scroll * 0.2;

      // Obstacles
      for(let i=obstacles.length-1;i>=0;i--){ const o=obstacles[i]; o.x -= scroll; if(o.x < -40) obstacles.splice(i,1); }
      for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; e.x += e.vx - scroll*0.1; if(e.x < -60) enemies.splice(i,1); }

      // Collisions
      // Boat colliding with obstacle
      for(let i=obstacles.length-1;i>=0;i--){ const o=obstacles[i]; if(dist(boat,o) < (boat.width/2 + o.r)){
        // hull damage and debris
        boat.hull -= (o.type==='rock')? 12:6; obstacles.splice(i,1); for(let k=0;k<8;k++){ debris.push({x:o.x,y:o.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:40}); }
        if(boat.hull<=0) return gameOver(); }
      }
      // Boat vs enemy: ramming mechanic
      for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(dist(boat,e) < (boat.width/2 + e.r)){
        if(ram){ // if player rams while near, destroy enemy
          enemies.splice(i,1); score(12); for(let k=0;k<10;k++) debris.push({x:e.x,y:e.y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:50});
        } else { boat.hull -= 18; enemies.splice(i,1); for(let k=0;k<6;k++) debris.push({x:e.x,y:e.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:40}); if(boat.hull<=0) return gameOver(); }
      }}

      // Debris update
      for(let i=debris.length-1;i>=0;i--){ const d=debris[i]; d.x+=d.vx; d.y+=d.vy; d.vy+=0.12; d.life--; if(d.life<=0) debris.splice(i,1); }

      // Spawn gentle waves for visuals
      draw();
      requestAnimationFrame(update);
    }

    function score(n){ distance += n*2; }
    function dist(a,b){ const dx=(a.x||a.x===0? a.x: a.x), dy=(a.y||a.y===0? a.y: a.y); return Math.hypot(a.x-b.x, a.y-b.y); }

    function draw(){
      ctx.clearRect(0,0,W,H);
      // sky
      const sky = ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#0b3b57'); sky.addColorStop(1,'#03232a'); ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

      // distant horizon
      ctx.fillStyle='#073547'; ctx.fillRect(0,H*0.6 - 6, W, H*0.6);

      // moving waves
      for(let i=0;i<5;i++){ ctx.globalAlpha = 0.12 + i*0.06; ctx.fillStyle = '#0f5b73'; ctx.beginPath(); const amp=6 + i*3; const y = H*0.6 + i*6; ctx.moveTo(0,y); for(let x=0;x<=W;x+=20){ ctx.lineTo(x, y + Math.sin((x*0.02) + frames*0.02 + i)*amp); } ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill(); } ctx.globalAlpha=1;

      // Obstacles
      obstacles.forEach(o=>{ ctx.fillStyle = o.type==='rock'? '#8b6b56' : '#ffd86b'; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill(); });
      // Enemies
      enemies.forEach(e=>{ ctx.fillStyle='#b34f3f'; ctx.beginPath(); ctx.ellipse(e.x,e.y,e.r+6,e.r-2,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#3b2b25'; ctx.fillRect(e.x-6,e.y-2,12,4); });

      // Boat
      ctx.save(); ctx.translate(boat.x,boat.y); ctx.fillStyle='#cdb28a'; ctx.beginPath(); ctx.ellipse(0,0,boat.width/2,boat.height/2,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#8a5c3b'; ctx.fillRect(-10,-6,20,12); ctx.restore();

      // Debris
      debris.forEach(d=>{ ctx.fillStyle='#d9c7a6'; ctx.fillRect(d.x,d.y,2,2); });

      // UI
      document.getElementById('ui').textContent = `Distance: ${Math.floor(distance)} m  |  Hull: ${Math.max(0,Math.floor(boat.hull))}  |  Speed: ${boat.speed.toFixed(1)} `;
    }

    function gameOver(){ alert(`Your vessel sank! Distance: ${Math.floor(distance)} m`); location.reload(); }

    // restart button
    document.getElementById('restart').addEventListener('click', ()=> location.reload());

    update();
  
